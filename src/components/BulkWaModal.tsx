import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Send,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  HelpCircle,
  Flame,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Consumer, ReminderTemplate, UtilitySettings, DispatchLog } from '../types';

interface BulkWaModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumers: Consumer[];
  templates: ReminderTemplate[];
  settings: UtilitySettings;
  onLogDispatch: (log: DispatchLog) => void;
  onOpenLauncherVerify?: () => void;
  onMarkNoWhatsApp?: (consumer: Consumer) => void;
}

export const BulkWaModal: React.FC<BulkWaModalProps> = ({
  isOpen,
  onClose,
  consumers,
  templates,
  settings,
  onLogDispatch,
  onOpenLauncherVerify,
  onMarkNoWhatsApp,
}) => {

  const waTemplates = templates.filter((t) => t.type === 'whatsapp');
  const defaultTpl = waTemplates.find((t) => t.isDefault) || waTemplates[0] || {
    id: 'default-wa-te',
    type: 'whatsapp' as const,
    title: '🟢 WhatsApp అత్యవసర బిల్లు నోటీసు (Telugu)',
    textTemplate: `⚡ *{utility_name} - విద్యుత్ బిల్లు హెచ్చరిక* ⚡

నమస్కారం *{name}* గారు,

మీ విద్యుత్ కనెక్షన్ వివరాలు:
📋 *కనెక్షన్ ID:* {consumer_id}
🔢 *మీటర్ నంబర్:* {meter_no}
💰 *బకాయి మొత్తం:* {amount}
📅 *గడువు తేదీ:* {due_date} ({overdue_days} రోజులు దాటిపోయింది)

⚠️ *ముఖ్య గమనిక:* విద్యుత్ సరఫరా నిలిపివేయకుండా ఉండటానికి వెంటనే బకాయి చెల్లించండి.

📲 *తక్షణ ఆన్‌లైన్ పేమెంట్ లింక్ (UPI / NetBanking):*
{pay_link}

📞 *హెల్ప్‌లైన్:* {support_phone}`,
    tone: 'urgent' as const,
    language: 'Telugu',
    isDefault: true,
  };

  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTpl.id);
  const [customMessage, setCustomMessage] = useState(defaultTpl.textTemplate);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentConsumerIds, setSentConsumerIds] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSafetyGuide, setShowSafetyGuide] = useState(false);

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
    const found = waTemplates.find((t) => t.id === id);
    if (found) {
      setCustomMessage(found.textTemplate);
    }
  };

  const currentConsumer = consumers[currentIndex] || consumers[0];

  const renderMessageForConsumer = (c: Consumer) => {
    if (!c) return '';
    return customMessage
      .replace(/{name}/g, c.name)
      .replace(/{amount}/g, `${settings.currency}${c.amount.toLocaleString()}`)
      .replace(/{consumer_id}/g, c.consumerId)
      .replace(/{meter_no}/g, c.meterNo)
      .replace(/{due_date}/g, c.dueDate)
      .replace(/{overdue_days}/g, String(c.overdueDays))
      .replace(/{pay_link}/g, settings.paymentPortalUrl)
      .replace(/{support_phone}/g, settings.launcherPhone || settings.supportPhone || '+91 98765 43210')
      .replace(/{utility_name}/g, settings.utilityName || 'విద్యుత్ శాఖ');
  };

  const getCleanPhone = (phoneStr: string) => {
    let clean = phoneStr.replace(/[^\d]/g, '');
    if (clean.length === 10) {
      clean = '91' + clean; // Default India prefix if 10 digits
    }
    return clean;
  };

  const generateWhatsAppUrl = (consumer: Consumer) => {
    if (!consumer) return '#';
    const cleanPhone = getCleanPhone(consumer.phone);
    const text = renderMessageForConsumer(consumer);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleLaunchWhatsApp = (consumer: Consumer) => {
    if (!consumer) return;
    const url = generateWhatsAppUrl(consumer);
    window.open(url, '_blank', 'noopener,noreferrer');

    // Log to Dispatch Records
    if (!sentConsumerIds.includes(consumer.id)) {
      setSentConsumerIds((prev) => [...prev, consumer.id]);
      const log: DispatchLog = {
        id: `log-wa-${Date.now()}-${consumer.id}`,
        type: 'whatsapp',
        consumerId: consumer.consumerId,
        consumerName: consumer.name,
        phone: consumer.phone,
        amount: consumer.amount,
        status: 'delivered',
        messageContent: renderMessageForConsumer(consumer),
        timestamp: new Date().toISOString(),
      };
      onLogDispatch(log);
    }

    if (sentConsumerIds.length + 1 >= consumers.length) {
      try {
        confetti({ particleCount: 70, spread: 60 });
      } catch (_) {}
    }
  };

  const handleCopyLink = () => {
    if (!currentConsumer) return;
    const url = generateWhatsAppUrl(currentConsumer);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNext = () => {
    if (currentIndex < consumers.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const isCurrentSent = currentConsumer && sentConsumerIds.includes(currentConsumer.id);
  const progressPct = consumers.length > 0 ? Math.round((sentConsumerIds.length / consumers.length) * 100) : 0;

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <MessageCircle className="w-6 h-6 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">100% Free WhatsApp Bill Dispatcher</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Zero Cost • Zero Ban Risk
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                ఉచిత WhatsApp రిమైండర్ - Direct Click-to-Chat deep links for {consumers.length} overdue accounts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free WhatsApp Safety & Requirements Sub-bar */}
        <div className="px-5 py-2.5 bg-emerald-50/80 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-950 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>100% Free & Safe:</strong> Uses WhatsApp Web / Desktop / Mobile app. No paid APIs, no SMS gateway charges!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSafetyGuide(!showSafetyGuide)}
            className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer text-[11px]"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showSafetyGuide ? 'Hide Safety Guide' : 'How it works without ban?'}</span>
          </button>
        </div>

        {/* Safety Guide Dropdown */}
        {showSafetyGuide && (
          <div className="p-4 bg-slate-900 text-slate-100 text-xs border-b border-slate-800 space-y-2 animate-in fade-in">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Requirements & Zero-Risk Safety Protection
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px] leading-relaxed">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <p className="font-bold text-emerald-300">1. What are the requirements from you?</p>
                <p className="text-slate-300">
                  • Just your phone with WhatsApp or computer with WhatsApp Web/Desktop opened.
                  <br />• <strong>No API Key, No Credit Card, No Meta Approval needed.</strong>
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <p className="font-bold text-emerald-300">2. Why does it NOT effect your WhatsApp?</p>
                <p className="text-slate-300">
                  • It uses official WhatsApp Click-to-Chat deep links (<code className="text-amber-300">wa.me</code>).
                  <br />• You click to launch each chat interactively, so WhatsApp sees genuine human interaction and <strong>never flags or bans your account</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Top Progress & Active Consumer Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-xs sm:text-sm">
                  Active Defaulter ({currentIndex + 1} of {consumers.length})
                </span>
                {isCurrentSent && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> SENT
                  </span>
                )}
              </div>
              <span className="font-mono text-xs font-bold text-amber-300">
                {sentConsumerIds.length} / {consumers.length} Dispatched ({progressPct}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-700/60 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
              ></div>
            </div>

            {/* Active Consumer Details */}
            {currentConsumer && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-700/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{currentConsumer.name}</span>
                  <span className="font-mono text-slate-300">({currentConsumer.phone})</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 font-mono text-[10px]">
                    ID: #{currentConsumer.consumerId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-300 font-bold font-mono">
                    ₹{currentConsumer.amount.toLocaleString()} Due
                  </span>
                  <span className="text-rose-300 font-semibold text-[11px]">
                    ({currentConsumer.overdueDays} days overdue)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select WhatsApp Template (Telugu / English)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {waTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleTemplateSelect(tpl.id)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedTemplateId === tpl.id
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/40'
                  }`}
                >
                  <p className="font-bold text-xs line-clamp-1">{tpl.title}</p>
                  <p className="text-[11px] text-slate-500 capitalize mt-0.5">
                    Tone: {tpl.tone} • {tpl.language}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Message Editor with Variable Insertion */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                WhatsApp Message Template (Markdown formatted)
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {customMessage.length} characters
              </span>
            </div>
            <textarea
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {/* Variable Pills */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['{name}', '{amount}', '{consumer_id}', '{meter_no}', '{due_date}', '{overdue_days}', '{pay_link}', '{support_phone}', '{utility_name}'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setCustomMessage((prev) => prev + ' ' + tag)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 border border-slate-200 cursor-pointer"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Live Rendered WhatsApp Chat Bubble Preview */}
          {currentConsumer && (
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Live WhatsApp Chat Preview for {currentConsumer.name}
              </p>
              <div className="p-4 rounded-2xl bg-[#ECE5DD] border border-slate-300 relative overflow-hidden shadow-inner">
                {/* Background WhatsApp Doodle Motif pattern */}
                <div className="max-w-md ml-auto bg-[#DCF8C6] text-slate-900 rounded-2xl p-3.5 shadow-sm border border-emerald-200/60 text-xs font-sans whitespace-pre-wrap leading-relaxed relative">
                  {renderMessageForConsumer(currentConsumer)}
                  <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-500 font-mono">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-blue-500 font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Navigation Controls between Defaulters */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              title="Previous Defaulter"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">
              {currentIndex + 1} / {consumers.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= consumers.length - 1}
              className="p-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              title="Next Defaulter"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer shadow-2xs"
              title="Copy WhatsApp Direct Chat Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {sentConsumerIds.length > 0 ? 'Done / Close' : 'Cancel'}
            </button>

            {currentConsumer && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (onMarkNoWhatsApp) onMarkNoWhatsApp(currentConsumer);
                    handleNext();
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer border border-slate-300 hover:border-rose-300"
                  title="Mark this customer as not having WhatsApp and skip to next"
                >
                  Mark No WA & Skip
                </button>
                <button
                  id="btn-launch-single-whatsapp"
                  type="button"
                  onClick={() => {
                    handleLaunchWhatsApp(currentConsumer);
                    handleNext();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/25 active:scale-98 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-200 animate-bounce" />
                  <span>
                    {isCurrentSent
                      ? 'Re-open WhatsApp Chat ↗'
                      : `Send WhatsApp to ${currentConsumer.name.split(' ')[0]} ↗`}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
