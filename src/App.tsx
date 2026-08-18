import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  subscribeConsumers,
  subscribeDispatchLogs,
  subscribeTemplates,
  subscribeSettings,
  saveConsumer,
  saveConsumersBatch,
  deleteConsumer,
  addDispatchLog,
  saveTemplate,
  saveSettings,
  seedInitialData,
  getLocalConsumers
} from './lib/firebase';
import { Consumer, DispatchLog, ReminderTemplate, UtilitySettings } from './types';
import { DEFAULT_SETTINGS, DEFAULT_TEMPLATES, INITIAL_CONSUMERS } from './data/sampleDataset';

// Components
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { ActionToolbar } from './components/ActionToolbar';
import { ConsumerTable } from './components/ConsumerTable';
import { HistoryTab } from './components/HistoryTab';
import { AnalyticsView } from './components/AnalyticsView';

// Modals
import { BulkSmsModal } from './components/BulkSmsModal';
import { BulkAiCallModal } from './components/BulkAiCallModal';
import { BulkWaModal } from './components/BulkWaModal';
import { LiveCallModal } from './components/LiveCallModal';
import { FileImportModal } from './components/FileImportModal';
import { EmailReportModal } from './components/EmailReportModal';
import { TemplateEditorModal } from './components/TemplateEditorModal';
import { GoogleWorkspaceModal } from './components/GoogleWorkspaceModal';
import { EditConsumerModal } from './components/EditConsumerModal';
import { SettingsModal } from './components/SettingsModal';
import { LauncherPhoneModal } from './components/LauncherPhoneModal';

// Services
import { generatePdfReport } from './services/pdfExport';
import { speechService } from './services/speechService';
import confetti from 'canvas-confetti';
import { CheckCircle2, PhoneCall, AlertTriangle, Info, Sparkles } from 'lucide-react';

