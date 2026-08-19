import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  // Let's just find the pdf file in uploads/ if there is one
  const files = fs.readdirSync('uploads/');
  if (files.length === 0) return console.log("No files in uploads/");
  const filePath = 'uploads/' + files[0];
  
  const pdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  console.log("Total pages:", pdfDoc.getPageCount());
  
  // Try page 3 (index 2)
  const subDoc = await PDFDocument.create();
  const [copiedPage] = await subDoc.copyPages(pdfDoc, [2]);
  subDoc.addPage(copiedPage);
  const subPdfBytes = await subDoc.save();
  const base64Pdf = Buffer.from(subPdfBytes).toString('base64');
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `You are an ultra-high-accuracy data extraction engine processing electricity department consumer reports.
CRITICAL RULES:
1. YOU MUST EXTRACT EVERY SINGLE ROW on this page. Do not miss any consumers! A typical page has dozens of rows.
2. NEVER GUESS or SILENTLY CORRECT.
3. HANDLING MISSING MOBILE NUMBERS: Many consumers do NOT have a mobile number listed. (e.g., "SANGAM MAS//1/01/.26"). When the mobile number is missing or is just a series of slashes, you MUST extract the mobile field as "No contact number" (or an empty string). Do NOT shift the Category or Status into the mobile field.
4. If a value is negative (e.g. -196), YOU MUST INCLUDE THE MINUS SIGN.

Extract all consumer records on this page into a JSON array.`;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        uscno: { type: Type.STRING },
        name: { type: Type.STRING },
        mobile: { type: Type.STRING },
        poleRaw: { type: Type.STRING },
        arr: { type: Type.NUMBER },
        cmd: { type: Type.NUMBER },
        totalAmount: { type: Type.NUMBER },
      },
      required: ["uscno", "name", "poleRaw", "arr", "cmd", "totalAmount"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
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
    console.log(response.text);
  } catch (e) {
    console.error(e);
  }
}
test();
