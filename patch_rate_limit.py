import os

with open('server.ts', 'r') as f:
    content = f.read()

# Add a sleep function at the top if it doesn't exist
if 'const delay = (ms: number) => new Promise' not in content:
    content = content.replace(
        'const ai = new GoogleGenAI({',
        'const delay = (ms: number) => new Promise(res => setTimeout(res, ms));\n\nconst ai = new GoogleGenAI({'
    )

old_loop = """
        let recordsText = "[]";
        let success = false;
        
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
          }
        }
        
        if (!success) {
           console.error(`PDF Job: All models failed for page ${i+1}.`);
        }
"""

new_loop = """
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
"""

content = content.replace(old_loop.strip(), new_loop.strip())

with open('server.ts', 'w') as f:
    f.write(content)
