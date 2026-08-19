import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';

async function run() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  page.drawText('3711203000345 10-AUG VISWANADHA//1/01/.26 SS2(293) 29/07/26 -98 1873 1775 0', { x: 50, y: 700 });
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('test.pdf', pdfBytes);
}
run();
