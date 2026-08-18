import os

with open('server.ts', 'r') as f:
    content = f.read()

start_idx = content.find('app.post("/api/call/place-outbound"')
end_idx = content.find('// Vite middleware setup')

if start_idx != -1 and end_idx != -1:
    prefix = content[:start_idx]
    suffix = content[end_idx:]
    
    new_routes = """
// In-memory call session store for Twilio Interactive Voice
const activeTwilioCalls: { [callSid: string]: { 
   consumer: any; 
   history: {role: string, text: string}[]; 
   utilityName: string;
   language: string;
}} = {};

app.post("/api/call/place-outbound", async (req, res) => {
  try {
    const { consumer, scriptText, appBaseUrl, twilioSid, twilioAuth, twilioFrom, utilityName, language } = req.body;
    
    if (!consumer || !consumer.phone) {
      return res.status(400).json({ error: "Missing consumer phone number" });
    }

    if (twilioSid && twilioAuth && twilioFrom) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Calls.json`;
      
      const params = new URLSearchParams();
      params.append('To', consumer.phone);
      params.append('From', twilioFrom);
      // Connect to our intelligent Webhook for dynamic human-like conversation
      params.append('Url', `${appBaseUrl}/api/call/twilio-connect`);
      
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

      const callSid = responseData.sid;
      activeTwilioCalls[callSid] = {
        consumer,
        history: [],
        utilityName: utilityName || 'Electricity Board',
        language: language || 'Telugu'
      };

      return res.json({
        success: true,
        mode: "live_pstn_call",
        callSid: callSid,
        message: `Live Conversational AI call dispatched to ${consumer.phone} via Twilio.`
      });
    }

    // Fallback WebRTC mode
    return res.json({
      success: true,
      mode: "browser_webrtc_simulation",
      message: `Simulated live call initiated. For real human-like PSTN calls, provide Twilio credentials in Settings.`
    });
  } catch (error: any) {
    console.error("Live Call dispatch error:", error);
    return res.status(500).json({ error: error.message || "Failed to dispatch live phone call" });
  }
});

app.post("/api/call/twilio-connect", async (req, res) => {
  const callSid = req.body.CallSid;
  const session = activeTwilioCalls[callSid];
  
  const isTelugu = !session || session.language === 'Telugu';
  let greeting = `Hello ${session?.consumer?.name || ''}, this is Astra from ${session?.utilityName || 'Customer Support'}. We are calling regarding your unpaid electricity bill of rupees ${session?.consumer?.amount || ''}. Are you available to speak?`;
  
  if (isTelugu) {
     greeting = `నమస్కారం ${session?.consumer?.name || ''} గారు, నేను ${session?.utilityName || 'విద్యుత్ శాఖ'} నుండి మాట్లాడుతున్నాను. మీ బకాయి ${session?.consumer?.amount || ''} రూపాయల గురించి ఈ కాల్ చేసాము. మీకు వినబడుతుందా?`;
  }
  
  if (session) {
     session.history.push({ role: 'agent', text: greeting });
  }

  // Use te-IN for Speech Recognition, and hi-IN Polly.Aditi for TTS (best fallback for Indian accents in Twilio)
  const twiml = `
    <Response>
      <Say voice="Polly.Aditi" language="hi-IN">${greeting}</Say>
      <Gather input="speech" action="/api/call/twilio-gather" speechTimeout="auto" language="te-IN" hints="కట్టేసాను, రేపు, జీతం, లింక్, pay tomorrow, salary">
      </Gather>
    </Response>
  `;
  res.type('text/xml').send(twiml);
});

app.post("/api/call/twilio-gather", async (req, res) => {
  const callSid = req.body.CallSid;
  const speechResult = req.body.SpeechResult;
  const session = activeTwilioCalls[callSid];

  if (!session) {
     return res.type('text/xml').send('<Response><Hangup/></Response>');
  }

  if (!speechResult) {
     const twiml = `
        <Response>
          <Gather input="speech" action="/api/call/twilio-gather" speechTimeout="auto" language="te-IN">
            <Say voice="Polly.Aditi" language="hi-IN">హలో, దయచేసి సమాధానం ఇవ్వండి.</Say>
          </Gather>
        </Response>
     `;
     return res.type('text/xml').send(twiml);
  }

  session.history.push({ role: 'user', text: speechResult });

  try {
     const prompt = `You are Astra, a polite AI collections agent for ${session.utilityName}.
Consumer Profile: ${JSON.stringify(session.consumer)}
Prior Conversation: ${JSON.stringify(session.history)}
Customer Just Said: "${speechResult}"
Task: Respond contextually to the customer in ${session.language}. If they promise to pay, thank them and say you will send an SMS link, then hang up. If they say they already paid, say you will verify it, then hang up. Keep the response VERY SHORT, 1-2 conversational sentences for a live phone call.
Return JSON format: { "agentSpokenResponse": "your text", "shouldHangUp": boolean }`;

     const schema = {
       type: Type.OBJECT,
       properties: {
         agentSpokenResponse: { type: Type.STRING },
         shouldHangUp: { type: Type.BOOLEAN }
       },
       required: ["agentSpokenResponse", "shouldHangUp"]
     };

     const turnData = await safeGenerateJson({
        contents: prompt,
        schema: schema,
        fallbackGenerator: () => ({ agentSpokenResponse: "సరే, మీ సమాచారాన్ని నమోదు చేశాను. ధన్యవాదాలు.", shouldHangUp: true })
     });

     const responseText = (turnData as any).agentSpokenResponse;
     const shouldHangUp = (turnData as any).shouldHangUp;

     session.history.push({ role: 'agent', text: responseText });

     let twiml = `<Response><Say voice="Polly.Aditi" language="hi-IN">${responseText}</Say>`;
     if (shouldHangUp) {
        twiml += `<Hangup/></Response>`;
        delete activeTwilioCalls[callSid];
     } else {
        twiml += `<Gather input="speech" action="/api/call/twilio-gather" speechTimeout="auto" language="te-IN"></Gather></Response>`;
     }
     res.type('text/xml').send(twiml);

  } catch (err) {
     console.error("Twilio Gather Error", err);
     res.type('text/xml').send('<Response><Say voice="Polly.Aditi" language="hi-IN">సాంకేతిక సమస్య ఏర్పడింది. కాల్ కట్ చేస్తున్నాము.</Say><Hangup/></Response>');
  }
});

"""
    
    with open('server.ts', 'w') as f:
        f.write(prefix + new_routes + suffix)
