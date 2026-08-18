import os

file_path = 'server.ts'
with open(file_path, 'r') as f:
    content = f.read()

twilio_code = """
// 6. Live Outbound Phone Call API (Twilio / Exotel Integration)
app.post("/api/call/place-outbound", async (req, res) => {
  try {
    const { consumerPhone, scriptText, consumerName, twilioSid, twilioAuth, twilioFrom } = req.body;
    
    if (!consumerPhone) {
      return res.status(400).json({ error: "Missing consumer phone number" });
    }

    // If Twilio credentials are provided, place a REAL phone call using Twilio Programmable Voice
    if (twilioSid && twilioAuth && twilioFrom) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Calls.json`;
      
      // Use TwiML to speak the generated script
      const twiml = `<Response><Say voice="Polly.Aditi" language="hi-IN">${scriptText}</Say></Response>`;
      
      const params = new URLSearchParams();
      params.append('To', consumerPhone);
      params.append('From', twilioFrom);
      params.append('Twiml', twiml);

      const twilioRes = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const responseData = await twilioRes.json();
      if (!twilioRes.ok) {
        throw new Error(responseData.message || "Twilio call failed");
      }

      return res.json({
        success: true,
        mode: "live_pstn_call",
        callSid: responseData.sid,
        message: `Live PSTN AI call dispatched to ${consumerPhone} via Twilio.`
      });
    }

    // Fallback: WebRTC Browser-based Voice Agent simulation
    return res.json({
      success: true,
      mode: "browser_webrtc_simulation",
      message: `Simulated live call to ${consumerPhone} initiated. For real PSTN calls, provide Twilio credentials in Settings.`
    });
  } catch (error: any) {
    console.error("Live Call dispatch error:", error);
    return res.status(500).json({ error: error.message || "Failed to dispatch live phone call" });
  }
});
"""

if 'app.post("/api/call/place-outbound"' not in content:
    content = content.replace("// Vite middleware setup", twilio_code + "\n// Vite middleware setup")

with open(file_path, 'w') as f:
    f.write(content)
