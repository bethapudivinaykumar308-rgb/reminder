import React, { useState } from 'react';
import {
  TrendingUp,
  FileSpreadsheet,
  Mail,
  PieChart as PieIcon,
  BarChart3,
  Sparkles,
  ShieldCheck,
  Zap,
  RefreshCw
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Consumer, DispatchLog, UtilitySettings, AiReportSummary } from '../types';

interface AnalyticsViewProps {
  consumers: Consumer[];
  logs: DispatchLog[];
  settings: UtilitySettings;
  onExportPdf: () => void;
  onOpenEmailReport: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  consumers,
  logs,
  settings,
  onExportPdf,
  onOpenEmailReport,
}) => {
  const [aiReport, setAiReport] = useState<AiReportSummary | null>(null);
  const [isLoadingAiReport, setIsLoadingAiReport] = useState(false);

  const unpaid = consumers.filter((c) => c.status !== 'paid');
  const paid = consumers.filter((c) => c.status === 'paid');

  const totalOutstanding = unpaid.reduce((sum, c) => sum + c.amount, 0);
  const totalRecovered = paid.reduce((sum, c) => sum + c.amount, 0);

  // 1. Aging Buckets Data
  const agingData = [
    {
      name: '1-15 Days',
      count: unpaid.filter((c) => c.overdueDays <= 15).length,
      amount: unpaid.filter((c) => c.overdueDays <= 15).reduce((a, b) => a + b.amount, 0),
      fill: '#10B981',
    },
    {
      name: '16-30 Days',
      count: unpaid.filter((c) => c.overdueDays > 15 && c.overdueDays <= 30).length,
      amount: unpaid.filter((c) => c.overdueDays > 15 && c.overdueDays <= 30).reduce((a, b) => a + b.amount, 0),
      fill: '#3B82F6',
    },
    {
      name: '31-60 Days',
      count: unpaid.filter((c) => c.overdueDays > 30 && c.overdueDays <= 60).length,
      amount: unpaid.filter((c) => c.overdueDays > 30 && c.overdueDays <= 60).reduce((a, b) => a + b.amount, 0),
      fill: '#F59E0B',
    },
    {
      name: '60+ Days (Cutoff)',
      count: unpaid.filter((c) => c.overdueDays > 60).length,
      amount: unpaid.filter((c) => c.overdueDays > 60).reduce((a, b) => a + b.amount, 0),
      fill: '#EF4444',
    },
  ];

  // 2. Tariff Distribution Data
  const tariffCategories = ['Domestic', 'Commercial', 'Industrial', 'Agricultural'] as const;
  const tariffColors = ['#3B82F6', '#8B5CF6', '#F97316', '#10B981'];

  const tariffData = tariffCategories.map((t, idx) => ({
    name: t,
    count: unpaid.filter((c) => c.tariffType === t).length,
    amount: unpaid.filter((c) => c.tariffType === t).reduce((a, b) => a + b.amount, 0),
    color: tariffColors[idx],
  }));

  // Fetch AI Executive Summary
  const handleGenerateAiReport = async () => {
    setIsLoadingAiReport(true);
    try {
      const stats = {
        totalConsumers: consumers.length,
        totalBalance: totalOutstanding,
        criticalCount: unpaid.filter((c) => c.overdueDays > 60).length,
        smsCount: logs.filter((l) => l.type === 'sms').length,
        callsCount: logs.filter((l) => l.type === 'aicall').length,
        commitmentsCount: logs.filter((l) => l.status === 'promised_to_pay').length,
      };

      const res = await fetch('/api/ai/generate-report-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumers, stats, utilityName: settings.utilityName }),
      });

      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      setAiReport(data.report);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAiReport(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner with Action Controls */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
            ⚡ Revenue Intelligence
          </span>
          <h2 className="text-xl font-black mt-1">Electricity Bill Overdue Analytics</h2>
          <p className="text-xs text-blue-200 mt-0.5">
            Real-time aging distribution, tariff exposure, recovery velocity, and automated report exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-rose-600" />
            Export PDF
          </button>
          <button
            onClick={onOpenEmailReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-xs cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            Email Report
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overdue Aging Horizon Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Overdue Amount by Aging Bucket
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Total: {settings.currency}{totalOutstanding.toLocaleString()}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `${settings.currency}${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [`${settings.currency}${Number(value).toLocaleString()}`, 'Overdue Amount']}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tariff Breakdown Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              Overdue Exposure by Tariff Category
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {unpaid.length} Defaulters
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tariffData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="amount"
                  nameKey="name"
                >
                  {tariffData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${settings.currency}${Number(value).toLocaleString()}`, 'Amount Due']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Executive Strategy Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Gemini 3.1 Pro High-Thinking Recovery Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Strategic recommendations on disconnection enforcement and payment recovery.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateAiReport}
            disabled={isLoadingAiReport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoadingAiReport ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Strategy with AI...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-500" />
                <span>{aiReport ? 'Refresh Strategy' : 'Generate AI Strategy'}</span>
              </>
            )}
          </button>
        </div>

        {aiReport ? (
          <div className="space-y-4 pt-2 border-t border-slate-100 text-xs sm:text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 md:col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Executive Brief
                </p>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {aiReport.executiveSummary}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-center items-center text-center">
                <ShieldCheck className="w-7 h-7 text-emerald-600 mb-1" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  Recovery Probability
                </p>
                <p className="text-3xl font-black text-emerald-950 mt-1">
                  {aiReport.recoveryProbabilityScore}%
                </p>
                <p className="text-[10px] text-emerald-700 mt-1 font-semibold">
                  With 1-Click SMS & AI Call Reminders
                </p>
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                Priority Recovery Directives:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-amber-950 font-medium">
                {aiReport.recommendedActions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          !isLoadingAiReport && (
            <p className="text-xs text-slate-400 italic">
              Click &quot;Generate AI Strategy&quot; to synthesize executive recovery insights and recommendations using Gemini 3.1 Pro High-Thinking.
            </p>
          )
        )}
      </div>
    </div>
  );
};
