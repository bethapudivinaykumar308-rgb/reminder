import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Send,
  Download,
  FileCheck,
  HelpCircle,
  ArrowRight,
  Phone,
  UserCheck,
  Zap,
  Check,
  Layers,
  FileCode,
  Smartphone,
  PhoneCall
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Consumer, UtilitySettings } from '../types';
import { parseFileForBilling } from '../services/fileParser';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (records: Consumer[], triggerSmsNow?: boolean, triggerCallNow?: boolean) => void;
  settings: UtilitySettings;
}

export const FileImportModal: React.FC<FileImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  settings,
}) => {

  const [activeTab, setActiveTab] = useState<'process_guide' | 'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewRecords, setPreviewRecords] = useState<Omit<Consumer, 'id'>[]>([]);
  const [rawTextInput, setRawTextInput] = useState('');
  const [guideActiveStep, setGuideActiveStep] = useState<number>(1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg(null);
      setPreviewRecords([]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMsg(null);
      setPreviewRecords([]);
    }
  };

  // Generate and download a sample CSV file
  const handleDownloadSampleCsv = () => {
    const csvContent = `Consumer Name,Phone Number,Account ID,Meter Number,Overdue Amount,Overdue Days,Due Date,Tariff Category,Address,Notes
Suresh Kumar,+919876500112,EB-8901,MTR-9821,4850,38,2026-07-08,Commercial,Shop #14 Gandhi Market,Shop bill unpaid for 2 cycles
Ananya Patel,+919845011998,EB-8902,MTR-4412,2120,22,2026-07-24,Domestic,Flat 4B Metro Heights,High AC usage bill pending
Vikramaditya Rao,+919900123456,EB-8903,MTR-7721,14600,55,2026-06-21,Industrial,Plot 8 Industrial Estate,Small workshop connection
Meenakshi Sundaram,+919731209876,EB-8904,MTR-1198,1890,19,2026-07-27,Domestic,12 Temple Road,Tenant vacated
Rahul Deshmukh,+919819988776,EB-8905,MTR-5532,6750,42,2026-07-04,Commercial,Bakery Main Road,Restaurant bakery power connection
Priya Sharma,+919822334455,EB-8906,MTR-6641,3200,31,2026-07-15,Domestic,House 88 Green Valley,Disconnection warning sent`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Electricity_Defaulters_Sample_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSampleDefaultersText = () => {
    setActiveTab('paste');
    setRawTextInput(`STATE ELECTRICITY BOARD - UNPAID DEFAULTER DISPATCH LEDGER
Date: August 2026 | Substation: Metro North Grid

1. Account: EB-8901 | Name: Suresh Kumar | Phone: +919876500112 | Meter: MTR-9821 | Amount: ₹4,850.00 | Overdue: 38 Days | Tariff: Commercial | Notes: Shop bill unpaid for 2 billing cycles
2. Account: EB-8902 | Name: Ananya Patel | Phone: +919845011998 | Meter: MTR-4412 | Amount: ₹2,120.00 | Overdue: 22 Days | Tariff: Domestic | Notes: High AC usage, payment delayed
3. Account: EB-8903 | Name: Vikramaditya Rao | Phone: +919900123456 | Meter: MTR-7721 | Amount: ₹14,600.00 | Overdue: 55 Days | Tariff: Industrial | Notes: Small workshop connection, multiple notices sent
4. Account: EB-8904 | Name: Meenakshi Sundaram | Phone: +919731209876 | Meter: MTR-1198 | Amount: ₹1,890.00 | Overdue: 19 Days | Tariff: Domestic | Notes: Tenant vacated, owner contact pending
5. Account: EB-8905 | Name: Rahul Deshmukh | Phone: +919819988776 | Meter: MTR-5532 | Amount: ₹6,750.00 | Overdue: 42 Days | Tariff: Commercial | Notes: Restaurant bakery connection`);
    setErrorMsg(null);
  };

  const handleStartParsing = async () => {
    setIsParsing(true);
    setErrorMsg(null);
    setParsingStep('Reading document structure...');

    try {
      if (activeTab === 'upload') {
        if (!selectedFile) {
          setErrorMsg('Please select an Excel, Word, PDF, or image file to import.');
          setIsParsing(false);
          return;
        }

        setParsingStep('Gemini 3.1 Pro analyzing document structure & extracting defaulter list...');
        const result = await parseFileForBilling(selectedFile);

        if (result.records.length === 0) {
          setErrorMsg('No valid unpaid electricity billing records could be extracted. Please check the file content.');
        } else {
          setPreviewRecords(result.records);
        }
      } else {
        // Raw text paste
        if (!rawTextInput.trim()) {
          setErrorMsg('Please paste billing text or table data.');
          setIsParsing(false);
          return;
        }

        setParsingStep('Gemini 3.1 Pro analyzing text & extracting consumer accounts...');
        const res = await fetch('/api/ai/parse-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText: rawTextInput,
            fileType: 'txt',
            fileName: 'Pasted_Billing_Data.txt',
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to extract billing records');
        }

        const data = await res.json();
        if ((data.records || []).length === 0) {
          setErrorMsg('No consumer accounts recognized from pasted text.');
        } else {
          setPreviewRecords(data.records);
        }
      }
    } catch (err: any) {
      console.error('Parsing error:', err);
      setErrorMsg(err.message || 'Failed to parse file with AI');
    } finally {
      setIsParsing(false);
      setParsingStep('');
    }
  };

  const handleConfirmImport = (triggerSmsNow: boolean = false, triggerCallNow: boolean = false) => {
    const fullConsumers: Consumer[] = previewRecords.map((r, i) => ({
      id: `cons-import-${Date.now()}-${i}`,
      ...r,
      status: r.status || 'unpaid',
      createdAt: new Date().toISOString(),
    }));

    onImportSuccess(fullConsumers, triggerSmsNow, triggerCallNow);
    try {
      confetti({ particleCount: 60, spread: 50 });
    } catch (_) {}
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <UploadCloud className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Upload Unpaid Defaulters</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini 3.1 Pro Multimodal
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Upload Excel, Word, PDF, or text. AI extracts unpaid consumers, validates phone numbers & triggers recovery.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Process Guide vs File Upload vs Text Paste */}
        <div className="px-5 pt-3.5 flex items-center justify-between border-b border-slate-100 text-xs font-semibold bg-slate-50/50">
          <div className="flex gap-2">
            <button
              id="tab-process-guide"
              onClick={() => setActiveTab('process_guide')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'process_guide'
                  ? 'border-indigo-600 text-indigo-700 font-bold bg-indigo-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>📖 How to Upload (Process Guide)</span>
            </button>
            <button
              id="tab-upload-file"
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Upload File (.xlsx, .docx, .pdf, .csv)</span>
            </button>
            <button
              id="tab-paste-text"
              onClick={() => setActiveTab('paste')}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Paste Defaulters Text</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              title="Download sample CSV template"
            >
              <Download className="w-3 h-3" />
              <span>Sample CSV</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <p className="text-xs font-medium">{errorMsg}</p>
            </div>
          )}

          {/* TAB 1: HOW TO UPLOAD UNPAID DETAILS PROCESS GUIDE */}
          {activeTab === 'process_guide' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Top Guide Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100/60 border border-indigo-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    ⚡
                  </div>
                  <div>
                    <h4 className="font-black text-indigo-950 text-sm sm:text-base">
                      Complete Step-by-Step Guide: Uploading Unpaid Defaulter Records
                    </h4>
                    <p className="text-xs text-indigo-800">
                      Follow these 4 simple steps to upload unpaid consumer lists, validate phone numbers, and trigger automated SMS & AI Voice recovery calls.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step Navigator */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                {[
                  { step: 1, title: '1. Prepare File', desc: 'Excel, Word, PDF or CSV' },
                  { step: 2, title: '2. Required Fields', desc: 'Name, Phone & Amount' },
                  { step: 3, title: '3. AI Extraction', desc: 'Gemini Auto-Scans' },
                  { step: 4, title: '4. Instant Recovery', desc: 'SMS & Voice Calling' },
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setGuideActiveStep(s.step)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      guideActiveStep === s.step
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <p className="font-black text-xs text-indigo-700">{s.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>

              {/* Detailed Step Content */}
              {guideActiveStep === 1 && (
                <div className="p-4.5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                  <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    Step 1: Supported File Formats & Documents
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    You can upload almost any document generated by your billing software or legacy departmental records. Gemini 3.1 Pro will automatically parse the layout:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                      <p className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        Excel & CSV
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-1">
                        <code>.xlsx</code>, <code>.xls</code>, <code>.csv</code> sheets with tabular consumer columns.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200">
                      <p className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Word & Docs
                      </p>
                      <p className="text-[11px] text-blue-700 mt-1">
                        <code>.docx</code>, <code>.doc</code> tables or listed disconnection rosters.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200">
                      <p className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                        <FileCode className="w-4 h-4 text-purple-600" />
                        PDF & Scans
                      </p>
                      <p className="text-[11px] text-purple-700 mt-1">
                        <code>.pdf</code> bills, OCR invoices, or text rosters.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {guideActiveStep === 2 && (
                <div className="p-4.5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                  <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    Step 2: Recommended Columns & Data Structure
                  </h5>
                  <p className="text-xs text-slate-600">
                    While AI can flexibly detect custom column headers, having these standard columns gives the most accurate recovery results:
                  </p>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 font-bold text-slate-700">
                        <tr>
                          <th className="p-2">Field Name</th>
                          <th className="p-2">Requirement</th>
                          <th className="p-2">Example Value</th>
                          <th className="p-2">Purpose in Recovery</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-2 font-bold text-slate-900">Consumer Name</td>
                          <td className="p-2 text-rose-600 font-semibold">Required</td>
                          <td className="p-2 font-mono">Suresh Kumar</td>
                          <td className="p-2 text-slate-600">Personalized greeting in SMS & Voice calls</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-slate-900">Phone Number</td>
                          <td className="p-2 text-rose-600 font-semibold">Required</td>
                          <td className="p-2 font-mono text-blue-600 font-bold">+919876500112</td>
                          <td className="p-2 text-slate-600">Direct mobile for SMS delivery & AI Voice dialing</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-slate-900">Overdue Amount</td>
                          <td className="p-2 text-rose-600 font-semibold">Required</td>
                          <td className="p-2 font-mono text-emerald-700 font-bold">4850</td>
                          <td className="p-2 text-slate-600">Calculates bill outstanding & payment link amount</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-slate-900">Account / Consumer ID</td>
                          <td className="p-2 text-slate-500 font-medium">Recommended</td>
                          <td className="p-2 font-mono">EB-8901</td>
                          <td className="p-2 text-slate-600">Official billing reference spoken during AI call</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-slate-900">Overdue Days / Due Date</td>
                          <td className="p-2 text-slate-500 font-medium">Recommended</td>
                          <td className="p-2 font-mono">38 Days</td>
                          <td className="p-2 text-slate-600">Determines tone (polite vs urgent disconnection)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Need a starting file? Download our pre-filled template:</span>
                    <button
                      onClick={handleDownloadSampleCsv}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Sample Spreadsheet Template</span>
                    </button>
                  </div>
                </div>
              )}

              {guideActiveStep === 3 && (
                <div className="p-4.5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                  <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      3
                    </span>
                    Step 3: AI Intelligent Ingestion & Validation
                  </h5>
                  <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                    <p>
                      When you click <strong>"Identify Unpaid Defaulters"</strong>, the multimodal Gemini 3.1 Pro agent performs the following automated checks:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>
                        <strong>Cleans Phone Numbers:</strong> Strips extraneous hyphens, spaces, and formats valid E.164 mobile numbers with international country codes.
                      </li>
                      <li>
                        <strong>Filters Paid Accounts:</strong> Automatically skips zero-balance or paid consumers so you only target active defaulters.
                      </li>
                      <li>
                        <strong>Identifies High-Risk Defaulters:</strong> Accounts overdue by &gt;30 or &gt;60 days are tagged for prioritized escalation.
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {guideActiveStep === 4 && (
                <div className="p-4.5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                  <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      4
                    </span>
                    Step 4: 1-Click Instant SMS & Voice Calls with Live Progress
                  </h5>
                  <p className="text-xs text-slate-600">
                    Immediately after AI extraction, you have three instant recovery options:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-1">
                      <p className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                        <Send className="w-4 h-4 text-blue-600" />
                        1-Click Bulk SMS Blast
                      </p>
                      <p className="text-[11px] text-blue-700">
                        Dispatches personalized SMS payment links to each consumer's mobile phone with real-time gateway progress tracking.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                      <p className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                        <PhoneCall className="w-4 h-4 text-emerald-600" />
                        1-Click Bulk AI Voice Caller
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Astra AI dials each phone number, speaks the overdue balance, and captures promised payment dates directly into your database.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons to Jump to Upload or Sample */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                <button
                  onClick={handleLoadSampleDefaultersText}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  <span>Try With 5 Sample Defaulters</span>
                </button>

                <button
                  onClick={() => setActiveTab('upload')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  <span>Ready! Proceed to File Upload</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2 & 3: FILE UPLOAD & TEXT PASTE */}
          {activeTab !== 'process_guide' && previewRecords.length === 0 && (
            activeTab === 'upload' ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center bg-slate-50/60 hover:bg-blue-50/20 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer"
                onClick={() => document.getElementById('file-input-billing')?.click()}
              >
                <input
                  id="file-input-billing"
                  type="file"
                  accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.txt,.json,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-blue-100/80 text-blue-700 flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    {selectedFile ? selectedFile.name : 'Click to upload or drag & drop files here'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports Excel (.xlsx, .xls, .csv), Word (.docx), PDF (.pdf), or Image Bill Scans
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                    Excel (.xlsx / .csv)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                    Word (.docx)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-mono text-[10px] font-bold">
                    PDF & Images
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Paste Unpaid People Details / Table Rows
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSampleDefaultersText}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Insert Sample Defaulter Data
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={rawTextInput}
                  onChange={(e) => setRawTextInput(e.target.value)}
                  placeholder={`Paste any text with names, phone numbers, overdue amounts, account numbers, and meter details...`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )
          )}

          {/* PREVIEW EXTRACTED RECORDS */}
          {previewRecords.length > 0 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-emerald-900">
                      Identified {previewRecords.length} Unpaid Defaulters from Document
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      Extracted names, phone numbers, overdue amounts, and due dates ready for instant SMS & AI Call recovery.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewRecords([])}
                  className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer"
                >
                  Clear / Re-upload
                </button>
              </div>

              {/* Table Preview */}
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Customer Name</th>
                      <th className="p-2.5">Account ID</th>
                      <th className="p-2.5">Phone (SMS/Call Target)</th>
                      <th className="p-2.5">Overdue Balance</th>
                      <th className="p-2.5">Overdue Days</th>
                      <th className="p-2.5">Tariff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRecords.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          {r.name}
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">{r.consumerId}</td>
                        <td className="p-2.5 font-mono text-slate-800 font-bold">{r.phone}</td>
                        <td className="p-2.5 font-black text-rose-600">
                          {settings.currency}
                          {r.amount.toLocaleString()}
                        </td>
                        <td className="p-2.5 font-semibold text-amber-700">{r.overdueDays}d overdue</td>
                        <td className="p-2.5 text-slate-600">{r.tariffType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Parsing status loader */}
          {isParsing && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center gap-3 shadow-lg animate-pulse">
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
              <div>
                <p className="text-xs font-bold text-amber-300">
                  {parsingStep || 'Analyzing file semantics...'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Extracting unpaid defaulters, phone numbers, meter IDs, and amounts for automated recovery.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>

          {previewRecords.length === 0 ? (
            activeTab !== 'process_guide' ? (
              <button
                id="btn-trigger-ai-parse-document"
                type="button"
                onClick={handleStartParsing}
                disabled={isParsing || (activeTab === 'upload' && !selectedFile) || (activeTab === 'paste' && !rawTextInput.trim())}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Parsing Defaulters with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Identify Unpaid Defaulters</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('upload')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer shadow-xs"
              >
                <span>Go to File Upload</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleConfirmImport(false, false)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Save {previewRecords.length} to Ledger</span>
              </button>

              <button
                id="btn-import-and-send-sms"
                type="button"
                onClick={() => handleConfirmImport(true, false)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>⚡ Save & Send SMS Reminders</span>
              </button>

              <button
                id="btn-import-and-call"
                type="button"
                onClick={() => handleConfirmImport(false, true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>📞 Save & Launch AI Calls</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
