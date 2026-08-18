import * as XLSX from 'xlsx';
import { Consumer } from '../types';

export interface ParseResult {
  records: Omit<Consumer, 'id'>[];
  count: number;
  fileName: string;
}

export const parseFileForBilling = async (file: File): Promise<ParseResult> => {
  const fileName = file.name;
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

  let extractedRawText = '';
  let fileBase64 = '';
  let mimeType = file.type || '';

  if (fileExt === 'xlsx' || fileExt === 'xls' || fileExt === 'csv') {
    // Parse spreadsheet using xlsx
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON or CSV text
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    extractedRawText = `Spreadsheet Sheet: ${firstSheetName}\nTotal Rows: ${jsonRows.length}\n\nCSV Data:\n${csvContent}`;
  } else if (fileExt === 'txt' || fileExt === 'json' || fileExt === 'log') {
    extractedRawText = await file.text();
  } else if (fileExt === 'pdf' || file.type.startsWith('image/')) {
    // Convert PDF / Image to base64 for multimodal Gemini parsing
    mimeType = file.type || (fileExt === 'pdf' ? 'application/pdf' : 'image/png');
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    fileBase64 = btoa(binary);
    extractedRawText = `Multimodal file: ${fileName} (${mimeType}, ${file.size} bytes)`;
  } else {
    // For docx, doc, or other files, attempt text reading or base64
    try {
      const text = await file.text();
      if (text.length > 50 && !text.includes('\u0000')) {
        extractedRawText = text;
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        fileBase64 = btoa(binary);
        mimeType = file.type || 'application/octet-stream';
        extractedRawText = `Document: ${fileName} (${file.size} bytes)`;
      }
    } catch {
      extractedRawText = `File Name: ${fileName}, File Size: ${file.size} bytes.`;
    }
  }

  // Send to Gemini 3.1 Pro Preview High-Thinking backend parser
  const response = await fetch('/api/ai/parse-document', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rawText: extractedRawText,
      fileBase64: fileBase64 || undefined,
      mimeType: mimeType || undefined,
      fileType: fileExt,
      fileName,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to extract billing records with Gemini AI');
  }

  const data = await response.json();
  return {
    records: data.records || [],
    count: (data.records || []).length,
    fileName,
  };
};
