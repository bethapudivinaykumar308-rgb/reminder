import os

with open('server.ts', 'r') as f:
    content = f.read()

# Replace hardcoded model with robust fallback in processPdfJob
old_code = """
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
"""

new_code = """
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

if "model: \"gemini-3.1-pro-preview\"" in content and "const recordsText = response.text || \"[]\";" in content:
    content = content.replace(old_code.strip(), new_code.strip())

with open('server.ts', 'w') as f:
    f.write(content)
