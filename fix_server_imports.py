import os

with open('server.ts', 'r') as f:
    content = f.read()

imports = """
import multer from 'multer';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import crypto from 'crypto';

// Setup multer for PDF uploads
const upload = multer({ dest: 'uploads/' });

// In-memory extraction jobs store (In production, use Firestore/Redis)
const extractionJobs: Record<string, any> = {};

"""

if 'import multer' not in content:
    content = content.replace('import path from "path";', 'import path from "path";\n' + imports)

with open('server.ts', 'w') as f:
    f.write(content)
