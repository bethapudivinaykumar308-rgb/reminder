import os

with open('server.ts', 'r') as f:
    content = f.read()

imports = """
import multer from 'multer';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import crypto from 'crypto';

// Setup multer for PDF uploads
const upload = multer({ dest: 'uploads/' });

// In-memory extraction jobs store (In production, use Firestore/Redis)
const extractionJobs: Record<string, any> = {};

"""

if 'multer' not in content:
    content = content.replace('import { GoogleGenAI, Type, Schema } from "@google/genai";', 'import { GoogleGenAI, Type, Schema } from "@google/genai";\n' + imports)

# We need a robust deterministic validation block for the PDF extraction.
pdf_routes = """
// Deterministic Validation Rules for PDF Data
function validateExtractedRecord(record: any, rawRowText: string) {
  let errors = [];
  let conf = 100;
  let status: 'VERIFIED' | 'AI_EXTRACTED' | 'NEEDS_VERIFICATION' = 'AI_EXTRACTED';

  // 1. Math check (Arr + CMD ≈ TotAmt)
  let arrVal = parseFloat(record.arr);
  let cmdVal = parseFloat(record.cmd);
  let totVal = parseFloat(record.totalAmount);
  
  if (!isNaN(arrVal) && !isNaN(cmdVal) && !isNaN(totVal)) {
    if (Math.abs(arrVal + cmdVal - totVal) > 2) {
      errors.push("FINANCIAL_VALIDATION_FAILED: Arr + CMD != TotAmt");
      conf -= 40;
    }
  } else {
    errors.push("FINANCIAL_VALIDATION_FAILED: Missing or invalid numeric values");
    conf -= 50;
  }

  // 2. Negative numbers check (e.g. if arr > 0 but the original text has a minus sign)
  if (arrVal > 0 && String(record.arr).includes('-')) {
    errors.push("SIGN_MISMATCH: Negative sign detected in raw value but parsed as positive.");
    conf -= 30;
  }

  // 3. USCNO validation
  if (!record.uscno || String(record.uscno).length < 5) {
    errors.push("UScno_NEEDS_VERIFICATION: Too short or missing");
    conf -= 30;
  }

  // 4. Mobile number check
  if (!record.mobile || String(record.mobile).trim() === '' || String(record.mobile).trim().toLowerCase() === 'null') {
    record.mobile = null;
    errors.push("MOBILE_MISSING");
  } else if (String(record.mobile).length < 10) {
    errors.push("MOBILE_SUSPICIOUS");
    conf -= 10;
  }
  
  // 5. Pole check
  if (!record.poleNumber) {
    errors.push("POLE_FORMAT_UNRECOGNIZED");
    conf -= 20;
  }

  if (conf < 85 || errors.some(e => e.includes("FAILED") || e.includes("NEEDS_VERIFICATION"))) {
    status = 'NEEDS_VERIFICATION';
  } else {
    status = 'AI_EXTRACTED';
  }

  return {
    ...record,
    confidence: Math.max(0, conf),
    validationErrors: errors,
    verificationStatus: status
  };
}

async function processPdfJob(jobId: string, filePath: string) {
  try {
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();
    
    extractionJobs[jobId].totalPages = totalPages;
    extractionJobs[jobId].status = 'processing';
    extractionJobs[jobId].records = [];
    
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    // Process page by page
    for (let i = 0; i < totalPages; i++) {
      try {
        const subDoc = await PDFDocument.create();
        const [copiedPage] = await subDoc.copyPages(pdfDoc, [i]);
        subDoc.addPage(copiedPage);
        const subPdfBytes = await subDoc.save();
        const base64Pdf = Buffer.from(subPdfBytes).toString('base64');
        
        const prompt = `You are an ultra-high-accuracy data extraction engine. You are extracting electricity department consumer reports.
CRITICAL RULE: NEVER GUESS. NEVER SILENTLY CORRECT. NEVER SHIFT COLUMNS.
If the mobile number is missing (e.g. CHIRIPILLI//1/01/1.26), extract mobile as empty string. Do not shift the category or status into the mobile field.
If a value is negative (e.g. -196), YOU MUST INCLUDE THE MINUS SIGN.
Extract all consumer records on this page into a JSON array. 
For each record, provide:
- uscno: string (the Uscno identifier, preserve leading zeros)
- dcDate: string (DC-Dt)
- name: string
- mobile: string (if missing, return empty string)
- category: string (Cat)
- status: string (Sta)
- load: string (Load)
- poleRaw: string (The exact original string for Poleno(Unts))
- poleNumber: string (The extracted pole part, if unclear return empty string)
- units: string (The extracted units part inside parentheses, if unclear return empty string)
- lpdt: string
- arr: number (Arrears, preserving negatives)
- cmd: number (Current Month Demand)
- totalAmount: number (TotAmt)
- acd: number
- rawRow: string (The raw text of the entire row for auditing)`;

        const schema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              uscno: { type: Type.STRING },
              dcDate: { type: Type.STRING },
              name: { type: Type.STRING },
              mobile: { type: Type.STRING },
              category: { type: Type.STRING },
              status: { type: Type.STRING },
              load: { type: Type.STRING },
              poleRaw: { type: Type.STRING },
              poleNumber: { type: Type.STRING },
              units: { type: Type.STRING },
              lpdt: { type: Type.STRING },
              arr: { type: Type.NUMBER },
              cmd: { type: Type.NUMBER },
              totalAmount: { type: Type.NUMBER },
              acd: { type: Type.NUMBER },
              rawRow: { type: Type.STRING },
            },
            required: ["uscno", "name", "poleRaw", "arr", "cmd", "totalAmount"]
          }
        };

        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: [
            prompt,
            { inlineData: { data: base64Pdf, mimeType: "application/pdf" } }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.1
          }
        });

        const recordsText = response.text || "[]";
        let pageRecords = [];
        try {
          pageRecords = JSON.parse(recordsText);
        } catch(e) {
          console.warn(`Failed to parse page ${i+1}`);
        }

        for (const rec of pageRecords) {
          const validated = validateExtractedRecord(rec, rec.rawRow || "");
          validated.physicalPdfPage = i + 1;
          validated.reportPage = i + 1; // Assuming 1:1 for now
          validated.id = crypto.randomUUID();
          extractionJobs[jobId].records.push(validated);
        }
        
      } catch (err) {
        console.error(`Error processing page ${i+1} of job ${jobId}:`, err);
      }
      
      extractionJobs[jobId].processedPages = i + 1;
    }
    
    extractionJobs[jobId].status = 'completed';
    // Clean up file
    fs.unlinkSync(filePath);
    
  } catch (error) {
    console.error("PDF Job Error:", error);
    extractionJobs[jobId].status = 'failed';
    extractionJobs[jobId].error = String(error);
  }
}

app.post('/api/upload-pdf', upload.single('report'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const jobId = crypto.randomUUID();
  extractionJobs[jobId] = {
    id: jobId,
    filename: req.file.originalname,
    status: 'pending',
    totalPages: 0,
    processedPages: 0,
    records: [],
    createdAt: new Date().toISOString()
  };

  // Start background processing
  processPdfJob(jobId, req.file.path);

  res.json({ success: true, jobId });
});

app.get('/api/extraction-job/:id', (req, res) => {
  const job = extractionJobs[req.params.id];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  
  // We don't send all records while processing to save bandwidth, only stats
  res.json({
    id: job.id,
    filename: job.filename,
    status: job.status,
    totalPages: job.totalPages,
    processedPages: job.processedPages,
    totalRecords: job.records ? job.records.length : 0,
    error: job.error,
    // only send records if completed
    records: job.status === 'completed' ? job.records : undefined
  });
});

"""

if 'app.post(\'/api/upload-pdf\'' not in content:
    content = content.replace('// Vite middleware setup', pdf_routes + '\n// Vite middleware setup')

with open('server.ts', 'w') as f:
    f.write(content)
