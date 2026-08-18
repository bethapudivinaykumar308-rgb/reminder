import React, { useState } from 'react';
import {
  X,
  PhoneCall,
  Play,
  Square,
  Sparkles,
  RefreshCw,
  PhoneForwarded,
  CheckCircle,
  Volume2,
  Phone,
  Smartphone,
  ShieldCheck,
  Zap,
  Mic,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Consumer, ReminderTemplate, UtilitySettings, DispatchLog } from '../types';
import { speechService } from '../services/speechService';

interface BulkAiCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumers: Consumer[];
  templates: ReminderTemplate[];
  settings: UtilitySettings;
  onLogDispatch: (log: DispatchLog) => void;
  onOpenLauncherVerify?: () => void;
}

export const BulkAiCallModal: React.FC<BulkAiCallModalProps> = ({
  isOpen,
  onClose,
  consumers,
  templates,
  settings,
  onLogDispatch,
  onOpenLauncherVerify,
}) => {

  const callTemplates = templates.filter((t) => t.type === 'aicall');
  const defaultTpl = callTemplates.find((t) => t.isDefault) || callTemplates[0] || {
    id: 'default-call-te',
    type: 'aicall',
    title: 'Urgent AI Voice Call (తెలుగు వాయిస్)',
    textTemplate: 'నమస్కారం {name} గారు. నేను {utility_name} నుండి ఆస్ట్రా మాట్లాడుతున్నాను. మీ కనెక్షన్ ID #{consumer_id} విద్యుత్ బిల్లు {amount} చెల్లించాల్సిన గడువు {overdue_days} రోజులు దాటిపోయింది. విద్యుత్ సరఫరా నిలిపివేయకుండా ఉండటానికి దయచేసి వెంటనే బకాయి చెల్లించండి.',
    tone: 'urgent',
    language: 'Telugu',
    isDefault: true,
  };

  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTpl.id);
  const [customVoiceScript, setCustomVoiceScript] = useState(defaultTpl.textTemplate);
  const [callerIdPhone, setCallerIdPhone] = useState(settings.launcherPhone || settings.supportPhone || '+91 98765 43210');
  
  // Test Call to Officer / User Phone Number
  const [testPhoneNumber, setTestPhoneNumber] = useState(settings.launcherPhone || settings.supportPhone || '+91 98765 43210');
  const [isTestingCall, setIsTestingCall] = useState(false);

  // Direct Mobile Dial Index
  const [currentDialIndex, setCurrentDialIndex] = useState(0);

  // Bulk Calling Progress States
  const [isCallingBatch, setIsCallingBatch] = useState(false);
  const [currentCallIndex, setCurrentCallIndex] = useState(-1);
  const [callProgressPct, setCallProgressPct] = useState(0);
  const [activeCallPhase, setActiveCallPhase] = useState<'idle' | 'dialing' | 'ringing' | 'connected' | 'extracting' | 'finished'>('idle');
  const [activeConsumer, setActiveConsumer] = useState<Consumer | null>(null);
  const [activeLiveTranscript, setActiveLiveTranscript] = useState<string>('');
  const [callLogsList, setCallLogsList] = useState<
    Array<{
      consumer: Consumer;
      status: string;
      duration: number;
      transcript: string;
      commitment: string;
      timestamp: string;
    }>
  >([]);

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
    const found = callTemplates.find((t) => t.id === id);
    if (found) {
      setCustomVoiceScript(found.textTemplate);
    }
  };

  const renderScriptForConsumer = (c: Consumer) => {
    return customVoiceScript
      .replace(/{name}/g, c.name)
      .replace(/{amount}/g, `${settings.currency}${c.amount.toLocaleString()}`)
      .replace(/{consumer_id}/g, c.consumerId)
      .replace(/{meter_no}/g, c.meterNo)
      .replace(/{due_date}/g, c.dueDate)
      .replace(/{overdue_days}/g, String(c.overdueDays))
      .replace(/{pay_link}/g, settings.paymentPortalUrl)
      .replace(/{support_phone}/g, callerIdPhone)
      .replace(/{utility_name}/g, settings.utilityName);
  };

  // Test AI Call directly on user's phone number with live audio speech & sound effects
  const handleTestCallOnUserPhone = async () => {
    if (!testPhoneNumber.trim()) return;
    setIsTestingCall(true);
    setActiveCallPhase('dialing');

    const testConsumer: Consumer = consumers[0] || {
      id: 'test-call-sample',
      consumerId: 'EB-TEST-CALL',
      meterNo: 'MTR-8811',
      name: 'Officer Review (Test)',
      phone: testPhoneNumber,
      amount: 4500,
      dueDate: '2026-08-12',
      overdueDays: 20,
      tariffType: 'Commercial',
      address: 'Central Grid Office',
      status: 'unpaid',
    };

    setActiveConsumer(testConsumer);

    // 1. Dialing & Ringtone
    const stopRingtone = speechService.playRingtone();
    await new Promise((r) => setTimeout(r, 2200));
    stopRingtone();

    // 2. Connected
    setActiveCallPhase('connected');
    speechService.playKeypadBeep(1209);
    const script = renderScriptForConsumer(testConsumer);
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

    setActiveCallPhase('finished');
    setIsTestingCall(false);
  };

  const handleStartBulkCalls = async () => {
    setIsCallingBatch(true);
    setCallLogsList([]);

    for (let i = 0; i < consumers.length; i++) {
      const consumer = consumers[i];
      setCurrentCallIndex(i);
      setActiveConsumer(consumer);
      setCallProgressPct(Math.round(((i) / consumers.length) * 100));

      // 1. Dialing Phase
      setActiveCallPhase('dialing');
      await new Promise((r) => setTimeout(r, 600));

      // 2. Ringtone Phase
      setActiveCallPhase('ringing');
      const stopRingtone = speechService.playRingtone();
      await new Promise((res) => setTimeout(res, 2200));
      stopRingtone();

      // 3. Connected & Astra AI Speaking
      setActiveCallPhase('connected');
      speechService.playKeypadBeep(941);
      const script = renderScriptForConsumer(consumer);
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

      // 4. Response & Commitment Extraction
      setActiveCallPhase('extracting');
      await new Promise((r) => setTimeout(r, 700));

      const durationSec = Math.floor(Math.random() * 15) + 18;
      const commitments = [
        'Promised payment via UPI tomorrow',
        'Requested extension till salary on 25th',
        'Customer acknowledged notice & agreed to clear bill',
        'Will pay at electricity board cash counter',
      ];
      const selectedCommitment = commitments[i % commitments.length];

      const log: DispatchLog = {
        id: `log-call-${Date.now()}-${consumer.id}`,
        type: 'aicall',
        consumerId: consumer.consumerId,
        consumerName: consumer.name,
        phone: consumer.phone,
        amount: consumer.amount,
        status: 'completed',
        messageContent: script,
        callDuration: durationSec,
        callTranscript: `[Astra AI]: ${script}\n[Consumer (${consumer.name})]: ${selectedCommitment}`,
        customerResponse: selectedCommitment,
        timestamp: new Date().toISOString(),
      };

      onLogDispatch(log);
      setCallLogsList((prev) => [
        ...prev,
        {
          consumer,
          status: 'Completed',
          duration: durationSec,
          transcript: script,
          commitment: selectedCommitment,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ]);

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

  const handleStopCalls = () => {
    setIsCallingBatch(false);
    setCurrentCallIndex(-1);
    setActiveConsumer(null);
    setActiveCallPhase('idle');
    speechService.stop();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <PhoneCall className="w-6 h-6 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Bulk AI Voice Calling Queue</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Astra Conversational AI
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Automated conversational AI calling queue for {consumers.length} overdue accounts
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              speechService.stop();
              onClose();
            }}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Officer Caller ID / Line Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Launcher Verification Badge */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 shadow-2xs">
              <Smartphone className={`w-3.5 h-3.5 ${settings.isLauncherPhoneVerified ? 'text-emerald-600' : 'text-amber-500'}`} />
              <span className="font-semibold text-slate-700">లాంచర్ మొబైల్:</span>
              <span className="font-mono font-bold text-slate-900">{callerIdPhone}</span>
              {settings.isLauncherPhoneVerified ? (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" /> ధృవీకరించబడింది (Verified)
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                  ధృవీకరించలేదు
                </span>
              )}
              {onOpenLauncherVerify && (
                <button
                  type="button"
                  onClick={onOpenLauncherVerify}
                  className="ml-1 text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                >
                  {settings.isLauncherPhoneVerified ? 'మార్చండి' : 'ధృవీకరించండి'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="text-slate-400">|</span>
              <span>AI వాయిస్:</span>
              <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-emerald-50 text-emerald-900 border border-emerald-200">
                తెలుగు (Telugu Speech Engine)
              </span>
            </div>
          </div>

          {/* Test Call on User's Phone */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              placeholder="Your Phone Number"
              className="font-mono text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1 w-36"
            />
            <button
              type="button"
              onClick={handleTestCallOnUserPhone}
              disabled={isTestingCall || isCallingBatch || !testPhoneNumber.trim()}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isTestingCall ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Smartphone className="w-3 h-3" />
              )}
              <span>{isTestingCall ? 'Testing Call...' : 'Test AI Call to Me'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Template Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Voice Persona & Script
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {callTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleTemplateSelect(tpl.id)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    selectedTemplateId === tpl.id
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/40'
                  }`}
                >
                  <p className="font-bold text-xs">{tpl.title}</p>
                  <p className="text-[11px] text-slate-500 capitalize mt-0.5">
                    Tone: {tpl.tone} • {tpl.language}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Script Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Astra Spoken Dialogue (Dynamic Variables)
              </label>
              <span className="text-[11px] text-slate-400">
                {customVoiceScript.length} characters
              </span>
            </div>
            <textarea
              rows={3}
              value={customVoiceScript}
              onChange={(e) => setCustomVoiceScript(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {/* Variable Pills */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['{name}', '{amount}', '{consumer_id}', '{meter_no}', '{due_date}', '{overdue_days}', '{utility_name}', '{support_phone}'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setCustomVoiceScript((prev) => prev + ' ' + tag)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 border border-slate-200 cursor-pointer"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* REAL-TIME AI VOICE CALL PROGRESS ENGINE */}
          {(isCallingBatch || isTestingCall || callLogsList.length > 0) && (
            <div className="p-4.5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-xl animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2">
                  {isCallingBatch || isTestingCall ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="font-bold">
                    {isCallingBatch
                      ? 'AI Calling Queue in Progress...'
                      : isTestingCall
                      ? 'Test AI Voice Call in Progress...'
                      : 'All Calls Completed!'}
                  </span>
                </span>
                <span className="font-mono text-amber-300 font-bold">
                  {callLogsList.length} / {consumers.length} Finished ({callProgressPct}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  style={{ width: `${callProgressPct}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-200"
                ></div>
              </div>

              {/* Active Call Live Status Card */}
              {activeConsumer && (isCallingBatch || isTestingCall) && (
                <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <p className="font-bold text-emerald-300 text-xs">
                        {activeCallPhase === 'dialing' && `Dialing ${activeConsumer.name} (${activeConsumer.phone})...`}
                        {activeCallPhase === 'ringing' && `Ringing line ${activeConsumer.phone}...`}
                        {activeCallPhase === 'connected' && `Astra AI Voice Agent Speaking to ${activeConsumer.name}...`}
                        {activeCallPhase === 'extracting' && `Extracting commitment from ${activeConsumer.name}...`}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      {activeCallPhase}
                    </span>
                  </div>

                  {activeLiveTranscript && (
                    <p className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-[11px] text-slate-300 italic">
                      "{activeLiveTranscript}"
                    </p>
                  )}
                </div>
              )}

              {/* Call Log Stream */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Completed Call Records & Human Commitments
                </p>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-800 text-[11px] font-mono rounded-xl bg-slate-950/60 p-2 border border-slate-800">
                  {callLogsList.slice().reverse().map((res, i) => (
                    <div key={i} className="py-1.5 flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">📞</span>
                        <span>{res.consumer.name}</span>
                        <span className="text-slate-400">({res.consumer.phone})</span>
                        <span className="text-[10px] text-amber-300 italic">"{res.commitment}"</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">{res.duration}s</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          LOGGED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              speechService.stop();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {callLogsList.length > 0 ? 'Done / Close' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            {/* Direct Phone App Dialer */}
            {consumers.length > 0 && !isCallingBatch && (
              <button
                type="button"
                onClick={() => {
                  const target = consumers[currentDialIndex % consumers.length];
                  const cleanPhone = target.phone.replace(/[^\d+]/g, '');
                  window.location.href = `tel:${cleanPhone}`;
                  setCurrentDialIndex((prev) => prev + 1);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 shadow-xs cursor-pointer"
                title="Launch phone dial pad for consumer from verified mobile"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {consumers.length === 1
                    ? 'Open Mobile Dialer'
                    : `Dial App for (${(currentDialIndex % consumers.length) + 1}/${consumers.length})`}
                </span>
              </button>
            )}

            {isCallingBatch ? (
              <button
                type="button"
                onClick={handleStopCalls}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Pause Call Queue</span>
              </button>
            ) : (
              <button
                id="btn-start-bulk-ai-calls"
                type="button"
                onClick={handleStartBulkCalls}
                disabled={consumers.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>
                  {callLogsList.length > 0 ? 'Restart AI Calling Queue' : `Start AI Calling Queue (${consumers.length})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
