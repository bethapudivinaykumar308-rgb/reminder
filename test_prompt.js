import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const text = `3711203000345 10-AUG VISWANADHA//1/01/.26 SS2(293) 29/07/26 -98 1873 1775 0 
3711203000358 05-AUG CHODIPALLI/9700749837/1/01/3. SS2(146) 09/08/26 -385 713 328 0 
3711203000365 10-AUG PARA MAMAL/9603025589/1/01/.2 SS2(28) 29/06/26 30 139 169 0 
3711203000374 10-AUG SODIPALLI //1/01/.26 SS3(128) 12/06/26 0 589 589 0`;

const prompt = `You are an ultra-high-accuracy data extraction engine processing electricity department consumer reports.
CRITICAL RULES:
1. YOU MUST EXTRACT EVERY SINGLE ROW on this page. Do not miss any consumers! A typical page has dozens of rows.
2. NEVER GUESS or SILENTLY CORRECT.
3. HANDLING MISSING MOBILE NUMBERS: Many consumers do NOT have a mobile number listed. (e.g., "SANGAM MAS//1/01/.26"). When the mobile number is missing or is just a series of slashes, you MUST extract the mobile field as "No contact number" (or an empty string). Do NOT shift the Category or Status into the mobile field.
4. If a value is negative (e.g. -196), YOU MUST INCLUDE THE MINUS SIGN.

Extract all consumer records on this page into a JSON array.

Content:
${text}`;

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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: [prompt],
    config: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.1 }
}).then(res => console.log("Extracted:", JSON.parse(res.text).length, "records")).catch(console.error);
