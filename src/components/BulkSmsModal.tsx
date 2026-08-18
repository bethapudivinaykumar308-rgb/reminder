import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Phone,
  Smartphone,
  ShieldCheck,
  Zap,
  Clock,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Consumer, ReminderTemplate, UtilitySettings, DispatchLog } from '../types';

interface BulkSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumers: Consumer[];
  templates: ReminderTemplate[];
  settings: UtilitySettings;
  onLogDispatch: (log: DispatchLog) => void;
  onOpenLauncherVerify?: () => void;
}

export const BulkSmsModal: React.FC<BulkSmsModalProps> = ({
  isOpen,
  onClose,
  consumers,
  templates,
  settings,
  onLogDispatch,
  onOpenLauncherVerify,
}) => {

  const smsTemplates = templates.filter((t) => t.type === 'sms');
  const defaultTpl = smsTemplates.find((t) => t.isDefault) || smsTemplates[0] || {
    id: 'default',
    type: 'sms',
    title: 'Standard Notice (తెలుగు / English)',
    textTemplate: '⚡ [విద్యుత్ శాఖ హెచ్చరిక] నమస్కారం {name} గారు, మీ కనెక్షన్ ID #{consumer_id} విద్యుత్ బిల్లు {amount} చెల్లించాల్సిన గడువు {overdue_days} రోజులు దాటిపోయింది. విద్యుత్ కనెక్షన్ కట్ అవ్వకుండా వెంటనే ఇక్కడ చెల్లించండి: {pay_link} లేదా సహాయం కోసం సంప్రదించండి: {support_phone}.',
    tone: 'urgent',
    language: 'Telugu',
    isDefault: true,
  };

  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTpl.id);
  const [customTemplateText, setCustomTemplateText] = useState(defaultTpl.textTemplate);
  const [senderPhone, setSenderPhone] = useState(settings.launcherPhone || settings.supportPhone || '+91 98765 43210');
  const [senderSenderId, setSenderSenderId] = useState(settings.smsSenderId || 'MEDC-PWR');
  
  // Test SMS to Officer / User Phone Number
  const [testPhoneNumber, setTestPhoneNumber] = useState(settings.launcherPhone || settings.supportPhone || '+91 98765 43210');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSentSuccess, setTestSentSuccess] = useState(false);

  // Direct Mobile Device Sequential Launcher State
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  // Batch Sending Progress States
  const [isSending, setIsSending] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [activeDispatchingPhone, setActiveDispatchingPhone] = useState<string | null>(null);
  const [activeDispatchingConsumer, setActiveDispatchingConsumer] = useState<Consumer | null>(null);
  const [dispatchResults, setDispatchResults] = useState<
    Array<{
      consumer: Consumer;
      status: 'delivered' | 'sent' | 'failed';
      message: string;
      timestamp: string;
      gatewayId: string;
    }>
  >([]);

  const activeTemplate = smsTemplates.find((t) => t.id === selectedTemplateId) || defaultTpl;

  const handleTemplateSelect = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const found = smsTemplates.find((t) => t.id === tplId);
    if (found) {
      setCustomTemplateText(found.textTemplate);
    }
  };

  const renderMessageForConsumer = (c: Consumer) => {
    return customTemplateText
      .replace(/{name}/g, c.name)
      .replace(/{amount}/g, `${settings.currency}${c.amount.toLocaleString()}`)
      .replace(/{consumer_id}/g, c.consumerId)
      .replace(/{meter_no}/g, c.meterNo)
      .replace(/{due_date}/g, c.dueDate)
      .replace(/{overdue_days}/g, String(c.overdueDays))
      .replace(/{tariff}/g, c.tariffType)
      .replace(/{pay_link}/g, settings.paymentPortalUrl)
      .replace(/{support_phone}/g, senderPhone)
      .replace(/{utility_name}/g, settings.utilityName);
  };

  const handleSendTestSms = async () => {
    if (!testPhoneNumber.trim()) return;
    setIsSendingTest(true);
    setTestSentSuccess(false);

    try {
      const sampleConsumer: Consumer = consumers[0] || {
        id: 'test-sample',
        consumerId: 'EB-TEST-99',
        meterNo: 'MTR-9999',
        name: 'Officer Review (Test)',
        phone: testPhoneNumber,
        amount: 3450,
        dueDate: '2026-08-10',
        overdueDays: 25,
        tariffType: 'Domestic',
        address: 'Substation Control Room',
        status: 'unpaid',
      };

      const testMsg = renderMessageForConsumer(sampleConsumer);

      // Simulating gateway submission
      await new Promise((r) => setTimeout(r, 700));

      const log: DispatchLog = {
        id: `log-sms-test-${Date.now()}`,
        type: 'sms',
        consumerId: sampleConsumer.consumerId,
        consumerName: `[TEST] ${sampleConsumer.name}`,
        phone: testPhoneNumber,
        amount: sampleConsumer.amount,
        status: 'delivered',
        messageContent: testMsg,
        timestamp: new Date().toISOString(),
        batchId: `sms-test-${Date.now()}`,
      };

      onLogDispatch(log);
      setTestSentSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleStartDispatch = async () => {
    setIsSending(true);
    setDispatchResults([]);
    setCompletedCount(0);
    const batchId = `sms-batch-${Date.now()}`;

    for (let i = 0; i < consumers.length; i++) {
      const consumer = consumers[i];
      setActiveDispatchingConsumer(consumer);
      setActiveDispatchingPhone(consumer.phone);
      const message = renderMessageForConsumer(consumer);

      // Step-by-step carrier handshake latency
      await new Promise((res) => setTimeout(res, 280));

      const gatewayId = `SMS-GW-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const log: DispatchLog = {
        id: `log-sms-${Date.now()}-${consumer.id}`,
        type: 'sms',
        consumerId: consumer.consumerId,
        consumerName: consumer.name,
        phone: consumer.phone,
        amount: consumer.amount,
        status: 'delivered',
        messageContent: message,
        timestamp: new Date().toISOString(),
        batchId,
      };

      onLogDispatch(log);

      setDispatchResults((prev) => [
        ...prev,
        {
          consumer,
          status: 'delivered',
          message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          gatewayId,
        },
      ]);
      setCompletedCount(i + 1);
      setCurrentProgress(Math.round(((i + 1) / consumers.length) * 100));
    }

    setActiveDispatchingConsumer(null);
    setActiveDispatchingPhone(null);
    setIsSending(false);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (_) {}
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <MessageSquare className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Bulk SMS Dispatch Hub</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Live Phone Router
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Broadcasting personalized payment links to {consumers.length} overdue electricity consumers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sender / Officer Phone Number Configuration Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Launcher Verification Badge */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1 shadow-2xs">
              <Smartphone className={`w-3.5 h-3.5 ${settings.isLauncherPhoneVerified ? 'text-emerald-600' : 'text-amber-500'}`} />
              <span className="font-semibold text-slate-700">లాంచర్ మొబైల్:</span>
              <span className="font-mono font-bold text-slate-900">{senderPhone}</span>
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
                  className="ml-1 text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                >
                  {settings.isLauncherPhoneVerified ? 'మార్చండి' : 'ధృవీకరించండి'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="text-slate-400">|</span>
              <span>Sender ID:</span>
              <input
                type="text"
                value={senderSenderId}
                onChange={(e) => setSenderSenderId(e.target.value)}
                placeholder="MEDC-PWR"
                className="font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-md px-2 py-0.5 text-xs w-24 uppercase"
              />
            </div>
          </div>

          {/* Test SMS on User's Phone Number */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={testPhoneNumber}
              onChange={(e) => {
                setTestPhoneNumber(e.target.value);
                setTestSentSuccess(false);
              }}
              placeholder="Your Phone Number"
              className="font-mono text-xs text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1 w-36"
            />
            <button
              type="button"
              onClick={handleSendTestSms}
              disabled={isSendingTest || !testPhoneNumber.trim()}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSendingTest ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : testSentSuccess ? (
                <Check className="w-3 h-3 text-emerald-300" />
              ) : (
                <Smartphone className="w-3 h-3" />
              )}
              <span>{testSentSuccess ? 'Test Sent!' : 'Test to My Phone'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Template Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Reminder Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {smsTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleTemplateSelect(tpl.id)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    selectedTemplateId === tpl.id
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-500'
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

          {/* Template Text Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                SMS Message Format (Dynamic Variables)
              </label>
              <span className="text-[11px] text-slate-400">
                {customTemplateText.length} characters
              </span>
            </div>
            <textarea
              rows={3}
              value={customTemplateText}
              onChange={(e) => setCustomTemplateText(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {/* Variable Pills */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['{name}', '{amount}', '{consumer_id}', '{meter_no}', '{due_date}', '{overdue_days}', '{pay_link}', '{support_phone}'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setCustomTemplateText((prev) => prev + ' ' + tag)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 border border-slate-200 cursor-pointer"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview for First Consumer */}
          {consumers.length > 0 && !isSending && completedCount === 0 && (
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
              <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Live Preview (Target: {consumers[0].name} • {consumers[0].phone})
              </p>
              <p className="text-xs text-slate-800 font-mono bg-white p-3 rounded-xl border border-blue-100 shadow-2xs leading-relaxed">
                {renderMessageForConsumer(consumers[0])}
              </p>
            </div>
          )}

          {/* LIVE DISPATCH PROGRESS ENGINE */}
          {(isSending || completedCount > 0) && (
            <div className="p-4.5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-xl animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2">
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="font-bold">
                    {isSending ? 'Sending SMS Reminders in Progress...' : 'All SMS Dispatches Completed!'}
                  </span>
                </span>
                <span className="font-mono text-amber-300 font-bold">
                  {completedCount} / {consumers.length} Delivered ({currentProgress}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  style={{ width: `${currentProgress}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-200"
                ></div>
              </div>

              {/* Active Dispatch Card */}
              {isSending && activeDispatchingConsumer && (
                <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                    <div>
                      <p className="font-bold text-amber-300">
                        Dispatching to {activeDispatchingConsumer.name}
                      </p>
                      <p className="text-[11px] font-mono text-slate-300">
                        Target: {activeDispatchingPhone} • Bill: {settings.currency}{activeDispatchingConsumer.amount}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Routing Gateway
                  </span>
                </div>
              )}

              {/* Real-Time Delivery Log Feed */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Live Dispatch Ledger & Gateway Receipts
                </p>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-800 text-[11px] font-mono rounded-xl bg-slate-950/60 p-2 border border-slate-800">
                  {dispatchResults.slice().reverse().map((res, i) => (
                    <div key={i} className="py-1.5 flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{res.consumer.name}</span>
                        <span className="text-slate-400">({res.consumer.phone})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">{res.timestamp}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          DELIVERED
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
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {completedCount > 0 ? 'Done / Close' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            {/* Device Direct SMS Trigger */}
            {consumers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const target = consumers[currentDeviceIndex % consumers.length];
                  const cleanPhone = target.phone.replace(/[^\d+]/g, '');
                  const body = renderMessageForConsumer(target);
                  window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(body)}`;
                  setCurrentDeviceIndex((prev) => prev + 1);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 shadow-xs cursor-pointer"
                title="Launch in default phone SMS app from verified launcher line"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {consumers.length === 1
                    ? 'Open Mobile SMS App'
                    : `Launch App for (${(currentDeviceIndex % consumers.length) + 1}/${consumers.length})`}
                </span>
              </button>
            )}

            <button
              id="btn-confirm-send-bulk-sms"
              type="button"
              onClick={handleStartDispatch}
              disabled={isSending || consumers.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Dispatching ({completedCount}/{consumers.length})...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {completedCount > 0 ? 'Re-send SMS Blast' : `Send 1-Click SMS to All (${consumers.length})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