export default function App() {
  // Authentication & Workspace Token
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // App Data State
  const [consumers, setConsumers] = useState<Consumer[]>(INITIAL_CONSUMERS);
  const [logs, setLogs] = useState<DispatchLog[]>([]);
  const [templates, setTemplates] = useState<ReminderTemplate[]>(DEFAULT_TEMPLATES);
  const [settings, setSettings] = useState<UtilitySettings>(DEFAULT_SETTINGS);

  // UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'analytics' | 'templates' | 'no_whatsapp'>('dashboard');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal States
  const [isBulkSmsOpen, setIsBulkSmsOpen] = useState(false);
  const [isBulkCallOpen, setIsBulkCallOpen] = useState(false);
  const [isBulkWaOpen, setIsBulkWaOpen] = useState(false);
  const [isLauncherPhoneModalOpen, setIsLauncherPhoneModalOpen] = useState(false);
  const [isLiveCallOpen, setIsLiveCallOpen] = useState(false);
  const [activeLiveConsumer, setActiveLiveConsumer] = useState<Consumer | null>(null);
  const [isFileImportOpen, setIsFileImportOpen] = useState(false);
  const [isEmailReportOpen, setIsEmailReportOpen] = useState(false);
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditConsumerOpen, setIsEditConsumerOpen] = useState(false);
  const [consumerToEdit, setConsumerToEdit] = useState<Consumer | null>(null);

  // Show Toast Notification Helper
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // 1. Initialize Firebase Auth and real-time Firestore synchronization
  useEffect(() => {
    const unsubAuth = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        if (currentUser) {
          showToast(`Welcome, ${currentUser.displayName || 'Authorized Official'}! Google Workspace connected.`, 'success');
        }
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    // Real-time Firestore subscriptions with local persistence fallback
    const unsubConsumers = subscribeConsumers((list) => {
      if (list && list.length > 0) {
        setConsumers(list);
      }
    });

    const unsubLogs = subscribeDispatchLogs((list) => {
      setLogs(list);
    });

    const unsubTemplates = subscribeTemplates((list) => {
      if (list && list.length > 0) {
        setTemplates(list);
      }
    });

    const unsubSettings = subscribeSettings((cfg) => {
      if (cfg) {
        setSettings(cfg);
      }
    });

    return () => {
      unsubAuth();
      if (typeof unsubConsumers === 'function') unsubConsumers();
      if (typeof unsubLogs === 'function') unsubLogs();
      if (typeof unsubTemplates === 'function') unsubTemplates();
      if (typeof unsubSettings === 'function') unsubSettings();
    };
  }, []);

  // Google Login Handler

  const handleTestAiCall = (phone: string) => {
    const dummyConsumer = {
      id: 'test-ai-call-1',
      consumerId: 'TEST-001',
      name: 'System Admin',
      phone: phone,
      amount: 150,
      dueDate: new Date().toISOString().split('T')[0],
      overdueDays: 5,
      tariffType: 'Domestic' as const,
      address: 'Test Address',
      status: 'unpaid' as const,
      notes: 'Launcher Mobile Test Verification Call',
      createdAt: new Date().toISOString()
    };
    setActiveLiveConsumer(dummyConsumer);
    setIsLiveCallOpen(true);
  };

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showToast('Google Workspace & Firebase Auth connected successfully!', 'success');
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        // User intentionally closed the popup, silently ignore
        return;
      }
      console.error('Sign in error:', err);
      showToast(err.message || 'Google Sign-in was interrupted.', 'info');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      showToast('Signed out of Google Workspace account.', 'info');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Currency Selector
  const handleCurrencyChange = async (curr: string) => {
    const updated = { ...settings, currency: curr };
    setSettings(updated);
    await saveSettings(updated);
    showToast(`Currency updated to ${curr}`, 'info');
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedIds(consumers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Single Actions
  const handleSendSingleWa = (consumer: Consumer) => {
    setConsumerToEdit(null);
    setSelectedIds([consumer.id]);
    setIsBulkWaOpen(true);
  };

  const handleSendSingleSms = (consumer: Consumer) => {
    // Open bulk SMS modal scoped specifically to this single consumer
    setConsumerToEdit(null);
    setIsBulkSmsOpen(true);
    setSelectedIds([consumer.id]);
  };

  const handleTriggerSingleAiCall = (consumer: Consumer) => {
    setActiveLiveConsumer(consumer);
    setIsLiveCallOpen(true);
  };

  const handleTogglePaid = async (consumer: Consumer) => {
    const newStatus: Consumer['status'] = consumer.status === 'paid' ? 'unpaid' : 'paid';
    const updated: Consumer = {
      ...consumer,
      status: newStatus,
    };
    await saveConsumer(updated);
    showToast(
      `Account #${consumer.consumerId} (${consumer.name}) marked as ${newStatus.toUpperCase()}`,
      newStatus === 'paid' ? 'success' : 'info'
    );
    if (newStatus === 'paid') {
      try {
        confetti({ particleCount: 30, spread: 40 });
      } catch (_) {}
    }
  };

  const handleToggleNoWhatsApp = async (consumer: Consumer) => {
    const updated: Consumer = {
      ...consumer,
      hasNoWhatsApp: !consumer.hasNoWhatsApp,
    };
    await saveConsumer(updated);
    showToast(
      `${consumer.name} marked as ${updated.hasNoWhatsApp ? 'NO WhatsApp' : 'WhatsApp Active'}`,
      'info'
    );
  };

  const handleDeleteConsumer = async (id: string) => {
    const target = consumers.find((c) => c.id === id);
    if (window.confirm(`Are you sure you want to remove ${target?.name || 'this consumer'} from defaulters list?`)) {
      await deleteConsumer(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      showToast(`Removed consumer account from ledger`, 'info');
    }
  };

  const handleSaveConsumer = async (consumer: Consumer) => {
    await saveConsumer(consumer);
    showToast(`Saved consumer details for ${consumer.name}`, 'success');
  };

  const handleImportSuccess = async (newRecords: Consumer[], triggerSmsNow?: boolean, triggerCallNow?: boolean) => {
    await saveConsumersBatch(newRecords);
    showToast(`Successfully imported and identified ${newRecords.length} unpaid defaulter accounts!`, 'success');
    if (newRecords.length > 0) {
      const newIds = newRecords.map((r) => r.id);
      setSelectedIds(newIds);
      if (triggerSmsNow) {
        setIsBulkSmsOpen(true);
      } else if (triggerCallNow) {
        setIsBulkCallOpen(true);
      }
    }
  };

  const handleLogDispatch = async (log: DispatchLog) => {
    await addDispatchLog(log);
  };

  const handleReloadSampleData = async () => {
    if (window.confirm('Reset database with official sample overdue electricity consumers?')) {
      await seedInitialData();
      showToast('Loaded 10 live real-world defaulter consumer accounts!', 'success');
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch (_) {}
    }
  };

  // Determine consumer target audience for bulk modals
  const targetedConsumers =
    selectedIds.length > 0
      ? consumers.filter((c) => selectedIds.includes(c.id))
      : consumers.filter((c) => c.status !== 'paid');

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300 max-w-md">
          <div
            className={`p-4 rounded-2xl shadow-xl border backdrop-blur-md flex items-center gap-3 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-white border-emerald-500/40 shadow-emerald-900/20'
                : toastMessage.type === 'error'
                ? 'bg-rose-950/90 text-white border-rose-500/40 shadow-rose-900/20'
                : 'bg-slate-900/90 text-white border-slate-700 shadow-slate-900/30'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
            {toastMessage.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
            <p className="text-xs sm:text-sm font-medium leading-tight">{toastMessage.text}</p>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/60 hover:text-white text-xs font-bold ml-auto"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={user}
        token={token}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenWorkspace={() => setIsWorkspaceOpen(true)}
        onCurrencyChange={handleCurrencyChange}
        onOpenLauncherVerify={() => setIsLauncherPhoneModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
        {/* Dashboard View (Primary Defaulters Master + 1-Click Dispatches) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Top Metric Cards */}
            <DashboardStats
              consumers={consumers}
              logs={logs}
              settings={settings}
            />

            {/* 1-Click Action Hub Toolbar */}
            <ActionToolbar
              consumers={consumers}
              selectedCount={selectedIds.length}
              settings={settings}
              onOpenBulkSms={() => setIsBulkSmsOpen(true)}
              onOpenBulkCall={() => setIsBulkCallOpen(true)}
              onOpenBulkWa={() => setIsBulkWaOpen(true)}
              onOpenFileImport={() => setIsFileImportOpen(true)}
              onExportPdf={() => generatePdfReport(consumers, logs, settings)}
              onOpenEmailReport={() => setIsEmailReportOpen(true)}
              onOpenCalendarSync={() => setIsWorkspaceOpen(true)}
              onOpenAddModal={() => {
                setConsumerToEdit(null);
                setIsEditConsumerOpen(true);
              }}
              onReloadSampleData={handleReloadSampleData}
              onOpenLauncherVerify={() => setIsLauncherPhoneModalOpen(true)}
            />

            {/* Comprehensive Consumer Defaulters Table */}
            <ConsumerTable
              consumers={consumers}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onSendSingleSms={handleSendSingleSms}
              onTriggerSingleAiCall={handleTriggerSingleAiCall}
              onSendSingleWa={handleSendSingleWa}
              onTogglePaid={handleTogglePaid}
              onToggleNoWhatsApp={handleToggleNoWhatsApp}
              onDeleteConsumer={handleDeleteConsumer}
              onEditConsumer={(consumer) => {
                setConsumerToEdit(consumer);
                setIsEditConsumerOpen(true);
              }}
              settings={settings}
            />
          </div>
        )}

        {/* History Tab: SMS & AI Call Dispatch Audit Trail */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-300">
            <HistoryTab
              logs={logs}
              settings={settings}
              onExportPdf={() => generatePdfReport(consumers, logs, settings)}
              onSendFollowUpSms={(log) => {
                const matched = consumers.find((c) => c.consumerId === log.consumerId);
                if (matched) {
                  handleSendSingleSms(matched);
                } else {
                  showToast('Consumer account details ready for SMS followup', 'info');
                  setIsBulkSmsOpen(true);
                }
              }}
            />
          </div>
        )}

        {/* Recovery Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-300">
            <AnalyticsView
              consumers={consumers}
              logs={logs}
              settings={settings}
              onTriggerDisconnectionBlast={() => {
                const critical = consumers.filter((c) => c.status !== 'paid' && c.overdueDays > 60);
                setSelectedIds(critical.map((c) => c.id));
                setIsBulkCallOpen(true);
                showToast(`Targeting ${critical.length} critical defaulters (>60 days overdue)`, 'info');
              }}
            />
          </div>
        )}

        
        {/* No WhatsApp Queue Tab */}
        {activeTab === 'no_whatsapp' && (
          <div className="animate-in fade-in duration-300 space-y-5">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">No WhatsApp Queue</h2>
                  <p className="text-xs text-slate-500">Consumers explicitly marked as not having WhatsApp. Use SMS or AI Voice calls to reach them.</p>
                </div>
              </div>
              <ConsumerTable
                consumers={consumers.filter(c => c.hasNoWhatsApp)}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onSendSingleSms={handleSendSingleSms}
                onTriggerSingleAiCall={handleTriggerSingleAiCall}
                onSendSingleWa={handleSendSingleWa}
                onTogglePaid={handleTogglePaid}
                onToggleNoWhatsApp={handleToggleNoWhatsApp}
                onDeleteConsumer={handleDeleteConsumer}
                onEditConsumer={(consumer) => {
                  setConsumerToEdit(consumer);
                  setIsEditConsumerOpen(true);
                }}
                settings={settings}
              />
            </div>
          </div>
        )}

        {/* Templates Tab (Voice Studio) */}
        {activeTab === 'templates' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  AI Voice Script & SMS Reminder Studio
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage multilingual conversational scripts, tone thresholds, and Gemini 3.1 Pro prompts
                </p>
              </div>
              <button
                id="btn-open-template-editor"
                onClick={() => setIsTemplateEditorOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Open Full Script Studio Editor</span>
              </button>
            </div>

            {/* Quick Template Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white transition-all space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        tpl.type === 'sms'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {tpl.type === 'sms' ? 'SMS Message' : 'AI Voice Call'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 capitalize">
                      Tone: {tpl.tone}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{tpl.title}</h4>
                  <p className="text-xs text-slate-600 font-mono bg-white p-3 rounded-xl border border-slate-100 line-clamp-3">
                    {tpl.textTemplate}
                  </p>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400 font-medium">{tpl.language || 'English'}</span>
                    <button
                      onClick={() => setIsTemplateEditorOpen(true)}
                      className="font-bold text-blue-600 hover:text-blue-800"
                    >
                      Customize Script →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer info banner */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1 font-medium">
            <span className="font-bold text-slate-700">{settings.utilityName}</span> • 1-Click Automated Billing Recovery System
          </p>
          <p className="flex items-center gap-2 text-slate-400">
            <span>Helpline: {settings.supportPhone}</span>
            <span>•</span>
            <span>Portal: {settings.paymentPortalUrl}</span>
          </p>
        </div>
      </footer>

      {/* All Popups & Modals */}
      {isBulkWaOpen && <BulkWaModal
        isOpen={isBulkWaOpen}
        onClose={() => setIsBulkWaOpen(false)}
        consumers={targetedConsumers}
        templates={templates}
        settings={settings}
        onLogDispatch={handleLogDispatch}
        onOpenLauncherVerify={() => setIsLauncherPhoneModalOpen(true)}
        onMarkNoWhatsApp={handleToggleNoWhatsApp}
      />}

      {isBulkSmsOpen && <BulkSmsModal
        isOpen={isBulkSmsOpen}
        onClose={() => setIsBulkSmsOpen(false)}
        consumers={targetedConsumers}
        templates={templates}
        settings={settings}
        onLogDispatch={handleLogDispatch}
        onOpenLauncherVerify={() => setIsLauncherPhoneModalOpen(true)}
      />}

      {isBulkCallOpen && <BulkAiCallModal
        isOpen={isBulkCallOpen}
        onClose={() => setIsBulkCallOpen(false)}
        consumers={targetedConsumers}
        templates={templates}
        settings={settings}
        onLogDispatch={handleLogDispatch}
        onOpenLauncherVerify={() => setIsLauncherPhoneModalOpen(true)}
      />}

      {isLiveCallOpen && activeLiveConsumer && <LiveCallModal
        isOpen={isLiveCallOpen}
        onClose={() => {
          setIsLiveCallOpen(false);
          setActiveLiveConsumer(null);
        }}
        consumer={activeLiveConsumer}
        settings={settings}
        onLogDispatch={handleLogDispatch}
        onSaveConsumer={handleSaveConsumer}
        onTriggerSmsForConsumer={(cons) => {
          showToast(`Instant SMS payment reminder dispatched to ${cons.name} (${cons.phone})`, 'success');
        }}
      />}
      {isFileImportOpen && <FileImportModal
        isOpen={isFileImportOpen}
        onClose={() => setIsFileImportOpen(false)}
        onImportSuccess={handleImportSuccess}
        settings={settings}
      />}

      {isEmailReportOpen && <EmailReportModal
        isOpen={isEmailReportOpen}
        onClose={() => setIsEmailReportOpen(false)}
        consumers={consumers}
        logs={logs}
        settings={settings}
      />}

      {isTemplateEditorOpen && <TemplateEditorModal
        isOpen={isTemplateEditorOpen}
        onClose={() => setIsTemplateEditorOpen(false)}
        templates={templates}
        onSaveTemplate={async (tpl) => {
          await saveTemplate(tpl);
          showToast('Template script saved!', 'success');
        }}
        onDeleteTemplate={(id) => {
          showToast('Template removed', 'info');
        }}
        settings={settings}
      />}

      {isWorkspaceOpen && <GoogleWorkspaceModal
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        consumers={consumers}
        logs={logs}
        settings={settings}
        user={user}
        token={token}
        onLogin={handleLogin}
      />}

      {isEditConsumerOpen && <EditConsumerModal
        isOpen={isEditConsumerOpen}
        onClose={() => {
          setIsEditConsumerOpen(false);
          setConsumerToEdit(null);
        }}
        consumerToEdit={consumerToEdit}
        onSaveConsumer={handleSaveConsumer}
        settings={settings}
      />}

      {isSettingsOpen && <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={async (newSettings) => {
          await saveSettings(newSettings);
          setSettings(newSettings);
          showToast('Utility configuration updated!', 'success');
        }}
        onOpenLauncherVerify={() => setIsLauncherPhoneModalOpen(true)}
      />}

      {isLauncherPhoneModalOpen && <LauncherPhoneModal
        onTestAiCall={handleTestAiCall}
        isOpen={isLauncherPhoneModalOpen}
        onClose={() => setIsLauncherPhoneModalOpen(false)}
        settings={settings}
        onSaveSettings={async (newSettings) => {
          await saveSettings(newSettings);
          setSettings(newSettings);
        }}
        showToast={showToast}
      />}
    </div>
  );
}
