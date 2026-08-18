import React from 'react';
import {
  AlertTriangle,
  MessageSquare,
  PhoneCall,
  Flame,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { Consumer, DispatchLog, UtilitySettings } from '../types';

interface DashboardStatsProps {
  consumers: Consumer[];
  logs: DispatchLog[];
  settings: UtilitySettings;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ consumers, logs, settings }) => {
  const unpaidConsumers = consumers.filter((c) => c.status !== 'paid');
  const paidConsumers = consumers.filter((c) => c.status === 'paid');

  const totalOverdueBalance = unpaidConsumers.reduce((sum, c) => sum + c.amount, 0);
  const totalPaidBalance = paidConsumers.reduce((sum, c) => sum + c.amount, 0);

  // Critical Disconnection (> 60 days overdue)
  const criticalList = unpaidConsumers.filter((c) => c.overdueDays > 60);
  const urgentList = unpaidConsumers.filter((c) => c.overdueDays > 30 && c.overdueDays <= 60);
  const moderateList = unpaidConsumers.filter((c) => c.overdueDays <= 30);

  const smsLogs = logs.filter((l) => l.type === 'sms');
  const callLogs = logs.filter((l) => l.type === 'aicall');
  const positiveCommitments = logs.filter(
    (l) => l.status === 'promised_to_pay' || l.status === 'requested_extension'
  );

  return (
    <div className="space-y-4">
      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Outstanding Arrears */}
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-red-50/50 p-4 rounded-2xl border border-rose-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Total Overdue
            </span>
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {settings.currency}
              {totalOverdueBalance.toLocaleString()}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Across {unpaidConsumers.length} unpaid meters
            </p>
          </div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-rose-500/5 rounded-full blur-xl pointer-events-none"></div>
        </div>

        {/* 2. Critical Disconnection Threshold */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50/50 p-4 rounded-2xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Critical &gt;60 Days
            </span>
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 animate-pulse">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight">
              {criticalList.length}
            </p>
            <p className="text-[11px] font-medium text-amber-700/90 mt-0.5">
              {settings.currency}
              {criticalList.reduce((acc, c) => acc + c.amount, 0).toLocaleString()} risk
            </p>
          </div>
        </div>

        {/* 3. Total Defaulters */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50/50 p-4 rounded-2xl border border-blue-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              Unpaid Defaulters
            </span>
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {unpaidConsumers.length}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              {paidConsumers.length} paid ({Math.round((paidConsumers.length / (consumers.length || 1)) * 100)}% settled)
            </p>
          </div>
        </div>

        {/* 4. SMS Reminders Dispatched */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-purple-50/50 p-4 rounded-2xl border border-violet-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
              SMS Dispatched
            </span>
            <span className="p-1.5 rounded-lg bg-violet-100 text-violet-600">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {smsLogs.length}
            </p>
            <p className="text-[11px] font-medium text-emerald-600 font-semibold mt-0.5">
              100% Delivery Tracked
            </p>
          </div>
        </div>

        {/* 5. AI Voice Calls Made */}
        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-sky-50/50 p-4 rounded-2xl border border-cyan-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-800">
              AI Voice Calls
            </span>
            <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-700">
              <PhoneCall className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {callLogs.length}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Interactive Voice Agent
            </p>
          </div>
        </div>

        {/* 6. Commitment & Resolved Rate */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Commitments
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
              {positiveCommitments.length + paidConsumers.length}
            </p>
            <p className="text-[11px] font-medium text-emerald-700 mt-0.5">
              Promises / Extensions
            </p>
          </div>
        </div>
      </div>

      {/* Overdue Aging Horizon Meter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Overdue Aging Distribution
            </span>
            <span className="text-slate-500 font-mono">
              Total Defaulters: {unpaidConsumers.length}
            </span>
          </div>

          <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${(moderateList.length / (unpaidConsumers.length || 1)) * 100}%` }}
              className="bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
              title={`1-30 Days: ${moderateList.length} (${settings.currency}${moderateList.reduce((a, b) => a + b.amount, 0).toLocaleString()})`}
            ></div>
            <div
              style={{ width: `${(urgentList.length / (unpaidConsumers.length || 1)) * 100}%` }}
              className="bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
              title={`31-60 Days: ${urgentList.length} (${settings.currency}${urgentList.reduce((a, b) => a + b.amount, 0).toLocaleString()})`}
            ></div>
            <div
              style={{ width: `${(criticalList.length / (unpaidConsumers.length || 1)) * 100}%` }}
              className="bg-gradient-to-r from-rose-500 to-red-600 transition-all"
              title={`>60 Days (Critical): ${criticalList.length} (${settings.currency}${criticalList.reduce((a, b) => a + b.amount, 0).toLocaleString()})`}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              1-30d: {moderateList.length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              31-60d: {urgentList.length}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600 font-bold text-rose-700"></span>
              &gt;60d (Cutoff Risk): {criticalList.length}
            </span>
            {totalPaidBalance > 0 && (
              <span className="text-emerald-600 font-semibold">
                Recovered: {settings.currency}{totalPaidBalance.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
