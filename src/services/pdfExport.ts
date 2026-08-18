import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Consumer, DispatchLog, UtilitySettings } from '../types';

export const generatePdfReport = (
  consumers: Consumer[],
  logs: DispatchLog[],
  settings: UtilitySettings
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalOverdue = consumers.reduce((acc, c) => acc + (c.status !== 'paid' ? c.amount : 0), 0);
  const criticalCount = consumers.filter((c) => c.status !== 'paid' && c.overdueDays > 60).length;
  const urgentCount = consumers.filter((c) => c.status !== 'paid' && c.overdueDays >= 30 && c.overdueDays <= 60).length;
  const smsSentCount = logs.filter((l) => l.type === 'sms').length;
  const callsCount = logs.filter((l) => l.type === 'aicall').length;

  // Header Banner
  doc.setFillColor(37, 99, 235); // Royal Electric Blue
  doc.rect(0, 0, 210, 32, 'F');

  // Title & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('⚡ ' + (settings.utilityName || 'ELECTRICITY BOARD REVENUE RECOVERY'), 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Official Overdue Defaulters & Reminder Dispatch Analytics Report | Generated: ${new Date().toLocaleString()}`, 14, 23);

  // Executive Metric Cards (Boxes)
  const drawStatBox = (x: number, y: number, w: number, h: number, label: string, val: string, bg: [number, number, number], fg: [number, number, number]) => {
    doc.setFillColor(...bg);
    doc.roundedRect(x, y, w, h, 2, 2, 'F');
    doc.setTextColor(...fg);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(label.toUpperCase(), x + 4, y + 6);
    doc.setFontSize(12);
    doc.text(val, x + 4, y + 14);
  };

  drawStatBox(14, 38, 43, 18, 'Total Overdue', `${settings.currency}${totalOverdue.toLocaleString()}`, [254, 242, 242], [220, 38, 38]);
  drawStatBox(61, 38, 43, 18, 'Unpaid Consumers', `${consumers.filter(c => c.status !== 'paid').length} Defaulters`, [238, 242, 255], [67, 56, 202]);
  drawStatBox(108, 38, 43, 18, 'Critical (>60 Days)', `${criticalCount} Accounts`, [254, 243, 199], [180, 83, 9]);
  drawStatBox(155, 38, 41, 18, 'Reminders Sent', `${smsSentCount} SMS / ${callsCount} Calls`, [236, 253, 245], [4, 120, 87]);

  // Section Header: Defaulters Breakdown
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Defaulters Master Ledger', 14, 63);

  // Table Data
  const tableData = consumers.map((c) => [
    c.consumerId,
    c.name,
    c.phone,
    c.meterNo,
    c.tariffType,
    `${settings.currency}${c.amount.toLocaleString()}`,
    `${c.overdueDays} d`,
    c.dueDate,
    c.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: 67,
    head: [['ID', 'Name', 'Phone', 'Meter No', 'Tariff', 'Amount', 'Overdue', 'Due Date', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        if (data.cell.raw === 'PAID') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (data.cell.raw === 'UNPAID') {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    },
  });

  // Recent Dispatch Logs Section
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  if (finalY < 230 && logs.length > 0) {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent SMS & AI Call Dispatch Audit Trail', 14, finalY + 10);

    const logRows = logs.slice(0, 8).map((l) => [
      l.type.toUpperCase(),
      l.consumerName,
      l.phone,
      l.status.toUpperCase(),
      l.callDuration ? `${l.callDuration}s` : 'N/A',
      l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : '',
      l.messageContent.slice(0, 40) + '...',
    ]);

    autoTable(doc, {
      startY: finalY + 13,
      head: [['Type', 'Consumer', 'Phone', 'Status', 'Duration', 'Time', 'Message / Script']],
      body: logRows,
      theme: 'plain',
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Support Helpline: ${settings.supportPhone} | Payment Portal: ${settings.paymentPortalUrl} | Page ${i} of ${pageCount}`,
      14,
      290
    );
  }

  const fileName = `Electricity_Overdue_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
