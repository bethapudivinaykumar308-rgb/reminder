import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, UserCheck } from 'lucide-react';
import { Consumer, UtilitySettings } from '../types';

interface EditConsumerModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumerToEdit: Consumer | null;
  onSaveConsumer: (consumer: Consumer) => void;
  settings: UtilitySettings;
}

export const EditConsumerModal: React.FC<EditConsumerModalProps> = ({
  isOpen,
  onClose,
  consumerToEdit,
  onSaveConsumer,
  settings,
}) => {

  const [name, setName] = useState('');
  const [consumerId, setConsumerId] = useState('');
  const [meterNo, setMeterNo] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState<number>(3500);
  const [dueDate, setDueDate] = useState('');
  const [overdueDays, setOverdueDays] = useState<number>(30);
  const [tariffType, setTariffType] = useState<Consumer['tariffType']>('Domestic');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<Consumer['status']>('unpaid');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (consumerToEdit) {
      setName(consumerToEdit.name);
      setConsumerId(consumerToEdit.consumerId);
      setMeterNo(consumerToEdit.meterNo);
      setPhone(consumerToEdit.phone);
      setEmail(consumerToEdit.email || '');
      setAmount(consumerToEdit.amount);
      setDueDate(consumerToEdit.dueDate);
      setOverdueDays(consumerToEdit.overdueDays);
      setTariffType(consumerToEdit.tariffType);
      setAddress(consumerToEdit.address);
      setStatus(consumerToEdit.status);
      setNotes(consumerToEdit.notes || '');
    } else {
      setName('');
      setConsumerId(`EB-${Math.floor(1000 + Math.random() * 9000)}`);
      setMeterNo(`MTR-${Math.floor(1000 + Math.random() * 9000)}`);
      setPhone('+91 ');
      setEmail('');
      setAmount(4200);
      const d = new Date();
      d.setDate(d.getDate() - 25);
      setDueDate(d.toISOString().split('T')[0]);
      setOverdueDays(25);
      setTariffType('Domestic');
      setAddress('');
      setStatus('unpaid');
      setNotes('');
    }
  }, [consumerToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalConsumer: Consumer = {
      id: consumerToEdit ? consumerToEdit.id : `cons-${Date.now()}`,
      name: name.trim() || 'Valued Consumer',
      consumerId: consumerId.trim() || `EB-${Date.now()}`,
      meterNo: meterNo.trim() || 'MTR-0000',
      phone: phone.trim(),
      email: email.trim() || undefined,
      amount: Number(amount) || 0,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      overdueDays: Number(overdueDays) || 0,
      tariffType,
      address: address.trim() || 'Main Distribution Sector',
      status,
      notes: notes.trim() || undefined,
      createdAt: consumerToEdit?.createdAt || new Date().toISOString(),
    };
    onSaveConsumer(finalConsumer);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              {consumerToEdit ? (
                <UserCheck className="w-5 h-5 text-amber-300" />
              ) : (
                <UserPlus className="w-5 h-5 text-amber-300" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold">
                {consumerToEdit ? 'Edit Consumer Account' : 'Add New Defaulter Account'}
              </h3>
              <p className="text-xs text-slate-300">
                Electricity billing ledger details and contact coordinates
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
        <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Consumer Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vinay Kumar Bethapudi"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number (SMS & Calls) *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Consumer ID / USC No *
              </label>
              <input
                type="text"
                required
                value={consumerId}
                onChange={(e) => setConsumerId(e.target.value)}
                placeholder="e.g. EB-2041"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Meter Serial Number
              </label>
              <input
                type="text"
                value={meterNo}
                onChange={(e) => setMeterNo(e.target.value)}
                placeholder="e.g. MTR-8819"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Overdue Amount ({settings.currency}) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Overdue Days
              </label>
              <input
                type="number"
                min="0"
                value={overdueDays}
                onChange={(e) => setOverdueDays(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-amber-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tariff Category
              </label>
              <select
                value={tariffType}
                onChange={(e) => setTariffType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="Domestic">Domestic / Residential</option>
                <option value="Commercial">Commercial / Retail</option>
                <option value="Industrial">Industrial / High Tension</option>
                <option value="Agricultural">Agricultural Pump</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="unpaid">Unpaid (Active Defaulter)</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid / Settled</option>
                <option value="disconnected">Disconnected Line</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Service Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Flat 302, Green Meadows, Sector 4, Hyderabad"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Special Case / Disconnection Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 2nd final notice served; 3-phase meter"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Footer inside form */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              id="btn-save-consumer"
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{consumerToEdit ? 'Update Account' : 'Save Defaulter'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
