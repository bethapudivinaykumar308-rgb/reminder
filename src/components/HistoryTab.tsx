import React, { useState } from 'react';
import {
  MessageSquare,
  PhoneCall,
  MessageCircle,
  Search,
  CheckCircle2,
  Clock,
  User,
  Filter,
  FileText,
  RotateCw,
  PhoneForwarded,
  Download
} from 'lucide-react';
import { DispatchLog, UtilitySettings } from '../types';

interface HistoryTabProps {
  logs: DispatchLog[];
  settings: UtilitySettings;
  onExportPdf?: () => void;
  onSendFollowUpSms?: (log: DispatchLog) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ logs, settings, onExportPdf, onSendFollowUpSms }) => {
  const [filterType, setFilterType] = useState<'all' | 'whatsapp' | 'sms' | 'aicall'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<DispatchLog | null>(null);

  const filteredLogs = logs.filter((l) => {
    if (filterType !== 'all' && l.type !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        l.consumerName.toLowerCase().includes(q) ||
        l.consumerId.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.messageContent.toLowerCase().includes(q) ||
        (l.customerResponse && l.customerResponse.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const waCount = logs.filter((l) => l.type === 'whatsapp').length;
  const smsCount = logs.filter((l) => l.type === 'sms').length;
  const callCount = logs.filter((l) => l.type === 'aicall').length;

  return (
    <div className="space-y-4">
      {/* Header & Quick Stat Pills */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            WhatsApp, SMS & AI Call Dispatch Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time delivery verification, WhatsApp click logs, call duration timers, and customer commitments.
          </p>
        </div>

        {/* Filter Stats */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({logs.length})
          </button>
          <button
            onClick={() => setFilterType('whatsapp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp ({waCount})
          </button>
          <button
            onClick={() => setFilterType('sms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'sms'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            SMS ({smsCount})
          </button>
          <button
            onClick={() => setFilterType('aicall')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterType === 'aicall'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            AI Calls ({callCount})
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by consumer name, ID, phone number, transcript notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">No dispatch logs found</p>
            <p className="text-xs text-slate-400">
              Click &quot;1-Click Bulk SMS&quot; or &quot;1-Click AI Call&quot; from the dashboard to send reminders.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm"
              >
                {/* Left Type & Consumer Info */}
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      log.type === 'whatsapp'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.type === 'sms'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {log.type === 'whatsapp' ? (
                      <MessageCircle className="w-5 h-5" />
                    ) : log.type === 'sms' ? (
                      <MessageSquare className="w-5 h-5" />
                    ) : (
                      <PhoneCall className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.consumerName}</span>
                      <span className="font-mono text-xs text-slate-500">
                        ({log.phone})
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          log.status === 'delivered' || log.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'promised_to_pay'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-mono mt-0.5 line-clamp-1">
                      {log.messageContent}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span>Account #{log.consumerId}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-700">
                        Amount: {settings.currency}{log.amount?.toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      {log.callDuration && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">
                            Duration: {log.callDuration}s
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action / Details button */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {log.callTranscript && (
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Transcript
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transcript Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Call Transcript: {selectedLog.consumerName}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedLog.phone} • {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-3 font-mono text-xs text-slate-800 bg-slate-50 whitespace-pre-wrap leading-relaxed">
              {selectedLog.callTranscript || selectedLog.messageContent}
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
