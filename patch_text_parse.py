import os

with open('server.ts', 'r') as f:
    content = f.read()

old_logic = """
    let contentsPayload: any;
    if (fileBase64 && mimeType) {
      contentsPayload = {
        parts: [
          {
            inlineData: {
              data: fileBase64,
              mimeType: mimeType,
            },
          },
          {
            text: `${systemPrompt}\\n\\nAnalyze this document and extract all unpaid electricity bill consumers into structured JSON format.`,
          },
        ],
      };
    } else {
      contentsPayload = `${systemPrompt}\\n\\nDocument Raw Content:\\n${(rawText || "").slice(0, 40000)}`;
    }

    const schema = {
      type: Type.ARRAY,
      description: "List of identified unpaid electricity bill consumers",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          consumerId: { type: Type.STRING },
          meterNo: { type: Type.STRING },
          phone: { type: Type.STRING },
          email: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          dueDate: { type: Type.STRING },
          overdueDays: { type: Type.INTEGER },
          tariffType: { type: Type.STRING },
          address: { type: Type.STRING },
          status: { type: Type.STRING },
          notes: { type: Type.STRING },
        },
        required: ["name", "consumerId", "phone", "amount", "dueDate", "overdueDays", "tariffType"],
      },
    };

    // Algorithmic Fallback for Parsing in case AI models are rate limited
    const fallbackGenerator = () => {
      const text = rawText || "";
      const lines = text.split(/\\r?\\n/).filter((l: string) => l.trim().length > 0);
      const records: any[] = [];

      // Look for tabular or comma/tab separated lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === 0 && (line.toLowerCase().includes("name") || line.toLowerCase().includes("consumer"))) {
          continue; // skip header
        }

        const parts = line.split(/[,\\t|]+/).map((p: string) => p.trim().replace(/^["']|["']$/g, ""));
        if (parts.length >= 3) {
          const name = parts[0] || `Consumer ${i + 1}`;
          let phone = parts.find((p: string) => /\\d{10}/.test(p.replace(/\\D/g, ""))) || "+91 98450 1200" + (i % 10);
          let amountStr = parts.find((p: string) => /^\\$?\\s*₹?\\s*\\d+(\\.\\d+)?$/.test(p.replace(/,/g, ""))) || "1500";
          let amount = parseFloat(amountStr.replace(/[^0-9.]/g, "")) || 1200 + i * 350;

          records.push({
            name,
            consumerId: parts[1] || `EB-${1000 + i}`,
            meterNo: parts[2] || `MTR-${8000 + i}`,
            phone: phone.replace(/[^\\d+]/g, "").slice(-10),
            amount,
            dueDate: new Date(Date.now() - (15 + i * 5) * 86400000).toISOString().split("T")[0],
            overdueDays: 15 + i * 5,
            tariffType: i % 3 === 0 ? "Commercial" : i % 5 === 0 ? "Industrial" : "Domestic",
            address: parts[3] || `Service Sector ${((i % 8) + 1)}, Grid North`,
            status: "unpaid",
            notes: "Imported via intelligent document processor",
          });
        }
      }

      if (records.length === 0) {
        // Fallback default sample records
        records.push(
          {
            name: "Rajesh Sharma",
            consumerId: "EB-10921",
            meterNo: "MTR-8841",
            phone: "+91 98450 12345",
            amount: 3450,
            dueDate: "2026-08-01",
            overdueDays: 28,
            tariffType: "Domestic",
            address: "Flat 402, Sunshine Apts, Phase 1",
            status: "unpaid",
            notes: "Multiple reminders ignored",
          },
          {
            name: "Lakshmi Narayana",
            consumerId: "EB-10922",
            meterNo: "MTR-2234",
            phone: "+91 99880 23456",
            amount: 12500,
            dueDate: "2026-06-15",
            overdueDays: 75,
            tariffType: "Commercial",
            address: "Shop 14, Main Market, Phase 2",
            status: "unpaid",
            notes: "Critical disconnection risk",
          }
        );
      }
      return records;
    };

    const parsedData = await safeGenerateJson({
      contents: contentsPayload,
      schema,
      fallbackGenerator,
    });

    res.json({ success: true, count: parsedData.length, data: parsedData });
"""

new_logic = """
    const schema = {
      type: Type.ARRAY,
      description: "List of identified unpaid electricity bill consumers",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          consumerId: { type: Type.STRING },
          meterNo: { type: Type.STRING },
          phone: { type: Type.STRING },
          email: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          dueDate: { type: Type.STRING },
          overdueDays: { type: Type.INTEGER },
          tariffType: { type: Type.STRING },
          address: { type: Type.STRING },
          status: { type: Type.STRING },
          notes: { type: Type.STRING },
        },
        required: ["name", "consumerId", "phone", "amount", "dueDate", "overdueDays", "tariffType"],
      },
    };

    // If fileBase64 is used (image/excel/etc uploaded), send to multimodal
    if (fileBase64 && mimeType) {
      const contentsPayload = {
        parts: [
          { inlineData: { data: fileBase64, mimeType: mimeType } },
          { text: `${systemPrompt}\\n\\nAnalyze this document and extract all unpaid electricity bill consumers into structured JSON format. If a mobile number is missing or invalid, extract it as "No contact number".` }
        ]
      };
      
      const parsedData = await safeGenerateJson({
        contents: contentsPayload,
        schema,
        fallbackGenerator: () => ([]),
      });
      return res.json({ success: true, count: parsedData.length, data: parsedData });
    }
    
    // If rawText is provided, chunk it to avoid output token limits (8192 tokens max)
    const text = rawText || "";
    const lines = text.split(/\\r?\\n/).filter((l: string) => l.trim().length > 0);
    const CHUNK_SIZE = 40; // ~40 lines per chunk
    let allRecords: any[] = [];
    
    for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
        const chunkLines = lines.slice(i, i + CHUNK_SIZE);
        const contentsPayload = `${systemPrompt}\\n\\nCRITICAL: If a phone number is missing, extract it as "No contact number".\\n\\nDocument Chunk:\\n${chunkLines.join("\\n")}`;
        
        // Use exponential backoff internally in safeGenerateJson or we add delay here
        if (i > 0) {
            await delay(4500); // Prevent rate limiting (15 RPM)
        }
        
        let chunkData: any[] = [];
        let success = false;
        let attempts = 0;
        
        while (!success && attempts < 3) {
            try {
                chunkData = await safeGenerateJson({
                    contents: contentsPayload,
                    schema,
                    fallbackGenerator: () => { throw new Error("Fallback triggered, retrying"); }
                });
                success = true;
            } catch (err) {
                console.log("Chunk generation failed/rate limited. Sleeping 15s...");
                await delay(15000);
                attempts++;
            }
        }
        
        if (success && Array.isArray(chunkData)) {
            allRecords = allRecords.concat(chunkData);
        }
    }

    res.json({ success: true, count: allRecords.length, data: allRecords });
"""

if "let contentsPayload: any;" in content:
    content = content.replace(old_logic.strip(), new_logic.strip())

with open('server.ts', 'w') as f:
    f.write(content)
