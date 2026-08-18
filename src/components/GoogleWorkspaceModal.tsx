import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  X,
  FileSpreadsheet,
  FileText,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Zap,
  LogIn,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Consumer, UtilitySettings, DispatchLog } from '../types';
import {
  exportConsumersToGoogleSheet,
  createGoogleDocNotice,
  scheduleGoogleCalendarCutoff,
  syncGoogleContacts,
} from '../services/googleWorkspace';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumers: Consumer[];
  logs?: DispatchLog[];
  settings: UtilitySettings;
  user?: User | null;
  token?: string | null;
  onLogin?: () => Promise<void>;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  consumers,
  logs,
  settings,
  user,
  token,
  onLogin,
}) => {

  const [activeTab, setActiveTab] = useState<'sheets' | 'docs' | 'calendar' | 'contacts'>('sheets');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ status: 'success' | 'error'; text: string; url?: string } | null>(null);

  // Initialize cutoff date safely in useEffect to prevent SSR / React hydration flags mismatch
  const [cutoffDate, setCutoffDate] = useState('2026-08-30');

  useEffect(() => {
    try {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const iso = d.toISOString().split('T')[0];
      setCutoffDate(iso);
    } catch (_) {}
  }, []);

  const unpaid = consumers.filter((c) => c.status !== 'paid');

  const handleSignIn = async () => {
    if (!onLogin) return;
    try {
      setIsLoggingIn(true);
      await onLogin();
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        return;
      }
      console.error(err);
      setResultMsg({ status: 'error', text: err.message || 'Google sign-in could not be completed' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleExportSheet = async () => {
    setIsSyncing(true);
    setResultMsg(null);
    try {
      const res = await exportConsumersToGoogleSheet(
        unpaid,
        `⚡ Electricity Defaulters Master Roster - ${new Date().toLocaleDateString()}`
      );
      setResultMsg({ status: 'success', text: res.message, url: res.spreadsheetUrl });
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch (_) {}
    } catch (err: any) {
      console.error(err);
      setResultMsg({ status: 'error', text: err.message || 'Google Sheets export failed' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateDocNotice = async () => {
    setIsSyncing(true);
    setResultMsg(null);
    try {
      const res = await createGoogleDocNotice(
        unpaid,
        `⚡ Formal Electricity Disconnection Notice - ${settings.utilityName}`
      );
      setResultMsg({ status: 'success', text: res.message, url: res.documentUrl });
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch (_) {}
    } catch (err: any) {
      console.error(err);
      setResultMsg({ status: 'error', text: err.message || 'Google Docs creation failed' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleScheduleCalendar = async () => {
    setIsSyncing(true);
    setResultMsg(null);
    try {
      const res = await scheduleGoogleCalendarCutoff(
        cutoffDate,
        `⚡ Electricity Line Disconnection Enforcement (${unpaid.length} Defaulters)`,
        `Action scheduled for ${unpaid.length} accounts with overdue balances totaling ${settings.currency}${unpaid.reduce((s, c) => s + c.amount, 0).toLocaleString()}.`
      );
      setResultMsg({ status: 'success', text: res.message, url: res.eventUrl });
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch (_) {}
    } catch (err: any) {
      console.error(err);
      setResultMsg({ status: 'error', text: err.message || 'Google Calendar scheduling failed' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncContacts = async () => {
    setIsSyncing(true);
    setResultMsg(null);
    try {
      const res = await syncGoogleContacts(unpaid);
      setResultMsg({ status: 'success', text: res.message });
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch (_) {}
    } catch (err: any) {
      console.error(err);
      setResultMsg({ status: 'error', text: err.message || 'Contacts sync failed' });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Google Workspace Sync Hub</h3>
              <p className="text-xs text-blue-100">
                Connected with Sheets, Drive, Docs, Calendar, Contacts & Gmail
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

        {/* Google Authentication Status Banner */}
        <div className={`px-5 py-2.5 flex items-center justify-between border-b text-xs ${
          user && token
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/90 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            {user && token ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Signed in as <strong className="font-semibold">{user.displayName || user.email || 'Authorized Official'}</strong>
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Sign in with Google to enable 1-click Calendar reminders, Sheets and Docs sync</span>
              </>
            )}
          </div>

          {(!user || !token) && onLogin && (
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors cursor-pointer"
            >
              {isLoggingIn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
              <span>Sign In with Google</span>
            </button>
          )}
        </div>

        {/* Tab Selector */}
        <div className="px-5 pt-3 flex gap-2 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('sheets');
              setResultMsg(null);
            }}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'sheets'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Google Sheets
          </button>

          <button
            onClick={() => {
              setActiveTab('docs');
              setResultMsg(null);
            }}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'docs'
                ? 'border-blue-600 text-blue-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Google Docs
          </button>

          <button
            onClick={() => {
              setActiveTab('calendar');
              setResultMsg(null);
            }}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'calendar'
                ? 'border-amber-600 text-amber-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-600" />
            Calendar Cutoffs
          </button>

          <button
            onClick={() => {
              setActiveTab('contacts');
              setResultMsg(null);
            }}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'contacts'
                ? 'border-purple-600 text-purple-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600" />
            Contacts Sync
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {resultMsg && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                resultMsg.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {resultMsg.status === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-xs">{resultMsg.text}</p>
                {resultMsg.url && (
                  <a
                    href={resultMsg.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline mt-1"
                  >
                    Open in Google Workspace <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Sheets Tab */}
          {activeTab === 'sheets' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <h4 className="font-bold text-emerald-950 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  Export Unpaid Accounts Roster to Google Sheets
                </h4>
                <p className="text-xs text-emerald-800">
                  Instantly creates a cloud spreadsheet on your Google Drive formatted with Consumer Name, Account ID, Meter Number, Mobile Phone, Due Date, Overdue Days, and Tariff Category.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleExportSheet}
                    disabled={isSyncing || unpaid.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Exporting to Google Sheets...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Export {unpaid.length} Defaulters to Google Sheets</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Docs Tab */}
          {activeTab === 'docs' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                <h4 className="font-bold text-blue-950 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-700" />
                  Generate Legal Disconnection Demand Notice in Google Docs
                </h4>
                <p className="text-xs text-blue-800">
                  Creates an official statutory electricity line disconnection notice document on Google Drive for departmental enforcement and legal audit trails.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleCreateDocNotice}
                    disabled={isSyncing || unpaid.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generating Google Doc...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Create Disconnection Demand Google Doc</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <h4 className="font-bold text-amber-950 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  Schedule Line Cutoff Enforcement on Google Calendar
                </h4>
                <p className="text-xs text-amber-800">
                  Adds scheduled electricity lineman disconnection action event to Google Calendar with notification reminders for all {unpaid.length} overdue defaulters.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Scheduled Disconnection Cutoff Date
                  </label>
                  <input
                    type="date"
                    value={cutoffDate}
                    onChange={(e) => setCutoffDate(e.target.value)}
                    className="p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-900"
                  />
                </div>
                <div className="pt-1">
                  <button
                    onClick={handleScheduleCalendar}
                    disabled={isSyncing || unpaid.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Scheduling on Google Calendar...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Schedule Cutoff Deadline Event</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                <h4 className="font-bold text-purple-950 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-700" />
                  Sync Consumer Phone Numbers to Google Contacts
                </h4>
                <p className="text-xs text-purple-800">
                  Synchronizes electricity consumer names, IDs, and phone numbers with Google People/Contacts for instant caller identification on departmental mobile devices.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleSyncContacts}
                    disabled={isSyncing || unpaid.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Syncing Google Contacts...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Sync {unpaid.length} Phone Numbers</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
