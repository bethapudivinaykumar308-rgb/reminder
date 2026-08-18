import React, { useState } from 'react';
import {
  X,
  Sparkles,
  MessageSquare,
  PhoneCall,
  Play,
  Volume2,
  Check,
  Plus,
  Trash2,
  Languages,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ReminderTemplate, UtilitySettings } from '../types';
import { speechService } from '../services/speechService';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ReminderTemplate[];
  onSaveTemplate: (template: ReminderTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  settings: UtilitySettings;
}

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSaveTemplate,
  onDeleteTemplate,
  settings,
}) => {

  const [activeType, setActiveType] = useState<'sms' | 'aicall'>('sms');
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate>(
    templates.find((t) => t.type === 'sms') || templates[0]
  );
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Form State
  const [title, setTitle] = useState(selectedTemplate.title);
  const [textTemplate, setTextTemplate] = useState(selectedTemplate.textTemplate);
  const [tone, setTone] = useState<any>(selectedTemplate.tone);
  const [language, setLanguage] = useState(selectedTemplate.language || 'English');
  const [voice, setVoice] = useState(selectedTemplate.voice || 'Natural');

  const filteredTemplates = templates.filter((t) => t.type === activeType);

  const handleSelectTemplate = (tpl: ReminderTemplate) => {
    setSelectedTemplate(tpl);
    setTitle(tpl.title);
    setTextTemplate(tpl.textTemplate);
    setTone(tpl.tone);
    setLanguage(tpl.language || 'English');
    setVoice(tpl.voice || 'Natural');
  };

  const handleNewTemplate = () => {
    const newTpl: ReminderTemplate = {
      id: `tpl-${Date.now()}`,
      type: activeType,
      title: `Custom ${activeType.toUpperCase()} Template`,
      textTemplate:
        activeType === 'sms'
          ? '⚡ Dear {name}, your electricity bill of {amount} for Consumer #{consumer_id} is overdue. Pay at {pay_link}.'
          : 'Hello {name}. This is Astra AI calling from {utility_name}. Your bill of {amount} is overdue.',
      tone: 'polite',
      language: 'English',
      isDefault: false,
    };
    setSelectedTemplate(newTpl);
    setTitle(newTpl.title);
    setTextTemplate(newTpl.textTemplate);
    setTone(newTpl.tone);
  };

  const handleSave = () => {
    const updated: ReminderTemplate = {
      ...selectedTemplate,
      type: activeType,
      title,
      textTemplate,
      tone,
      language,
      voice,
    };
    onSaveTemplate(updated);
    try {
      confetti({ particleCount: 40, spread: 50 });
    } catch (_) {}
  };

  // Generate with Gemini 3.1 Pro High-Thinking
  const handleAiGenerate = async () => {
    setIsAiGenerating(true);
    try {
      const sampleConsumer = {
        name: '{name}',
        consumerId: '{consumer_id}',
        meterNo: '{meter_no}',
        amount: 4500,
        dueDate: '{due_date}',
        overdueDays: 45,
        tariffType: 'Domestic',
      };

      const res = await fetch('/api/ai/generate-call-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumer: sampleConsumer,
          tone,
          language,
          utilityName: settings.utilityName,
          supportPhone: settings.supportPhone,
          paymentLink: settings.paymentPortalUrl,
        }),
      });

      if (!res.ok) throw new Error('AI script generation failed');
      const data = await res.json();

      if (data.callScript) {
        setTextTemplate(data.callScript);
      }
    } catch (err) {
      console.error(err);
      alert('AI generation failed. You can customize the text manually!');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleTestAudio = () => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
      return;
    }

    const testText = textTemplate
      .replace(/{name}/g, 'Vinay Kumar')
      .replace(/{amount}/g, `${settings.currency}4,850`)
      .replace(/{consumer_id}/g, 'EB-2041')
      .replace(/{meter_no}/g, 'MTR-8819')
      .replace(/{due_date}/g, '15-July-2026')
      .replace(/{overdue_days}/g, '35')
      .replace(/{pay_link}/g, settings.paymentPortalUrl)
      .replace(/{support_phone}/g, settings.supportPhone)
      .replace(/{utility_name}/g, settings.utilityName);

    setIsPlayingAudio(true);
    speechService.speak(testText, {
      rate: 1.0,
      pitch: 1.05,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Customizable SMS & AI Voice Script Studio</h3>
              <p className="text-xs text-slate-300">
                Personalize tone, language, variables, and Gemini 3.1 Pro conversational scripts
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              speechService.stop();
              onClose();
            }}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Tabs */}
        <div className="px-6 pt-3 flex gap-2 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveType('sms');
              const found = templates.find((t) => t.type === 'sms');
              if (found) handleSelectTemplate(found);
            }}
            className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeType === 'sms'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            SMS Templates ({templates.filter((t) => t.type === 'sms').length})
          </button>
          <button
            onClick={() => {
              setActiveType('aicall');
              const found = templates.find((t) => t.type === 'aicall');
              if (found) handleSelectTemplate(found);
            }}
            className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeType === 'aicall'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            AI Voice Call Scripts ({templates.filter((t) => t.type === 'aicall').length})
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left Column: Template List */}
          <div className="p-4 space-y-2 bg-slate-50/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Preset Scripts
              </span>
              <button
                onClick={handleNewTemplate}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
            </div>

            <div className="space-y-1.5">
              {filteredTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`w-full p-3 rounded-xl text-left border transition-all ${
                    selectedTemplate.id === tpl.id
                      ? 'border-blue-600 bg-white text-blue-900 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <p className="font-bold text-xs">{tpl.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tone: <strong className="capitalize">{tpl.tone}</strong> • {tpl.language || 'English'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Right 2 Columns: Template Editor & AI Generator */}
          <div className="p-5 md:col-span-2 space-y-4 text-xs sm:text-sm">
            {/* Title & Tone Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Template Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Urgency Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="courteous">Courteous / Gentle Reminder</option>
                  <option value="urgent">Urgent / Approaching Disconnection</option>
                  <option value="critical">Critical / Final Notice Enforcement</option>
                  <option value="legal">Formal Legal Notice</option>
                </select>
              </div>
            </div>

            {/* Language & Voice Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Language / Dialect
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  AI Voice Profile
                </label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="Natural">Astra AI (Natural Executive)</option>
                  <option value="Authoritative">Astra AI (Authoritative Enforcement)</option>
                  <option value="Supportive">Astra AI (Customer Support / Payment Desk)</option>
                </select>
              </div>
            </div>

            {/* Textarea Editor */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Script Content
                </label>
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isAiGenerating}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  {isAiGenerating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  Auto-Craft with Gemini 3.1 Pro
                </button>
              </div>
              <textarea
                rows={5}
                value={textTemplate}
                onChange={(e) => setTextTemplate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
              />

              {/* Dynamic Variable Insertion Pills */}
              <div className="flex flex-wrap gap-1 mt-2">
                {[
                  '{name}',
                  '{amount}',
                  '{consumer_id}',
                  '{meter_no}',
                  '{due_date}',
                  '{overdue_days}',
                  '{pay_link}',
                  '{support_phone}',
                  '{utility_name}',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTextTemplate((prev) => prev + ' ' + tag)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Voice Test Preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-700">
                  Hear AI Voice Simulation (Sample Data)
                </span>
              </div>
              <button
                type="button"
                onClick={handleTestAudio}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
              >
                {isPlayingAudio ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    Stop Audio
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Test Voice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              speechService.stop();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {!selectedTemplate.isDefault && (
              <button
                type="button"
                onClick={() => {
                  onDeleteTemplate(selectedTemplate.id);
                  const remaining = templates.filter((t) => t.id !== selectedTemplate.id && t.type === activeType);
                  if (remaining[0]) handleSelectTemplate(remaining[0]);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}

            <button
              id="btn-save-template"
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Save Script Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
