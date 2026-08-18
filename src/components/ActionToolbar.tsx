import React from 'react';
import {
  MessageSquare,
  PhoneCall,
  MessageCircle,
  UploadCloud,
  FileSpreadsheet,
  Mail,
  Calendar,
  UserPlus,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Phone,
  ArrowUpRight
} from 'lucide-react';
import { Consumer, UtilitySettings } from '../types';

interface ActionToolbarProps {
  consumers: Consumer[];
  selectedCount: number;
  settings: UtilitySettings;
  onOpenBulkSms: () => void;
  onOpenBulkCall: () => void;
  onOpenBulkWa: () => void;
  onOpenFileImport: () => void;
  onExportPdf: () => void;
  onOpenEmailReport: () => void;
  onOpenCalendarSync: () => void;
  onOpenAddModal: () => void;
  onReloadSampleData: () => void;
  onOpenLauncherVerify?: () => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  consumers,
  selectedCount,
  settings,
  onOpenBulkSms,
  onOpenBulkCall,
  onOpenBulkWa,
  onOpenFileImport,
  onExportPdf,
  onOpenEmailReport,
  onOpenCalendarSync,
  onOpenAddModal,
  onReloadSampleData,
  onOpenLauncherVerify,
}) => {
  const unpaidCount = consumers.filter((c) => c.status !== 'paid').length;
  const targetCount = selectedCount > 0 ? selectedCount : unpaidCount;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-4 sm:p-5 rounded-3xl text-white shadow-xl border border-indigo-900/50 space-y-4">
      {/* Top Row: Title, Target Count, Officer Line & 1-Click Trigger Buttons */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Headline & Active Officer Phone */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Sparkles className="w-3 h-3 text-amber-300" />
              1-Click Recovery Engine
            </span>
            <button
              type="button"
              onClick={onOpenLauncherVerify}
              title="Click to verify launcher mobile number"
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono transition-colors cursor-pointer ${
                settings.isLauncherPhoneVerified
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
              }`}
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>లాంచర్ మొబైల్: {settings.launcherPhone || settings.supportPhone || '+91 98765 43210'}</span>
              <span className="text-[10px] underline font-sans ml-1">
                {settings.isLauncherPhoneVerified ? '(ధృవీకరించబడింది)' : '(ధృవీకరించండి)'}
              </span>
            </button>
            {selectedCount > 0 && (
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-500 text-white">
                {selectedCount} Selected
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white">
            Dispatch Instant WhatsApp, SMS & AI Voice Reminders
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Targeting{' '}
            <strong className="text-amber-300 underline font-bold">
              {targetCount} {selectedCount > 0 ? 'selected' : 'unpaid'} electricity consumers
            </strong>{' '}
            with 100% Free WhatsApp deep links, carrier delivery logs & Astra AI voice dialing.
          </p>
        </div>

        {/* 1-Click Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* 1-Click Free WhatsApp Button */}
          <button
            id="btn-bulk-whatsapp-blast"
            onClick={onOpenBulkWa}
            disabled={unpaidCount === 0}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40 transform active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-100 animate-pulse" />
            <span>Free WhatsApp ({targetCount})</span>
          </button>

          {/* 1-Click Bulk SMS Blast Button */}
          <button
            id="btn-bulk-sms-blast"
            onClick={onOpenBulkSms}
            disabled={unpaidCount === 0}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 transform active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-blue-100" />
            <span>Bulk SMS ({targetCount})</span>
          </button>

          {/* 1-Click Bulk AI Voice Call Reminder Button */}
          <button
            id="btn-bulk-ai-call"
            onClick={onOpenBulkCall}
            disabled={unpaidCount === 0}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/30 hover:shadow-lg hover:shadow-amber-500/40 transform active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-slate-950" />
            <span>AI Call ({targetCount})</span>
          </button>
        </div>
      </div>

      {/* Prominent Upload & Guide Bar */}
      <div className="pt-3 border-t border-indigo-800/60 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Upload Unpaid Details Button */}
          <button
            id="btn-import-unpaid-file"
            onClick={onOpenFileImport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-slate-950" />
            <span>📤 Upload Unpaid Defaulters</span>
          </button>

          {/* How to Upload Process Guide Button */}
          <button
            id="btn-show-upload-process"
            onClick={onOpenFileImport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700/70 font-semibold transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
            <span>Show Upload Process Guide</span>
          </button>

          {/* Export PDF Analytics */}
          <button
            id="btn-export-pdf"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
            <span>Export PDF Report</span>
          </button>

          {/* Email Report to User */}
          <button
            id="btn-email-report"
            onClick={onOpenEmailReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-sky-400" />
            <span>Send Email Report</span>
          </button>

          {/* Google Calendar Cutoff Alert */}
          <button
            id="btn-calendar-sync"
            onClick={onOpenCalendarSync}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Calendar Cutoffs</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Manual Consumer */}
          <button
            id="btn-add-consumer"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-300" />
            <span>Add Account</span>
          </button>

          {/* Reload Sample Data */}
          <button
            id="btn-reload-sample"
            onClick={onReloadSampleData}
            title="Reset / Load 10 sample real-world overdue electricity bill defaulters"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sample Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
