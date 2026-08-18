import React, { useState, useEffect } from 'react';
import { X, Sliders, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { UtilitySettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UtilitySettings;
  onSaveSettings: (settings: UtilitySettings) => void;
  onOpenLauncherVerify?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onOpenLauncherVerify,
}) => {

  const [utilityName, setUtilityName] = useState(settings.utilityName);
  const [currency, setCurrency] = useState(settings.currency);
  const [paymentPortalUrl, setPaymentPortalUrl] = useState(settings.paymentPortalUrl);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);
  const [smsSenderId, setSmsSenderId] = useState(settings.smsSenderId);
  const [disconnectionGraceDays, setDisconnectionGraceDays] = useState(settings.disconnectionGraceDays);
  const [aiVoiceGender, setAiVoiceGender] = useState(settings.aiVoiceGender);
  const [defaultLanguage, setDefaultLanguage] = useState(settings.defaultLanguage);
  const [launcherPhone, setLauncherPhone] = useState(settings.launcherPhone || settings.supportPhone || '+91 98765 43210');

  useEffect(() => {
    setUtilityName(settings.utilityName);
    setCurrency(settings.currency);
    setPaymentPortalUrl(settings.paymentPortalUrl);
    setSupportPhone(settings.supportPhone);
    setSmsSenderId(settings.smsSenderId);
    setDisconnectionGraceDays(settings.disconnectionGraceDays);
    setAiVoiceGender(settings.aiVoiceGender);
    setDefaultLanguage(settings.defaultLanguage);
    setLauncherPhone(settings.launcherPhone || settings.supportPhone || '+91 98765 43210');
  }, [settings, isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      utilityName,
      currency,
      paymentPortalUrl,
      supportPhone,
      smsSenderId,
      disconnectionGraceDays: Number(disconnectionGraceDays) || 15,
      aiVoiceGender,
      defaultLanguage,
      launcherPhone,
    });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <Sliders className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">Utility Recovery & AI Configuration</h3>
              <p className="text-xs text-slate-300">
                Billing board credentials, helpline numbers, & AI call profiles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Electricity Board / Utility Name
            </label>
            <input
              type="text"
              required
              value={utilityName}
              onChange={(e) => setUtilityName(e.target.value)}
              placeholder="e.g. State Electricity Distribution Company"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Currency Symbol
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="₹">₹ (INR - Indian Rupee)</option>
                <option value="$">$ (USD - Dollar)</option>
                <option value="€">€ (EUR - Euro)</option>
                <option value="£">£ (GBP - British Pound)</option>
                <option value="AED ">AED (UAE Dirham)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                SMS Sender Header
              </label>
              <input
                type="text"
                required
                value={smsSenderId}
                onChange={(e) => setSmsSenderId(e.target.value)}
                placeholder="e.g. ELEC-NOTIFY"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Support Helpline
              </label>
              <input
                type="text"
                required
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="e.g. 1912 or 1800-425-0001"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cutoff Grace Period (Days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={disconnectionGraceDays}
                onChange={(e) => setDisconnectionGraceDays(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Online Payment Portal URL
            </label>
            <input
              type="url"
              required
              value={paymentPortalUrl}
              onChange={(e) => setPaymentPortalUrl(e.target.value)}
              placeholder="https://billing.electricity.gov.in/quick-pay"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Launcher Mobile Verification Section */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className={`w-4 h-4 ${settings.isLauncherPhoneVerified ? 'text-emerald-600' : 'text-amber-500'}`} />
                <span>లాంచర్ మొబైల్ నంబర్ (Verified Launcher Line)</span>
              </label>
              {settings.isLauncherPhoneVerified ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  ధృవీకరించబడింది ✓
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  ధృవీకరించలేదు
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="tel"
                value={launcherPhone}
                onChange={(e) => setLauncherPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              {onOpenLauncherVerify && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLauncherVerify();
                  }}
                  className="px-3 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-xs cursor-pointer text-xs whitespace-nowrap"
                >
                  {settings.isLauncherPhoneVerified ? 'రీ-వెరిఫై చేయండి' : 'OTP వెరిఫై చేయండి'}
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              ఈ నంబర్ ద్వారానే మొబైల్ SMS యాప్ మరియు AI కాల్స్ వినియోగదారులకు నేరుగా వెళ్తాయి.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default AI Voice Profile
              </label>
              <select
                value={aiVoiceGender}
                onChange={(e) => setAiVoiceGender(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="female">Astra Telugu Female (స్పష్టమైన వాయిస్)</option>
                <option value="male">Astra Telugu Male (అధికారిక వాయిస్)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Default Language
              </label>
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="Telugu">Telugu (తెలుగు) - Default</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-800 leading-relaxed">
              All settings synchronize in real-time with Firebase Firestore and apply dynamically across all 1-Click bulk SMS dispatches and AI calling agents.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              id="btn-save-settings"
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
