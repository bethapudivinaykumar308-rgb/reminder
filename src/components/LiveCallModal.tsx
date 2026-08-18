import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Send,
  User,
  Bot,
  CheckCircle2,
  Clock,
  Radio,
  FileText,
  Calendar,
  DollarSign,
  PhoneCall,
  MessageSquare,
  Save,
  Gauge,
  HelpCircle,
  ShieldAlert,
  Sliders,
  ChevronRight,
  Smile,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Consumer, UtilitySettings, DispatchLog, CapturedHumanDetails } from '../types';
import { speechService, VOICE_PROFILES } from '../services/speechService';

interface LiveCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumer: Consumer | null;
  settings: UtilitySettings;
  onLogDispatch: (log: DispatchLog) => void;
  onSaveConsumer?: (consumer: Consumer) => void;
  onTriggerSmsForConsumer?: (consumer: Consumer) => void;
}

interface MessageTurn {
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
}

export const LiveCallModal: React.FC<LiveCallModalProps> = ({
  isOpen,
  onClose,
  consumer,
  settings,
  onLogDispatch,
  onSaveConsumer,
  onTriggerSmsForConsumer,
}) => {

  const [callState, setCallState] = useState<'idle' | 'dialing' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [selectedVoiceProfile, setSelectedVoiceProfile] = useState<string>('warm_empathetic');
  const [messages, setMessages] = useState<MessageTurn[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [callOutcome, setCallOutcome] = useState<string>('In Progress');
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [hasSavedDetails, setHasSavedDetails] = useState(false);
  const [smsSentNotice, setSmsSentNotice] = useState(false);

  // Live Captured Human Details Form State
  const [capturedDetails, setCapturedDetails] = useState<CapturedHumanDetails>({
    promiseDate: consumer?.promiseDate || '',
    committedAmount: consumer?.amount,
    delayReason: consumer?.delayReason || '',
    customerMeterReading: consumer?.customerMeterReading || '',
    alternateContact: consumer?.alternateContact || '',
    preferredPaymentMethod: consumer?.preferredPaymentMethod || 'UPI / Instant SMS Link',
    callbackRequested: '',
    customerSentiment: 'cooperative',
    notesSummary: consumer?.notes || '',
  });

  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const stopRingRef = useRef<(() => void) | null>(null);

  // Auto scroll transcript
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isProcessingTurn]);

  // Call timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Initialize and dial on opening
  useEffect(() => {
    handleStartCall();
    return () => {
      handleEndCall();
    };
  }, [consumer?.id]);

  const handleStartCall = async () => {
    setCallState('dialing');
    setCallDuration(0);
    setMessages([]);
    setCallOutcome('In Progress');
    setHasSavedDetails(false);
    setSmsSentNotice(false);

    // Initial default state from consumer record
    setCapturedDetails({
      promiseDate: consumer?.promiseDate || '',
      committedAmount: consumer?.amount,
      delayReason: consumer?.delayReason || '',
      customerMeterReading: consumer?.customerMeterReading || '',
      alternateContact: consumer?.alternateContact || '',
      preferredPaymentMethod: consumer?.preferredPaymentMethod || 'UPI / Instant SMS Link',
      callbackRequested: '',
      customerSentiment: 'cooperative',
      notesSummary: consumer?.notes || '',
    });

    // 1. Play realistic phone ring
    const stopRing = speechService.playRingtone();
    stopRingRef.current = stopRing;

    await new Promise((res) => setTimeout(res, 2600));
    if (stopRingRef.current) {
      stopRingRef.current();
      stopRingRef.current = null;
    }

    // 2. Call Connected & Play Chime
    setCallState('connected');
    speechService.playConnectChime();

    // Natural human Telugu greeting
    const initialGreeting = `నమస్కారం ${consumer?.name} గారు, నేను ${settings.utilityName || "విద్యుత్ శాఖ"} నుండి ఆస్ట్రా మాట్లాడుతున్నాను. మీ విద్యుత్ కనెక్షన్ ${consumer?.consumerId} మీటర్ ${consumer?.meterNo} బిల్లు బకాయి ₹${consumer?.amount.toLocaleString()} చెల్లించాల్సిన గడువు ${consumer?.overdueDays} రోజులు దాటిపోయింది. విద్యుత్ సరఫరా ఎలాంటి అంతరాయం లేకుండా ఉండటానికి వెంటనే చెల్లించగలరా? లేదా తక్షణ UPI పేమెంట్ లింక్ మీ మొబైల్‌కు SMS ద్వారా పంపించమంటారా?`;

    addMessage('agent', initialGreeting);
    speakAgent(initialGreeting);
  };

  const speakAgent = (text: string) => {
    setIsAgentSpeaking(true);
    speechService.speak(text, {
      profileId: selectedVoiceProfile,
      onStart: () => setIsAgentSpeaking(true),
      onEnd: () => setIsAgentSpeaking(false),
      onError: () => setIsAgentSpeaking(false),
    });
  };

  const addMessage = (sender: 'agent' | 'user', text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
    ]);
  };

  const handleSendUserTurn = async (textToSend?: string) => {
    const text = textToSend || userInput;
    if (!text.trim() || isProcessingTurn || callState !== 'connected') return;

    setUserInput('');
    addMessage('user', text);
    setIsProcessingTurn(true);
    speechService.stop();

    try {
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'agent' ? 'assistant' : 'user',
        content: m.text,
      }));

      const res = await fetch('/api/ai/call-agent-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumer,
          conversationHistory: historyPayload,
          userUtterance: text,
          voiceTone: selectedVoiceProfile,
          utilityName: settings.utilityName,
          supportPhone: settings.supportPhone,
          paymentLink: settings.paymentPortalUrl,
        }),
      });

      if (!res.ok) throw new Error('AI Call turn failed');
      const data = await res.json();

      if (data.agentSpokenResponse) {
        addMessage('agent', data.agentSpokenResponse);
        speakAgent(data.agentSpokenResponse);
      }

      if (data.callOutcome) {
        setCallOutcome(data.callOutcome.replace(/_/g, ' ').toUpperCase());
      }

      // Merge newly extracted human details from Gemini AI
      if (data.capturedHumanDetails) {
        const extracted = data.capturedHumanDetails;
        setCapturedDetails((prev) => ({
          promiseDate: extracted.promiseDate || prev.promiseDate,
          committedAmount: extracted.committedAmount ?? prev.committedAmount,
          delayReason: extracted.delayReason || prev.delayReason,
          customerMeterReading: extracted.customerMeterReading || prev.customerMeterReading,
          alternateContact: extracted.alternateContact || prev.alternateContact,
          preferredPaymentMethod: extracted.preferredPaymentMethod || prev.preferredPaymentMethod,
          callbackRequested: extracted.callbackRequested || prev.callbackRequested,
          customerSentiment: (extracted.customerSentiment as any) || prev.customerSentiment,
          notesSummary: extracted.notesSummary ? `${prev.notesSummary ? prev.notesSummary + '; ' : ''}${extracted.notesSummary}` : prev.notesSummary,
        }));
      }

      if (data.actionTriggered === 'send_sms_link') {
        handleTriggerInstantSms();
      }

      if (data.shouldHangUp) {
        setTimeout(() => {
          handleEndCall();
        }, 4500);
      }
    } catch (err) {
      console.error('Call turn error:', err);
      const fallbackResponse = `I completely understand. I have recorded your note in our billing system. You can securely settle your balance of ${settings.currency}${consumer?.amount} at ${settings.paymentPortalUrl} or call ${settings.supportPhone}. Thank you for your time!`;
      addMessage('agent', fallbackResponse);
      speakAgent(fallbackResponse);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  const handleKeypadPress = (digit: string, label: string) => {
    speechService.playKeypadBeep(697 + parseInt(digit) * 50);
    handleSendUserTurn(`[Keypad ${digit} pressed]: ${label}`);
  };

  const handleToggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice speech recognition is not supported in this browser. You can type in the box below!');
      return;
    }

    if (isListeningMic) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListeningMic(false);
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'te-IN'; // Prioritize Telugu Speech Recognition

    recognition.onstart = () => setIsListeningMic(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        handleSendUserTurn(transcript);
      }
      setIsListeningMic(false);
    };
    recognition.onerror = () => setIsListeningMic(false);
    recognition.onend = () => setIsListeningMic(false);

    recognition.start();
  };

  const handleTriggerInstantSms = () => {
    setSmsSentNotice(true);
    const activePhone = settings.launcherPhone || settings.supportPhone || '+91 98765 43210';
    const smsText = `⚡ [${settings.utilityName || 'విద్యుత్ శాఖ'}] నమస్కారం ${consumer?.name} గారు, కాల్‌లో మాట్లాడిన ప్రకారం మీ విద్యుత్ బిల్లు బకాయి ₹${consumer?.amount} వెంటనే ఇక్కడ చెల్లించండి: ${settings.paymentPortalUrl} లేదా సహాయం కోసం సంప్రదించండి: ${activePhone}.`;

    const log: DispatchLog = {
      id: `log-sms-live-${Date.now()}`,
      type: 'sms',
      consumerId: consumer?.consumerId,
      consumerName: consumer?.name,
      phone: capturedDetails.alternateContact || consumer?.phone,
      amount: consumer?.amount,
      status: 'delivered',
      messageContent: smsText,
      timestamp: new Date().toISOString(),
    };
    onLogDispatch(log);

    if (onTriggerSmsForConsumer) {
      onTriggerSmsForConsumer(consumer);
    }
  };

  const handleSaveCapturedDetailsToConsumer = () => {
    if (!onSaveConsumer) return;

    const updatedConsumer: Consumer = {
      ...consumer,
      promiseDate: capturedDetails.promiseDate || consumer?.promiseDate,
      delayReason: capturedDetails.delayReason || consumer?.delayReason,
      customerMeterReading: capturedDetails.customerMeterReading || consumer?.customerMeterReading,
      alternateContact: capturedDetails.alternateContact || consumer?.alternateContact,
      preferredPaymentMethod: capturedDetails.preferredPaymentMethod || consumer?.preferredPaymentMethod,
      notes: capturedDetails.notesSummary
        ? `${consumer?.notes ? consumer?.notes + ' | ' : ''}AI Call Note: ${capturedDetails.notesSummary}`
        : consumer?.notes,
      updatedAt: new Date().toISOString(),
    };

    onSaveConsumer(updatedConsumer);
    setHasSavedDetails(true);
    try {
      confetti({ particleCount: 40, spread: 50 });
    } catch (_) {}
  };

  const handleEndCall = () => {
    if (stopRingRef.current) {
      stopRingRef.current();
      stopRingRef.current = null;
    }
    speechService.stop();
    setCallState('ended');
    speechService.playKeypadBeep(440);

    // Save dispatch log if we had a connected call
    if (callDuration > 0 || messages.length > 0) {
      const fullTranscript = messages
        .map((m) => `[${m.sender === 'agent' ? 'Astra AI' : consumer?.name}]: ${m.text}`)
        .join('\n');

      const log: DispatchLog = {
        id: `log-call-live-${Date.now()}`,
        type: 'aicall',
        consumerId: consumer?.consumerId,
        consumerName: consumer?.name,
        phone: consumer?.phone,
        amount: consumer?.amount,
        status: 'completed',
        messageContent: messages[0]?.text || 'Live AI Call Reminder',
        callDuration,
        callTranscript: fullTranscript,
        customerResponse: callOutcome,
        capturedDetails: capturedDetails,
        timestamp: new Date().toISOString(),
      };
      onLogDispatch(log);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeProfile = VOICE_PROFILES.find((p) => p.id === selectedVoiceProfile) || VOICE_PROFILES[0];

  if (!isOpen || !consumer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-800 text-white overflow-hidden flex flex-col max-h-[94vh]">
        {/* Main Call Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
                <Bot className="w-6 h-6" />
              </div>
              {callState === 'connected' && (
                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">{consumer?.name}</h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {consumer?.phone}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2 mt-0.5">
                <span>Account #{consumer?.consumerId}</span>
                <span>•</span>
                <span>Meter: {consumer?.meterNo}</span>
                <span>•</span>
                <span className="text-rose-400 font-bold">
                  Overdue: {settings.currency}{consumer?.amount.toLocaleString()} ({consumer?.overdueDays} days)
                </span>
              </p>
            </div>
          </div>

          {/* Right Controls: Timer, Voice Switcher, Close */}
          <div className="flex items-center gap-2.5">
            {/* Voice Profile Switcher */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={selectedVoiceProfile}
                onChange={(e) => setSelectedVoiceProfile(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-hidden cursor-pointer"
              >
                {VOICE_PROFILES.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {callState === 'connected' && (
              <div className="px-3 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 animate-pulse">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                {formatTimer(callDuration)}
              </div>
            )}

            <button
              onClick={() => {
                handleEndCall();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dual Layout: Left Voice Call Interface | Right Human Details Form */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* ================= LEFT COLUMN: LIVE VOICE CALL & DIALOGUE (7 COLS) ================= */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-slate-900">
            {/* Status Bar */}
            <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Call Status:</span>
                {callState === 'dialing' && (
                  <span className="text-amber-400 font-bold flex items-center gap-1.5 animate-pulse">
                    <Clock className="w-3.5 h-3.5" /> Dialing consumer mobile...
                  </span>
                )}
                {callState === 'connected' && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected • Speaking Human-Like Dialogue
                  </span>
                )}
                {callState === 'ended' && (
                  <span className="text-slate-400 font-bold">Call Completed & Recorded</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  Mood:{' '}
                  <span className="capitalize font-bold text-amber-300">
                    {capturedDetails.customerSentiment || 'Cooperative'}
                  </span>
                </span>
              </div>
            </div>

            {/* Live Transcript Container */}
            <div
              ref={chatScrollRef}
              className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3.5 bg-gradient-to-b from-slate-900 to-slate-950 text-xs sm:text-sm min-h-[260px] max-h-[380px]"
            >
              {messages.length === 0 && callState === 'dialing' && (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-3">
                  <div className="p-4 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 animate-bounce">
                    <Phone className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-slate-200 text-sm">
                    Calling {consumer?.name} ({consumer?.phone})...
                  </p>
                  <p className="text-xs text-slate-500">Audio dial tone playing in background</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.sender === 'agent' ? 'justify-start' : 'justify-end'}`}
                >
                  {msg.sender === 'agent' && (
                    <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      msg.sender === 'agent'
                        ? 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-xs shadow-sm'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-tr-xs shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-70">
                      <span className="font-bold uppercase tracking-wider">
                        {msg.sender === 'agent' ? `Astra AI (${activeProfile.name})` : consumer?.name}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="text-xs sm:text-sm">{msg.text}</p>
                  </div>
                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isProcessingTurn && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold py-2">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Astra AI reasoning with Gemini 3.1 Pro & extracting details...</span>
                </div>
              )}

              {isAgentSpeaking && !isProcessingTurn && (
                <div className="flex items-center gap-2 text-emerald-300 text-xs py-1">
                  <Volume2 className="w-4 h-4 animate-pulse text-emerald-400" />
                  <span className="font-mono">Astra speaking with human cadence...</span>
                </div>
              )}
            </div>

            {/* Quick Conversational Human Speech Chips */}
            {callState === 'connected' && (
              <div className="p-3 bg-slate-950/90 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Simulate Human Customer Replies:
                  </span>
                  <button
                    onClick={handleTriggerInstantSms}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Send SMS Link Now
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'I will pay tomorrow via UPI link',
                    'My salary is delayed until the 25th',
                    'My actual meter reading is 3420 units',
                    'Please text me the secure payment link',
                    'Can I split payment in 2 installments?',
                    'Please call back next Monday',
                  ].map((phrase, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendUserTurn(phrase)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
                    >
                      💬 "{phrase}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input / Speak Bar */}
            {callState === 'connected' ? (
              <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                {/* Voice Mic toggle */}
                <button
                  type="button"
                  onClick={handleToggleMic}
                  title={isListeningMic ? 'Stop Mic' : 'Speak with Microphone'}
                  className={`p-3 rounded-2xl transition-all ${
                    isListeningMic
                      ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
                  }`}
                >
                  {isListeningMic ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Text input */}
                <input
                  type="text"
                  placeholder="Speak or type what the customer says (e.g. 'I will pay on 20th', 'My meter reading is 4200')..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendUserTurn()}
                  disabled={isProcessingTurn}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />

                {/* Send */}
                <button
                  type="button"
                  onClick={() => handleSendUserTurn()}
                  disabled={!userInput.trim() || isProcessingTurn}
                  className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Reply</span>
                </button>

                {/* Hang up */}
                <button
                  type="button"
                  onClick={handleEndCall}
                  title="Hang up call"
                  className="p-2.5 sm:px-3 sm:py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">End</span>
                </button>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Call {callState === 'ended' ? 'ended. Transcript & commitments saved.' : 'idle.'}
                </span>
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Redial Customer
                </button>
              </div>
            )}
          </div>

          {/* ================= RIGHT COLUMN: HUMAN DETAILS CAPTURE FORM (5 COLS) ================= */}
          <div className="lg:col-span-5 p-4 sm:p-5 bg-slate-950 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5 overflow-y-auto max-h-[520px] pr-1">
              {/* Form Title */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-400" />
                    Human Details Captured by AI
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Live parameters extracted from the phone conversation
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Live Form
                </span>
              </div>

              {smsSentNotice && (
                <div className="p-2.5 rounded-xl bg-blue-950/70 border border-blue-500/40 text-blue-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Instant SMS payment link dispatched to customer!</span>
                </div>
              )}

              {/* Field 1: Promise to Pay Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Promise to Pay Date
                </label>
                <input
                  type="text"
                  value={capturedDetails.promiseDate || ''}
                  onChange={(e) => setCapturedDetails({ ...capturedDetails, promiseDate: e.target.value })}
                  placeholder="e.g. 2026-08-25, Tomorrow, Next Friday"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Field 2: Committed Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Committed Payment Amount ({settings.currency})
                </label>
                <input
                  type="number"
                  value={capturedDetails.committedAmount || ''}
                  onChange={(e) =>
                    setCapturedDetails({ ...capturedDetails, committedAmount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder={`e.g. ${consumer?.amount}`}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Field 3: Reason for Delay / Life Situation */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  Customer Stated Reason for Delay
                </label>
                <input
                  type="text"
                  value={capturedDetails.delayReason || ''}
                  onChange={(e) => setCapturedDetails({ ...capturedDetails, delayReason: e.target.value })}
                  placeholder="e.g. Waiting for monthly salary on 25th, Medical emergency, Shop closed"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Field 4: Customer Verbal Meter Reading */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  Verbal Meter Reading (kWh Units)
                </label>
                <input
                  type="text"
                  value={capturedDetails.customerMeterReading || ''}
                  onChange={(e) => setCapturedDetails({ ...capturedDetails, customerMeterReading: e.target.value })}
                  placeholder="e.g. 3420 kWh reported by consumer"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Field 5: Alternate Phone / WhatsApp Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                  Alternate Phone / WhatsApp Number
                </label>
                <input
                  type="text"
                  value={capturedDetails.alternateContact || ''}
                  onChange={(e) => setCapturedDetails({ ...capturedDetails, alternateContact: e.target.value })}
                  placeholder="e.g. +91 98450 12345 or WhatsApp number"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Field 6: Preferred Payment Method & Customer Sentiment */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Payment Channel
                  </label>
                  <select
                    value={capturedDetails.preferredPaymentMethod || 'UPI / Instant SMS Link'}
                    onChange={(e) =>
                      setCapturedDetails({ ...capturedDetails, preferredPaymentMethod: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="UPI / Instant SMS Link">UPI / SMS Link</option>
                    <option value="Electricity Cash Counter">Cash Counter</option>
                    <option value="Net Banking / Card">Net Banking / Card</option>
                    <option value="EMI / Partial Installment">EMI Split</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Smile className="w-3 h-3 text-amber-400" />
                    Sentiment
                  </label>
                  <select
                    value={capturedDetails.customerSentiment || 'cooperative'}
                    onChange={(e) =>
                      setCapturedDetails({ ...capturedDetails, customerSentiment: e.target.value as any })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 capitalize"
                  >
                    <option value="cooperative">Cooperative</option>
                    <option value="ready_to_pay">Ready to Pay</option>
                    <option value="hesitant">Hesitant</option>
                    <option value="disputing">Disputing Bill</option>
                    <option value="unreachable">Unreachable</option>
                  </select>
                </div>
              </div>

              {/* Field 7: Notes & Actions Summary */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Call Notes & Ledger Summary
                </label>
                <textarea
                  rows={2}
                  value={capturedDetails.notesSummary || ''}
                  onChange={(e) => setCapturedDetails({ ...capturedDetails, notesSummary: e.target.value })}
                  placeholder="Key conversation points, agreements, or disputes recorded..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Bottom Action: Save & Sync to Consumer Ledger */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={handleSaveCapturedDetailsToConsumer}
                className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  hasSavedDetails
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {hasSavedDetails ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Saved & Synchronized to Consumer Record!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Captured Details to Consumer Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
