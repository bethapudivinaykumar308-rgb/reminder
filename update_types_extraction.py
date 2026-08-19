import os

with open('src/types.ts', 'r') as f:
    content = f.read()

extraction_types = """
export type ExtractionJob = {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalPages: number;
  processedPages: number;
  totalRecords: number;
  error?: string;
  records?: ExtractedRecord[];
  createdAt?: string;
};

export type ExtractedRecord = {
  id: string;
  uscno: string;
  dcDate: string;
  name: string;
  mobile: string | null;
  category: string;
  status: string;
  load: string;
  poleRaw: string;
  poleNumber: string | null;
  units: string | null;
  lpdt: string;
  arr: number;
  cmd: number;
  totalAmount: number;
  acd: number;
  physicalPdfPage: number;
  reportPage?: number;
  rawRow: string;
  confidence: number;
  verificationStatus: 'VERIFIED' | 'AI_EXTRACTED' | 'NEEDS_VERIFICATION';
  validationErrors: string[];
};
"""

if 'ExtractedRecord' not in content:
    content += "\n" + extraction_types

with open('src/types.ts', 'w') as f:
    f.write(content)
