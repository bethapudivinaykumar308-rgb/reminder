import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, Search, FileText, ChevronRight, X, Save, Edit3, Download, PlayCircle, Loader2 } from 'lucide-react';
import { ExtractionJob, ExtractedRecord } from '../types';
import * as XLSX from 'xlsx';

export const VerificationCenter: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<ExtractionJob | null>(null);
  const [records, setRecords] = useState<ExtractedRecord[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'NEEDS_VERIFICATION' | 'AI_EXTRACTED' | 'VERIFIED'>('ALL');
  const [uploading, setUploading] = useState(false);

  // Editor Modal
  const [editingRecord, setEditingRecord] = useState<ExtractedRecord | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeJobId && (jobStatus?.status === 'pending' || jobStatus?.status === 'processing')) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/extraction-job/${activeJobId}`);
          if (res.ok) {
            const data = await res.json();
            setJobStatus(data);
            if (data.status === 'completed' && data.records) {
              setRecords(data.records);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeJobId, jobStatus?.status]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('report', selectedFile);

    try {
      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setActiveJobId(data.jobId);
        setJobStatus({
          id: data.jobId,
          filename: selectedFile.name,
          status: 'pending',
          totalPages: 0,
          processedPages: 0,
          totalRecords: 0,
        });
      } else {
        alert("Upload failed: " + data.error);
      }
    } catch (e) {
      alert("Error uploading file.");
    }
    setUploading(false);
  };

  const handleVerify = (record: ExtractedRecord) => {
    setRecords(records.map(r => r.id === record.id ? { ...r, verificationStatus: 'VERIFIED' } : r));
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    setRecords(records.map(r => r.id === editingRecord.id ? { ...editingRecord, verificationStatus: 'VERIFIED' } : r));
    setEditingRecord(null);
  };

  const handleExport = (verifiedOnly: boolean) => {
    let exportData = records;
    if (verifiedOnly) {
      exportData = records.filter(r => r.verificationStatus === 'VERIFIED');
    } else {
      const unverifiedCount = records.filter(r => r.verificationStatus !== 'VERIFIED').length;
      if (unverifiedCount > 0) {
        if (!confirm(`Warning: You are exporting ${unverifiedCount} unverified records. Continue?`)) return;
      }
    }

    const ws = XLSX.utils.json_to_sheet(exportData.map(r => ({
      USCNO: r.uscno,
      DC_DATE: r.dcDate,
      NAME: r.name,
      MOBILE: r.mobile || '',
      CATEGORY: r.category,
      STATUS: r.status,
      LOAD: r.load,
      POLE_RAW: r.poleRaw,
      POLE_NUMBER: r.poleNumber || '',
      UNITS: r.units || '',
      LPDT: r.lpdt,
      ARR: r.arr,
      CMD: r.cmd,
      TOTAL_AMOUNT: r.totalAmount,
      ACD: r.acd,
      PHYSICAL_PDF_PAGE: r.physicalPdfPage,
      CONFIDENCE: r.confidence,
      VERIFICATION_STATUS: r.verificationStatus
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Extracted Data");
    XLSX.writeFile(wb, `Extraction_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const displayedRecords = filter === 'ALL' ? records : records.filter(r => r.verificationStatus === filter);

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-500" />
            Verification Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">High-Accuracy AI Document Extraction & Validation</p>
        </div>
      </div>

      {!activeJobId ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Upload Electricity Report</h2>
          <p className="text-slate-500 max-w-md text-center mb-8">
            Upload the CPDCL PDF report. Our Vision AI will extract consumer records deterministically. It will never silently guess uncertain values.
          </p>
          <input 
            type="file" 
            accept="application/pdf"
            className="hidden" 
            id="pdf-upload"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
          <div className="flex items-center gap-4">
            <label 
              htmlFor="pdf-upload"
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer transition-colors"
            >
              {selectedFile ? selectedFile.name : "Choose PDF File"}
            </label>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              {uploading ? 'Starting...' : 'Process PDF'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Progress Banner */}
          {(jobStatus?.status === 'processing' || jobStatus?.status === 'pending') && (
            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-200 text-indigo-700 rounded-full flex items-center justify-center animate-pulse">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900">Vision AI Extraction Running</h3>
                  <p className="text-indigo-700 text-sm">{jobStatus.filename}</p>
                </div>
              </div>
              <div className="flex-1 max-w-md w-full">
                <div className="flex justify-between text-xs font-bold text-indigo-800 mb-2">
                  <span>Progress</span>
                  <span>{jobStatus.processedPages} / {jobStatus.totalPages || '?'} Pages</span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-3">
                  <div 
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${jobStatus.totalPages ? (jobStatus.processedPages / jobStatus.totalPages) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {jobStatus?.status === 'completed' && (
            <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1">
              {/* Dashboard Stats */}
              <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total</p>
                    <p className="text-xl font-black text-slate-800">{records.length}</p>
                  </div>
                  <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 shadow-sm">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Verified</p>
                    <p className="text-xl font-black text-emerald-700">{records.filter(r=>r.verificationStatus==='VERIFIED').length}</p>
                  </div>
                  <div className="bg-amber-50 px-4 py-2 rounded-lg border border-amber-100 shadow-sm">
                    <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Needs Review</p>
                    <p className="text-xl font-black text-amber-700">{records.filter(r=>r.verificationStatus==='NEEDS_VERIFICATION').length}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="ALL">Show All Records</option>
                    <option value="NEEDS_VERIFICATION">Needs Verification</option>
                    <option value="AI_EXTRACTED">AI Extracted (Unverified)</option>
                    <option value="VERIFIED">Verified</option>
                  </select>
                  
                  <div className="relative group">
                    <button className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2 text-sm transition-colors">
                      <Download className="w-4 h-4" />
                      Export Excel
                    </button>
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <button onClick={() => handleExport(true)} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 border-b border-slate-100 rounded-t-xl text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Export Verified Only
                      </button>
                      <button onClick={() => handleExport(false)} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 rounded-b-xl text-slate-700 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export All Records
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-auto flex-1 p-0">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">USCNO</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Consumer Name</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Mobile</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Arrears</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">CMD</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Total Amt</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Pg</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          {record.verificationStatus === 'NEEDS_VERIFICATION' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                              <AlertTriangle className="w-3 h-3" /> Flagged
                            </span>
                          )}
                          {record.verificationStatus === 'VERIFIED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          )}
                          {record.verificationStatus === 'AI_EXTRACTED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
                              AI Extracted
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-sm font-medium text-slate-700">{record.uscno}</td>
                        <td className="p-4 text-sm font-bold text-slate-900">{record.name}</td>
                        <td className="p-4 text-sm text-slate-600">{record.mobile || <span className="text-slate-300 italic">Missing</span>}</td>
                        <td className="p-4 text-sm font-mono text-slate-700">{record.arr}</td>
                        <td className="p-4 text-sm font-mono text-slate-700">{record.cmd}</td>
                        <td className="p-4 text-sm font-mono font-bold text-slate-900">{record.totalAmount}</td>
                        <td className="p-4 text-xs text-slate-400">{record.physicalPdfPage}</td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          {record.verificationStatus !== 'VERIFIED' && (
                            <button 
                              onClick={() => handleVerify(record)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Mark Verified"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                          )}
                          <button 
                            onClick={() => setEditingRecord(record)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                          >
                            Review <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {displayedRecords.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-slate-500">
                          No records match the current filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VERIFICATION MODAL - Side by Side View */}
      {editingRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-6xl max-h-full rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Verify Record</h3>
                <p className="text-xs text-slate-500 mt-0.5">Physical Page: {editingRecord.physicalPdfPage}</p>
              </div>
              <button onClick={() => setEditingRecord(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Left Panel: Edit Form */}
              <div className="w-full lg:w-1/2 border-r border-slate-100 p-6 overflow-y-auto bg-white flex flex-col">
                
                {editingRecord.validationErrors.length > 0 && (
                  <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> AI Flags
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {editingRecord.validationErrors.map((err, i) => (
                        <li key={i} className="text-sm text-amber-700">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">USCNO</label>
                    <input 
                      type="text" 
                      value={editingRecord.uscno}
                      onChange={(e) => setEditingRecord({...editingRecord, uscno: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Consumer Name</label>
                    <input 
                      type="text" 
                      value={editingRecord.name}
                      onChange={(e) => setEditingRecord({...editingRecord, name: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Mobile</label>
                    <input 
                      type="text" 
                      value={editingRecord.mobile || ''}
                      onChange={(e) => setEditingRecord({...editingRecord, mobile: e.target.value})}
                      placeholder="Missing"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Pole Info (Raw)</label>
                    <input 
                      type="text" 
                      value={editingRecord.poleRaw || ''}
                      onChange={(e) => setEditingRecord({...editingRecord, poleRaw: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Arrears (Arr)</label>
                    <input 
                      type="number" 
                      value={editingRecord.arr}
                      onChange={(e) => setEditingRecord({...editingRecord, arr: parseFloat(e.target.value) || 0})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Current Demand (CMD)</label>
                    <input 
                      type="number" 
                      value={editingRecord.cmd}
                      onChange={(e) => setEditingRecord({...editingRecord, cmd: parseFloat(e.target.value) || 0})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-indigo-500 mb-1">Total Amount (Calculated validation: {editingRecord.arr + editingRecord.cmd})</label>
                    <input 
                      type="number" 
                      value={editingRecord.totalAmount}
                      onChange={(e) => setEditingRecord({...editingRecord, totalAmount: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg text-lg font-black font-mono text-indigo-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => setEditingRecord(null)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveEdit} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Save & Verify
                  </button>
                </div>
              </div>

              {/* Right Panel: Source Reference */}
              <div className="w-full lg:w-1/2 bg-slate-900 flex flex-col overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10 flex justify-between items-center pointer-events-none">
                  <h4 className="text-white font-bold text-sm">Source Image Reference</h4>
                </div>
                <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-auto">
                   
                   <div className="w-full max-w-lg bg-black/40 rounded-xl border border-white/10 p-6 backdrop-blur-md relative">
                     <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Extracted Raw Text Row</p>
                     <div className="font-mono text-sm text-green-400 leading-relaxed break-words whitespace-pre-wrap">
                        {editingRecord.rawRow || "Raw text not available."}
                     </div>
                     <p className="text-slate-500 text-xs mt-6">
                       Use the raw text extracted from the PDF as the source of truth to cross-reference the fields on the left.
                     </p>
                   </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
