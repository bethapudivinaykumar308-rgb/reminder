import os

file_path = 'src/components/BulkAiCallModal.tsx'
with open(file_path, 'r') as f:
    content = f.read()

live_call_logic = """
        // Place live backend request
        try {
          const res = await fetch('/api/call/place-outbound', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              consumerPhone: consumer.phone,
              consumerName: consumer.name,
              scriptText: scriptText,
              twilioSid: settings.twilioSid || '',
              twilioAuth: settings.twilioAuthToken || '',
              twilioFrom: settings.twilioPhoneNumber || ''
            })
          });
          const data = await res.json();
          if (data.success && data.mode === 'live_pstn_call') {
             callOutcome = 'connected';
             extractedCommitment = 'Call placed via Twilio';
          }
        } catch(e) {
          console.warn("Live API error", e);
        }
"""

if 'const data = await res.json();' not in content:
    # Insert inside handleSendBulkAiCall
    # Let's find a good place. There is a loop: for (let i = 0; i < consumers.length; i++)
    content = content.replace("        setActiveCallPhase('connected');", "        setActiveCallPhase('connected');\n" + live_call_logic)

with open(file_path, 'w') as f:
    f.write(content)
