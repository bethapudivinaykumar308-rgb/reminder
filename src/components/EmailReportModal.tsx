import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Consumer, DispatchLog, UtilitySettings } from '../types';
import { sendGmailReport } from '../services/googleWorkspace';

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumers: Consumer[];
  logs: DispatchLog[];
  settings: UtilitySettings;
}

export const EmailReportModal: React.FC<EmailReportModalProps> = ({
  isOpen,
  onClose,
  consumers,
  logs,
  settings,
}) => {

  const [recipientEmail, setRecipientEmail] = useState(
    settings.emailReportsTo || 'bethapudivinaykumar308@gmail.com'
  );
  const [subject, setSubject] = useState(
    `⚡ Electricity Bill Overdue & Reminder Dispatch Report - ${new Date().toLocaleDateString()}`
  );
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalOverdue = consumers.reduce((sum, c) => sum + (c.status !== 'paid' ? c.amount : 0), 0);
  const criticalCount = consumers.filter((c) => c.status !== 'paid' && c.overdueDays > 60).length;
  const smsCount = logs.filter((l) => l.type === 'sms').length;
  const callCount = logs.filter((l) => l.type === 'aicall').length;

  const handleSendReport = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setErrorMessage('Please provide a valid recipient email address.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 24px; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: bold;">⚡ ${settings.utilityName}</h1>
          <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Electricity Bill Defaulters & Automated Dispatch Summary</p>
        </div>
        
        <div style="padding: 24px;">
          <h2 style="font-size: 16px; color: #1e293b; margin-top: 0;">Portfolio Overview</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <tr>
              <td style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: bold;">Total Outstanding Arrears</td>
              <td style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #dc2626; font-weight: bold; font-size: 15px;">${settings.currency}${totalOverdue.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Unpaid Defaulters</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${consumers.filter(c => c.status !== 'paid').length} Consumers</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: bold;">Critical Disconnection Risk (&gt;60d)</td>
              <td style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #d97706; font-weight: bold;">${criticalCount} Accounts</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">1-Click SMS Reminders Sent</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #2563eb; font-weight: bold;">${smsCount} Dispatched</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-weight: bold;">1-Click AI Voice Calls Completed</td>
              <td style="padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #059669; font-weight: bold;">${callCount} Calls</td>
            </tr>
          </table>

          <h3 style="font-size: 14px; color: #1e293b;">Top Overdue Accounts Requiring Action</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left;">
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Account</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Name</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Phone</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Amount Due</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">Overdue</th>
              </tr>
            </thead>
            <tbody>
              ${consumers
                .filter(c => c.status !== 'paid')
                .slice(0, 6)
                .map(
                  c => `
                <tr>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-family: monospace;">${c.consumerId}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-weight: bold;">${c.name}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-family: monospace;">${c.phone}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">${settings.currency}${c.amount.toLocaleString()}</td>
                  <td style="padding: 6px 8px; border: 1px solid #e2e8f0;">${c.overdueDays} days</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; font-size: 12px; color: #1e40af; border-radius: 4px;">
            <strong>Online Billing Portal:</strong> ${settings.paymentPortalUrl}<br>
            <strong>Customer Helpline:</strong> ${settings.supportPhone}
          </div>
        </div>

        <div style="background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
          Generated automatically by VoltRemind AI • Powered by Gemini 3.1 Pro High-Thinking
        </div>
      </div>
    `;

    try {
      const result = await sendGmailReport(recipientEmail, subject, htmlContent);
      setSuccessMessage(result.message);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch (_) {}
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to send email report');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <Mail className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Email Dispatch & Analytics Report</h3>
              <p className="text-xs text-blue-100">
                Send comprehensive summary of defaulters & call logs directly to email
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

        {/* Body Form */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs font-semibold">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <p className="text-xs font-medium">{errorMessage}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Recipient Email Address
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. your-email@gmail.com"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Report Metric Summary Pills */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Report Content Included:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-100 font-medium">
                💰 Overdue: <strong className="text-rose-600">{settings.currency}{totalOverdue.toLocaleString()}</strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-100 font-medium">
                👥 Defaulters: <strong>{consumers.filter(c => c.status !== 'paid').length}</strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-100 font-medium">
                📱 SMS Dispatched: <strong>{smsCount}</strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-100 font-medium">
                📞 AI Calls Done: <strong>{callCount}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
          <button
            id="btn-confirm-send-email-report"
            type="button"
            onClick={handleSendReport}
            disabled={isSending || !recipientEmail}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sending via Gmail API...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Report to Email</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
