import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const pdfBytes = fs.readFileSync('test.pdf');
  const base64Pdf = Buffer.from(pdfBytes).toString('base64');
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = "Extract all consumer records on this page into a JSON array.";
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        uscno: { type: Type.STRING },
        name: { type: Type.STRING },
        arr: { type: Type.NUMBER },
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        prompt,
        { inlineData: { data: base64Pdf, mimeType: "application/pdf" } }
      ],
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    console.log("3.6-flash output:", response.text);
  } catch (e) {
    console.error("3.6-flash error:", e.message);
  }
}
test();
