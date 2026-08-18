import React, { useState, useMemo } from 'react';
import {
  Search,
  Flame,
  MessageSquare,
  PhoneCall,
  MessageCircle,
  CheckCircle2,
  Trash2,
  Filter,
  CheckSquare,
  Square,
  Edit2
} from 'lucide-react';
import { Consumer, UtilitySettings } from '../types';

interface ConsumerTableProps {
  consumers: Consumer[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (selectAll: boolean) => void;
  onSendSingleSms: (consumer: Consumer) => void;
  onTriggerSingleAiCall: (consumer: Consumer) => void;
  onSendSingleWa?: (consumer: Consumer) => void;
  onTogglePaid: (consumer: Consumer) => void;
  onToggleNoWhatsApp: (consumer: Consumer) => void;
  onDeleteConsumer: (id: string) => void;
  onEditConsumer: (consumer: Consumer) => void;
  settings: UtilitySettings;
}

export const ConsumerTable: React.FC<ConsumerTableProps> = ({
  consumers,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onSendSingleSms,
  onTriggerSingleAiCall,
  onSendSingleWa,
  onTogglePaid,
  onToggleNoWhatsApp,
  onDeleteConsumer,
  onEditConsumer,
  settings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<'all' | 'critical' | 'urgent' | 'regular' | 'paid' | 'nowa'>('all');
  const [filterTariff, setFilterTariff] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'overdue' | 'amount' | 'name' | 'dueDate'>('overdue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredConsumers = useMemo(() => {
    return consumers
      .filter((c) => {
        // Search
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          c.name.toLowerCase().includes(query) ||
          c.consumerId.toLowerCase().includes(query) ||
          c.meterNo.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query) ||
          c.address.toLowerCase().includes(query);

        if (!matchesSearch) return false;

        // Urgency filter
        if (filterUrgency === 'critical') return c.status !== 'paid' && c.overdueDays > 60;
        if (filterUrgency === 'urgent') return c.status !== 'paid' && c.overdueDays >= 30 && c.overdueDays <= 60;
        if (filterUrgency === 'regular') return c.status !== 'paid' && c.overdueDays < 30;
        if (filterUrgency === 'paid') return c.status === 'paid';
        if (filterUrgency === 'nowa') return !!c.hasNoWhatsApp;

        // Tariff filter
        if (filterTariff !== 'all' && c.tariffType !== filterTariff) return false;

        return true;
      })
      .sort((a, b) => {
        let valA = a.overdueDays;
        let valB = b.overdueDays;

        if (sortBy === 'amount') {
          valA = a.amount;
          valB = b.amount;
        } else if (sortBy === 'name') {
          return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        } else if (sortBy === 'dueDate') {
          return sortOrder === 'asc' ? a.dueDate.localeCompare(b.dueDate) : b.dueDate.localeCompare(a.dueDate);
        }

        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [consumers, searchTerm, filterUrgency, filterTariff, sortBy, sortOrder]);

  const allFilteredSelected =
    filteredConsumers.length > 0 &&
    filteredConsumers.every((c) => selectedIds.includes(c.id));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-consumers"
            type="text"
            placeholder="Search consumer name, ID, meter no, phone, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Urgency Filter */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs">
            <button
              id="filter-urgency-all"
              onClick={() => setFilterUrgency('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterUrgency === 'all'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({consumers.length})
            </button>
            <button
              id="filter-urgency-critical"
              onClick={() => setFilterUrgency('critical')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                filterUrgency === 'critical'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
              &gt;60d Critical
            </button>
            <button
              id="filter-urgency-urgent"
              onClick={() => setFilterUrgency('urgent')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterUrgency === 'urgent'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              30-60d Urgent
            </button>
            <button
              id="filter-urgency-paid"
              onClick={() => setFilterUrgency('paid')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterUrgency === 'paid'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Paid
            </button>
            <button
              id="filter-urgency-nowa"
              onClick={() => setFilterUrgency('nowa')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterUrgency === 'nowa'
                  ? 'bg-slate-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Show consumers marked as having no WhatsApp"
            >
              No WhatsApp
            </button>
          </div>

          {/* Tariff Selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="select-tariff-filter"
              value={filterTariff}
              onChange={(e) => setFilterTariff(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold focus:outline-hidden text-slate-700 cursor-pointer"
            >
              <option value="all">All Tariffs</option>
              <option value="Domestic">Domestic</option>
              <option value="Commercial">Commercial</option>
              <option value="Industrial">Industrial</option>
              <option value="Agricultural">Agricultural</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <select
              id="select-sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-xs font-semibold focus:outline-hidden text-slate-700 cursor-pointer"
            >
              <option value="overdue">Sort: Overdue Days</option>
              <option value="amount">Sort: Unpaid Amount</option>
              <option value="dueDate">Sort: Due Date</option>
              <option value="name">Sort: Consumer Name</option>
            </select>
            <button
              id="btn-toggle-sort-order"
              onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              className="font-bold text-blue-600 px-1 hover:bg-blue-50 rounded"
              title="Toggle sort direction"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200/80 text-[11px] font-bold uppercase text-slate-600 tracking-wider">
              <th className="py-3 px-4 w-10 text-center">
                <button
                  id="btn-select-all-filtered"
                  onClick={() => onSelectAll(!allFilteredSelected)}
                  title={allFilteredSelected ? 'Deselect all' : 'Select all shown'}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {allFilteredSelected ? (
                    <CheckSquare className="w-4 h-4 fill-blue-100 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3">Consumer & Connection</th>
              <th className="py-3 px-3">Phone & Meter</th>
              <th className="py-3 px-3">Overdue Balance</th>
              <th className="py-3 px-3">Due Date & Aging</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4 text-right">Instant 1-Click Reminder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredConsumers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-sm">No consumer records match your filter</p>
                    <p className="text-xs text-slate-400">Try clearing search filters or import a new file.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredConsumers.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                const isCritical = c.status !== 'paid' && c.overdueDays > 60;
                const isUrgent = c.status !== 'paid' && c.overdueDays >= 30 && c.overdueDays <= 60;

                return (
                  <tr
                    key={c.id}
                    className={`transition-colors hover:bg-blue-50/40 ${
                      isSelected ? 'bg-blue-50/70' : c.status === 'paid' ? 'bg-slate-50/40 opacity-70' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4 text-center">
                      <button
                        id={`btn-select-consumer-${c.id}`}
                        onClick={() => onToggleSelect(c.id)}
                        className="text-blue-600 hover:text-blue-800 focus:outline-hidden"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 fill-blue-100 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                        )}
                      </button>
                    </td>

                    {/* Consumer & Connection */}
                    <td className="py-3 px-3">
                      <div className="flex items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{c.name}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                c.tariffType === 'Domestic'
                                  ? 'bg-blue-100 text-blue-700'
                                  : c.tariffType === 'Commercial'
                                  ? 'bg-purple-100 text-purple-700'
                                  : c.tariffType === 'Industrial'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {c.tariffType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <span>ID: {c.consumerId}</span>
                            <span className="text-slate-300">•</span>
                            <span className="truncate max-w-[140px]" title={c.address}>
                              {c.address}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Phone & Meter */}
                    <td className="py-3 px-3 font-mono text-xs">
                      <p className="font-semibold text-slate-800 flex items-center gap-1">
                        <span>{c.phone}</span>
                      </p>
                      <p className="text-slate-500 text-[11px]">Meter: {c.meterNo}</p>
                    </td>

                    {/* Overdue Amount */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <span
                          className={`font-black text-sm sm:text-base ${
                            c.status === 'paid'
                              ? 'text-slate-400 line-through'
                              : isCritical
                              ? 'text-rose-600'
                              : isUrgent
                              ? 'text-amber-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {settings.currency}
                          {c.amount.toLocaleString()}
                        </span>
                      </div>
                      {c.notes && (
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px]" title={c.notes}>
                          {c.notes}
                        </p>
                      )}
                    </td>

                    {/* Due Date & Aging */}
                    <td className="py-3 px-3 text-xs">
                      <p className="text-slate-700 font-medium">{c.dueDate}</p>
                      {c.status !== 'paid' && (
                        <div className="mt-0.5">
                          {isCritical ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              <Flame className="w-2.5 h-2.5 fill-rose-600 text-rose-600" />
                              {c.overdueDays}d Overdue (Cutoff)
                            </span>
                          ) : isUrgent ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              {c.overdueDays}d Overdue
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium">
                              {c.overdueDays} days past due
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-3">
                      <button
                        id={`btn-toggle-paid-${c.id}`}
                        onClick={() => onTogglePaid(c)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                          c.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : isCritical
                            ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title="Click to toggle Paid/Unpaid status"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {c.status.toUpperCase()}
                      </button>
                    </td>

                    {/* Action Buttons: 1-Click WhatsApp, SMS & Interactive AI Voice Call */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Instant WhatsApp Trigger */}
                        <button
                          id={`btn-wa-consumer-${c.id}`}
                          onClick={() => {
                            if (c.hasNoWhatsApp) {
                              onToggleNoWhatsApp(c); // Allow unmarking if they clicked it
                            } else if (onSendSingleWa) {
                              onSendSingleWa(c);
                            }
                          }}
                          title={c.hasNoWhatsApp ? `Marked No WhatsApp. Click to re-enable.` : `Send 1-Click WhatsApp Reminder to ${c.name} (${c.phone})`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            c.hasNoWhatsApp 
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 line-through' 
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white border border-emerald-300 hover:border-emerald-600'
                          }`}
                        >
                          <MessageCircle className={`w-3.5 h-3.5 ${c.hasNoWhatsApp ? 'text-slate-400' : 'text-emerald-600 group-hover:text-white'}`} />
                          <span>{c.hasNoWhatsApp ? 'No WA' : 'WhatsApp'}</span>
                        </button>

                        {/* Instant SMS Trigger */}
                        <button
                          id={`btn-sms-consumer-${c.id}`}
                          onClick={() => onSendSingleSms(c)}
                          title={`Send 1-Click SMS to ${c.name} (${c.phone})`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 transition-all shadow-xs cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>SMS</span>
                        </button>

                        {/* Instant Live AI Voice Call Trigger */}
                        <button
                          id={`btn-aicall-consumer-${c.id}`}
                          onClick={() => onTriggerSingleAiCall(c)}
                          title={`Launch Interactive AI Voice Calling Agent to ${c.name}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 hover:bg-amber-600 hover:text-white border border-amber-300 hover:border-amber-600 transition-all shadow-xs cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>AI Call</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          id={`btn-edit-consumer-${c.id}`}
                          onClick={() => onEditConsumer(c)}
                          title="Edit details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          id={`btn-delete-consumer-${c.id}`}
                          onClick={() => onDeleteConsumer(c.id)}
                          title="Delete record"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          Showing <strong>{filteredConsumers.length}</strong> of <strong>{consumers.length}</strong> accounts
          {selectedIds.length > 0 && (
            <span className="ml-2 font-bold text-blue-700">
              ({selectedIds.length} currently selected for bulk action)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Critical &gt;60d
          </span>
          <span className="flex items-center gap-1 text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Urgent 30-60d
          </span>
          <span className="flex items-center gap-1 text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Paid
          </span>
        </div>
      </div>
    </div>
  );
};
