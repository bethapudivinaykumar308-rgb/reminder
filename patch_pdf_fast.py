import os

with open('server.ts', 'r') as f:
    content = f.read()

import_pdf = "import fs from 'fs';"
if "import pdfParse from 'pdf-parse';" not in content:
    content = content.replace(import_pdf, "import fs from 'fs';\nimport pdfParse from 'pdf-parse';")

old_processPdfJob = """
async function processPdfJob(jobId: string, filePath: string) {
  try {
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();
    
    extractionJobs[jobId].totalPages = totalPages;
    extractionJobs[jobId].status = 'processing';
    extractionJobs[jobId].records = [];
    
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

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
        
        const prompt = `You are an ultra-high-accuracy data extraction engine processing electricity department consumer reports.
CRITICAL RULES:
1. YOU MUST EXTRACT EVERY SINGLE ROW on this page. Do not miss any consumers! A typical page has dozens of rows.
2. NEVER GUESS or SILENTLY CORRECT.
3. HANDLING MISSING MOBILE NUMBERS: Many consumers do NOT have a mobile number listed. (e.g., "SANGAM MAS//1/01/.26"). When the mobile number is missing or is just a series of slashes, you MUST extract the mobile field as "No contact number" (or an empty string). Do NOT shift the Category or Status into the mobile field.
4. If a value is negative (e.g. -196), YOU MUST INCLUDE THE MINUS SIGN.

Extract all consumer records on this page into a JSON array. 
For each record, provide:
- uscno: string (the Uscno identifier, preserve leading zeros)
- dcDate: string (DC-Dt)
- name: string
- mobile: string (if missing, return "No contact number")
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

        let recordsText = "[]";
        let success = false;
        
        // Anti-Rate-Limit: sleep 4.5 seconds between pages to respect 15 RPM Free Tier Limit
        if (i > 0) {
          await delay(4500);
        }
        
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!success && attempts < maxAttempts) {
          for (const modelName of MODELS_TO_TRY) {
            try {
              const response = await ai.models.generateContent({
                model: modelName,
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
              recordsText = response.text || "[]";
              success = true;
              break;
            } catch (err: any) {
               console.warn(`PDF Job: Gemini model ${modelName} call bypassed (${err?.message || "Quota/Rate Limit"}). Trying next fallback...`);
               if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota")) {
                 console.log("Rate limited! Sleeping for 15 seconds before retrying...");
                 await delay(15000);
               }
            }
          }
          attempts++;
        }
        
        if (!success) {
           console.error(`PDF Job: All models failed for page ${i+1} after retries.`);
        }

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
"""

new_processPdfJob = """
async function processPdfJob(jobId: string, filePath: string) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    
    extractionJobs[jobId].totalPages = 1; // Will update after parsing
    extractionJobs[jobId].status = 'processing';
    extractionJobs[jobId].records = [];
    
    // Use pdf-parse for local lightning-fast structured extraction (0 quota usage)
    const pdfData = await pdfParse(dataBuffer);
    
    // Optional: Try to estimate pages
    const text = pdfData.text;
    extractionJobs[jobId].totalPages = pdfData.numpages || Math.ceil(text.length / 3000);
    
    const lines = text.split(/\\r?\\n/);
    const regex = /^(\\d{13})\\s+(\\d{2}-[A-Za-z]{3})\\s+(.+?)\\s+([\\S]+)\\s+(\\d{2}\\/\\d{2}\\/\\d{2})\\s+(-?\\d+(?:\\.\\d+)?)\\s+(-?\\d+(?:\\.\\d+)?)\\s+(-?\\d+(?:\\.\\d+)?)\\s+(-?\\d+(?:\\.\\d+)?)/;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const match = line.match(regex);
        if (match) {
            // Extract mobile from Name field
            const nameField = match[3];
            let name = nameField;
            let mobile = "No contact number";
            const parts = nameField.split('/');
            if (parts.length > 1) {
                 name = parts[0];
                 // Mobile is usually the second part if it's 10 digits
                 if (parts[1].match(/^\\d{10}$/)) {
                     mobile = parts[1];
                 }
            }
            
            const rawRecord = {
               uscno: match[1],
               dcDate: match[2],
               name: name,
               mobile: mobile,
               poleRaw: match[4],
               lpdt: match[5],
               arr: parseFloat(match[6]),
               cmd: parseFloat(match[7]),
               totalAmount: parseFloat(match[8]),
               acd: parseFloat(match[9]),
               rawRow: line
            };
            
            const validated = validateExtractedRecord(rawRecord, line);
            validated.physicalPdfPage = Math.floor(i / 60) + 1; // Approximate
            validated.reportPage = validated.physicalPdfPage;
            validated.id = crypto.randomUUID();
            extractionJobs[jobId].records.push(validated);
        }
    }
    
    extractionJobs[jobId].processedPages = extractionJobs[jobId].totalPages;
    extractionJobs[jobId].status = 'completed';
    // Clean up file
    fs.unlinkSync(filePath);
    
  } catch (error) {
    console.error("PDF Job Error:", error);
    extractionJobs[jobId].status = 'failed';
    extractionJobs[jobId].error = String(error);
  }
}
"""

if "async function processPdfJob(jobId: string, filePath: string) {" in content:
    content = content.replace(old_processPdfJob.strip(), new_processPdfJob.strip())
else:
    print("Could not find processPdfJob block")

with open('server.ts', 'w') as f:
    f.write(content)
