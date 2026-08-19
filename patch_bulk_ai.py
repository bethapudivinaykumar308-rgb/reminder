import os

with open('src/components/BulkAiCallModal.tsx', 'r') as f:
    content = f.read()

# Replace handleStartBulkCalls body
new_handler = """
  const handleStartBulkCalls = async () => {
    setIsCallingBatch(true);
    setCallLogsList([]);

    for (let i = 0; i < consumers.length; i++) {
      if (!isCallingBatch && i > 0) break; // Allow manual abort

      const consumer = consumers[i];
      setCurrentCallIndex(i);
      setActiveConsumer(consumer);
      setCallProgressPct(Math.round(((i) / consumers.length) * 100));

      setActiveCallPhase('dialing');
      
      const script = renderScriptForConsumer(consumer);
      setActiveLiveTranscript(`Dispatching live PSTN call to ${consumer.phone}...`);

      try {
        const res = await fetch('/api/call/place-outbound', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consumer,
            scriptText: script,
            appBaseUrl: window.location.origin,
            twilioSid: settings.twilioSid || '',
            twilioAuth: settings.twilioAuth || '',
            twilioFrom: settings.twilioFrom || '',
            utilityName: settings.utilityName,
            language: 'Telugu' // Can make dynamic
          })
        });

        const data = await res.json();
        
        if (data.mode === 'live_pstn_call') {
            setActiveCallPhase('connected');
            setActiveLiveTranscript(`Call Connected via Twilio (Call SID: ${data.callSid}). Live conversational AI agent is talking.`);
            
            // Wait simulated call duration for the batch to continue (In reality, we'd use Webhooks for status)
            await new Promise(r => setTimeout(r, 5000));
            
            const log: DispatchLog = {
                id: `log-call-${Date.now()}-${consumer.id}`,
                type: 'aicall',
                consumerId: consumer.consumerId,
                consumerName: consumer.name,
                phone: consumer.phone,
                amount: consumer.amount,
                status: 'completed',
                messageContent: script,
                callDuration: 30,
                callTranscript: `Live Twilio Session Dispatched. Check Twilio logs for full conversational transcript.`,
                customerResponse: 'Live Agent Interaction',
                timestamp: new Date().toISOString(),
            };
            onLogDispatch(log);
            setCallLogsList((prev) => [
                ...prev,
                {
                    consumer,
                    status: 'Live Connected',
                    duration: 30,
                    transcript: 'Live Twilio Conversational Call',
                    commitment: 'In Progress/Completed',
                    timestamp: new Date().toLocaleTimeString(),
                }
            ]);
        } else {
             // Fallback
             setActiveCallPhase('ringing');
             const stopRingtone = speechService.playRingtone();
             await new Promise((res) => setTimeout(res, 2200));
             stopRingtone();
             
             setActiveCallPhase('connected');
             speechService.playKeypadBeep(941);
             setActiveLiveTranscript(script);
             await new Promise<void>((resolve) => {
               speechService.speak(script, {
                 rate: 1.0,
                 pitch: 1.05,
                 onEnd: () => resolve(),
                 onError: () => resolve(),
               });
               setTimeout(resolve, 8000);
             });
             
             const log: DispatchLog = {
                id: `log-call-${Date.now()}-${consumer.id}`,
                type: 'aicall',
                consumerId: consumer.consumerId,
                consumerName: consumer.name,
                phone: consumer.phone,
                amount: consumer.amount,
                status: 'completed',
                messageContent: script,
                callDuration: 15,
                callTranscript: `[Astra AI Web]: ${script}`,
                customerResponse: 'Simulated WebRTC Call',
                timestamp: new Date().toISOString(),
             };
             onLogDispatch(log);
             setCallLogsList((prev) => [
                ...prev,
                {
                    consumer,
                    status: 'Simulated',
                    duration: 15,
                    transcript: script,
                    commitment: 'WebRTC Fallback',
                    timestamp: new Date().toLocaleTimeString(),
                }
            ]);
        }
      } catch (err) {
         console.error("Twilio bulk error", err);
      }

      setCallProgressPct(Math.round(((i + 1) / consumers.length) * 100));
      await new Promise((res) => setTimeout(res, 600));
    }

    setActiveCallPhase('finished');
    setIsCallingBatch(false);
    setCurrentCallIndex(-1);
    setActiveConsumer(null);
    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch (_) {}
  };
"""

content = content[:content.find('const handleStartBulkCalls = async () => {')] + new_handler + content[content.find('const handleStopCalls = () => {'):]

with open('src/components/BulkAiCallModal.tsx', 'w') as f:
    f.write(content)
