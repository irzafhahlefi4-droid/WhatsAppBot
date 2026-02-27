/**
 * Export commands — generate Excel and PDF files for todo and finance data.
 * Uses ExcelJS for .xlsx and PDFKit for .pdf files.
 */

const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const EXPORT_DIR = path.join(__dirname, '..', '..', 'exports');

if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

// =============================================
// SHARED HELPERS
// =============================================

/** Professional color palette */
const COLOR = {
    primary: 'FF1A3C5E',  // Dark navy blue
    primaryLight: 'FF2C5F8A',  // Medium blue
    headerBg: 'FF1A3C5E',  // Dark navy for headers
    headerText: 'FFFFFFFF',  // White
    subtotalBg: 'FFF0F4F8',  // Light blue-gray
    subtotalText: 'FF1A3C5E',  // Navy
    totalBg: 'FFE8EEF4',  // Slightly darker blue-gray
    totalText: 'FF1A3C5E',  // Navy
    bodyAlt: 'FFFAFBFC',  // Very light gray for alternating rows
    bodyWhite: 'FFFFFFFF',  // White
    borderLight: 'FFD0D5DD',  // Light gray border
    borderMedium: 'FF98A2B3',  // Medium gray border
    borderDark: 'FF1A3C5E',  // Dark border for totals
    footerText: 'FF98A2B3',  // Muted gray
    summaryLabel: 'FF475467',  // Dark gray for labels
    summaryValue: 'FF1A3C5E',  // Navy for values
};

const FONT = {
    title: { name: 'Calibri', size: 14, bold: true, color: { argb: COLOR.primary } },
    subtitle: { name: 'Calibri', size: 9, italic: true, color: { argb: COLOR.footerText } },
    header: { name: 'Calibri', size: 10, bold: true, color: { argb: COLOR.headerText } },
    body: { name: 'Calibri', size: 10, color: { argb: 'FF344054' } },
    subtotal: { name: 'Calibri', size: 10, bold: true, italic: true, color: { argb: COLOR.subtotalText } },
    total: { name: 'Calibri', size: 11, bold: true, color: { argb: COLOR.totalText } },
    footer: { name: 'Calibri', size: 8, italic: true, color: { argb: COLOR.footerText } },
    summaryLabel: { name: 'Calibri', size: 10, color: { argb: COLOR.summaryLabel } },
    summaryValue: { name: 'Calibri', size: 10, bold: true, color: { argb: COLOR.summaryValue } },
};

const BORDER_LIGHT = { style: 'thin', color: { argb: COLOR.borderLight } };
const BORDER_MEDIUM = { style: 'thin', color: { argb: COLOR.borderMedium } };
const BORDER_DARK = { style: 'medium', color: { argb: COLOR.borderDark } };
const BORDER_DOUBLE_DARK = { style: 'double', color: { argb: COLOR.borderDark } };
const BORDER_NONE = { style: 'none' };

const ACCT_FMT = '_(\"Rp\"* #,##0_)';

function getTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function getExportDate() {
    return new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        timeZone: 'Asia/Jakarta',
    });
}

function getExportTime() {
    return new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', hour12: false,
    });
}

function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(num);
}

/** Apply full border to a cell */
function applyBorder(cell, top, bottom, left, right) {
    cell.border = { top, bottom, left, right };
}

/** Apply all-around light border to row cells */
function applyRowBorders(row, colCount, topBorder, bottomBorder) {
    const t = topBorder || BORDER_LIGHT;
    const b = bottomBorder || BORDER_LIGHT;
    for (let i = 1; i <= colCount; i++) {
        applyBorder(row.getCell(i), t, b, BORDER_LIGHT, BORDER_LIGHT);
    }
}

// =============================================
// GROUP EXPENSES BY DATE (shared helper)
// =============================================

function groupByDate(pengeluaran) {
    const byDate = {};
    pengeluaran.forEach(item => {
        const date = item.waktu.split(',')[0]?.trim() || 'Tidak diketahui';
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(item);
    });
    return byDate;
}

function extractTime(waktu) {
    const timePart = waktu.split(',')[1]?.trim() || '';
    if (timePart) {
        return timePart.split('.').slice(0, 2).join(':');
    }
    return '';
}

// =============================================
// TODO EXPORT (Excel)
// =============================================

async function exportTodoExcel(db) {
    if (!db.todo || db.todo.length === 0) return null;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WhatsApp Assistant Bot';
    const sheet = workbook.addWorksheet('Todo List');

    // Column widths
    sheet.getColumn(1).width = 8;
    sheet.getColumn(2).width = 48;
    sheet.getColumn(3).width = 18;

    const COL_COUNT = 3;

    // ── Title ──
    sheet.mergeCells('A1:C1');
    const title = sheet.getCell('A1');
    title.value = 'DAFTAR TUGAS';
    title.font = FONT.title;
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 32;

    // ── Subtitle ──
    sheet.mergeCells('A2:C2');
    const sub = sheet.getCell('A2');
    sub.value = `Diekspor: ${getExportDate()}, ${getExportTime()} WIB`;
    sub.font = FONT.subtitle;
    sub.alignment = { horizontal: 'center' };
    sheet.getRow(2).height = 18;

    // ── Spacer ──
    sheet.getRow(3).height = 6;

    // ── Header ──
    const hdr = sheet.addRow(['No', 'Tugas', 'Status']);
    hdr.font = FONT.header;
    hdr.height = 26;
    hdr.alignment = { vertical: 'middle' };
    for (let i = 1; i <= COL_COUNT; i++) {
        const cell = hdr.getCell(i);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.headerBg } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        applyBorder(cell, BORDER_DARK, BORDER_DARK, BORDER_LIGHT, BORDER_LIGHT);
    }

    // ── Data rows ──
    db.todo.forEach((task, idx) => {
        const row = sheet.addRow([idx + 1, task, 'Belum Selesai']);
        row.font = FONT.body;
        row.height = 22;
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };

        // Alternating row color
        const bgColor = idx % 2 === 0 ? COLOR.bodyWhite : COLOR.bodyAlt;
        for (let i = 1; i <= COL_COUNT; i++) {
            row.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        }
        applyRowBorders(row, COL_COUNT, BORDER_LIGHT, BORDER_LIGHT);
    });

    // ── Total row ──
    const totalRow = sheet.addRow(['', `Total: ${db.todo.length} tugas`, '']);
    totalRow.font = FONT.total;
    totalRow.height = 24;
    for (let i = 1; i <= COL_COUNT; i++) {
        totalRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.totalBg } };
        applyBorder(totalRow.getCell(i), BORDER_DARK, BORDER_DARK, BORDER_LIGHT, BORDER_LIGHT);
    }

    // ── Footer ──
    const spacer = sheet.addRow([]);
    spacer.height = 12;
    sheet.mergeCells(`A${sheet.rowCount + 1}:C${sheet.rowCount + 1}`);
    const footerCell = sheet.getCell(`A${sheet.rowCount}`);
    footerCell.value = `Dibuat oleh WhatsApp Assistant by Irza Fhahlefi — ${getExportDate()}, ${getExportTime()} WIB`;
    footerCell.font = FONT.footer;
    footerCell.alignment = { horizontal: 'center' };
    sheet.getRow(sheet.rowCount).height = 16;

    const fileName = `Todo_List_${getTimestamp()}.xlsx`;
    const filePath = path.join(EXPORT_DIR, fileName);
    await workbook.xlsx.writeFile(filePath);
    return { filePath, fileName };
}

// =============================================
// FINANCE EXPORT — EXCEL (Accounting Style)
// =============================================

async function exportFinanceExcel(db) {
    if (!db.pengeluaran || db.pengeluaran.length === 0) return null;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WhatsApp Assistant Bot';
    const sheet = workbook.addWorksheet('Laporan Keuangan', {
        pageSetup: { paperSize: 9, orientation: 'portrait' },
    });

    // Column widths
    sheet.getColumn(1).width = 18;  // Tanggal
    sheet.getColumn(2).width = 10;  // Jam
    sheet.getColumn(3).width = 6;   // No
    sheet.getColumn(4).width = 36;  // Keterangan
    sheet.getColumn(5).width = 22;  // Jumlah

    const COL_COUNT = 5;

    // ══════════ HEADER ══════════

    // Row 1: Title
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'LAPORAN PENGELUARAN';
    titleCell.font = { ...FONT.title, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 38;

    // Row 2: Period
    sheet.mergeCells('A2:E2');
    const periodCell = sheet.getCell('A2');
    const dates = db.pengeluaran.map(e => e.waktu.split(',')[0]?.trim()).filter(Boolean);
    const uniqueDates = [...new Set(dates)];
    let periodText = '';
    if (uniqueDates.length === 1) {
        periodText = `Periode: ${uniqueDates[0]}`;
    } else if (uniqueDates.length > 1) {
        periodText = `Periode: ${uniqueDates[0]} s/d ${uniqueDates[uniqueDates.length - 1]}`;
    }
    periodCell.value = periodText;
    periodCell.font = FONT.subtitle;
    periodCell.alignment = { horizontal: 'center' };
    sheet.getRow(2).height = 20;

    // Row 3: Export timestamp
    sheet.mergeCells('A3:E3');
    const tsCell = sheet.getCell('A3');
    tsCell.value = `Diekspor: ${getExportDate()}, ${getExportTime()} WIB`;
    tsCell.font = { ...FONT.subtitle, size: 8 };
    tsCell.alignment = { horizontal: 'center' };
    sheet.getRow(3).height = 16;

    // Row 4: Spacer
    sheet.getRow(4).height = 8;

    // ══════════ TABLE HEADER ══════════

    const headerRow = sheet.addRow(['Tanggal', 'Jam', 'No', 'Keterangan', 'Jumlah (Rp)']);
    headerRow.font = FONT.header;
    headerRow.height = 28;
    for (let i = 1; i <= COL_COUNT; i++) {
        const cell = headerRow.getCell(i);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.headerBg } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        applyBorder(cell, BORDER_DARK, BORDER_DARK, BORDER_LIGHT, BORDER_LIGHT);
    }

    // ══════════ DATA ROWS ══════════

    const byDate = groupByDate(db.pengeluaran);
    const dateKeys = Object.keys(byDate);
    const hasMultipleDates = dateKeys.length > 1;
    let globalIndex = 0;

    dateKeys.forEach((date, dateIdx) => {
        const entries = byDate[date];
        let dateSubtotal = 0;

        entries.forEach((item, idx) => {
            globalIndex++;
            dateSubtotal += item.nominal;

            const formattedTime = extractTime(item.waktu);

            const row = sheet.addRow([
                idx === 0 ? date : '',
                formattedTime,
                globalIndex,
                item.keterangan,
                item.nominal,
            ]);

            row.font = FONT.body;
            row.height = 22;
            row.getCell(1).alignment = { vertical: 'middle' };
            row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
            row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
            row.getCell(4).alignment = { vertical: 'middle', wrapText: true };
            row.getCell(5).numFmt = ACCT_FMT;
            row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };

            // Alternating row color
            const bgColor = globalIndex % 2 === 0 ? COLOR.bodyAlt : COLOR.bodyWhite;
            for (let i = 1; i <= COL_COUNT; i++) {
                row.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            }

            // Borders on every data cell
            applyRowBorders(row, COL_COUNT, BORDER_LIGHT, BORDER_LIGHT);
        });

        // ── Subtotal per date ──
        if (hasMultipleDates) {
            const subRow = sheet.addRow(['', '', '', `Subtotal — ${date}`, dateSubtotal]);
            subRow.font = FONT.subtotal;
            subRow.height = 24;
            subRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
            subRow.getCell(5).numFmt = ACCT_FMT;
            subRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };

            for (let i = 1; i <= COL_COUNT; i++) {
                const cell = subRow.getCell(i);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.subtotalBg } };
                applyBorder(cell, BORDER_MEDIUM, BORDER_MEDIUM, BORDER_LIGHT, BORDER_LIGHT);
            }
        }
    });

    // ══════════ GRAND TOTAL ══════════

    const grandTotal = db.pengeluaran.reduce((sum, e) => sum + e.nominal, 0);

    const totalRow = sheet.addRow(['', '', '', 'TOTAL PENGELUARAN', grandTotal]);
    totalRow.font = FONT.total;
    totalRow.height = 30;
    totalRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    totalRow.getCell(5).numFmt = ACCT_FMT;
    totalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };

    for (let i = 1; i <= COL_COUNT; i++) {
        const cell = totalRow.getCell(i);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.totalBg } };
        applyBorder(cell, BORDER_DARK, BORDER_DOUBLE_DARK, BORDER_LIGHT, BORDER_LIGHT);
    }

    // ══════════ SUMMARY ══════════

    const spacer1 = sheet.addRow([]);
    spacer1.height = 14;

    // Summary header
    const summaryHdr = sheet.addRow(['', '', '', 'RINGKASAN', '']);
    summaryHdr.font = { ...FONT.total, size: 10 };
    summaryHdr.height = 24;
    summaryHdr.getCell(4).alignment = { vertical: 'middle' };
    for (let i = 4; i <= 5; i++) {
        const cell = summaryHdr.getCell(i);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR.headerBg } };
        cell.font = { ...FONT.header, size: 10 };
        applyBorder(cell, BORDER_DARK, BORDER_DARK, BORDER_LIGHT, BORDER_LIGHT);
    }

    const summaryItems = [
        ['Jumlah Transaksi', db.pengeluaran.length],
        ['Total Pengeluaran', grandTotal],
        ['Rata-rata / Transaksi', Math.round(grandTotal / db.pengeluaran.length)],
        ['Jumlah Hari', dateKeys.length],
    ];

    summaryItems.forEach((data, idx) => {
        const row = sheet.addRow(['', '', '', data[0], data[1]]);
        row.height = 20;
        row.getCell(4).font = FONT.summaryLabel;
        row.getCell(4).alignment = { vertical: 'middle' };
        row.getCell(5).font = FONT.summaryValue;
        row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };

        if (idx === 1 || idx === 2) {
            row.getCell(5).numFmt = ACCT_FMT;
        }

        // Alternating colors for summary
        const bg = idx % 2 === 0 ? COLOR.bodyWhite : COLOR.bodyAlt;
        for (let i = 4; i <= 5; i++) {
            row.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
            applyBorder(row.getCell(i), BORDER_LIGHT, BORDER_LIGHT, BORDER_LIGHT, BORDER_LIGHT);
        }
    });

    // Bottom border on last summary row
    for (let i = 4; i <= 5; i++) {
        const lastRow = sheet.getRow(sheet.rowCount);
        applyBorder(lastRow.getCell(i), BORDER_LIGHT, BORDER_DARK, BORDER_LIGHT, BORDER_LIGHT);
    }

    // ══════════ FOOTER ══════════

    const spacer2 = sheet.addRow([]);
    spacer2.height = 16;

    sheet.mergeCells(`A${sheet.rowCount + 1}:E${sheet.rowCount + 1}`);
    const footerCell = sheet.getCell(`A${sheet.rowCount}`);
    footerCell.value = `Laporan dibuat otomatis oleh WhatsApp Assistant by Irza Fhahlefi — ${getExportDate()}, ${getExportTime()} WIB`;
    footerCell.font = FONT.footer;
    footerCell.alignment = { horizontal: 'center' };
    sheet.getRow(sheet.rowCount).height = 16;

    // ══════════ SAVE ══════════

    const fileName = `Laporan_Keuangan_${getTimestamp()}.xlsx`;
    const filePath = path.join(EXPORT_DIR, fileName);
    await workbook.xlsx.writeFile(filePath);
    return { filePath, fileName };
}

// =============================================
// FINANCE EXPORT — PDF (Corporate Style)
// =============================================

async function exportFinancePDF(db) {
    if (!db.pengeluaran || db.pengeluaran.length === 0) return null;

    return new Promise((resolve, reject) => {
        const fileName = `Laporan_Keuangan_${getTimestamp()}.pdf`;
        const filePath = path.join(EXPORT_DIR, fileName);
        const stream = fs.createWriteStream(filePath);

        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 40, bottom: 40, left: 40, right: 40 },
        });

        doc.pipe(stream);

        const pageWidth = doc.page.width - 80; // total usable width

        // Color helpers (hex without #)
        const navy = '#1A3C5E';
        const mediumBlue = '#2C5F8A';
        const darkGray = '#344054';
        const medGray = '#475467';
        const lightGray = '#98A2B3';
        const subtotalBg = '#F0F4F8';
        const totalBg = '#E8EEF4';
        const altRowBg = '#FAFBFC';
        const white = '#FFFFFF';
        const borderColor = '#D0D5DD';

        // ── Column definitions ──
        const colDefs = [
            { label: 'Tanggal', width: pageWidth * 0.18 },
            { label: 'Jam', width: pageWidth * 0.10 },
            { label: 'No', width: pageWidth * 0.06 },
            { label: 'Keterangan', width: pageWidth * 0.40 },
            { label: 'Jumlah (Rp)', width: pageWidth * 0.26 },
        ];

        const tableLeft = 40;
        const tableWidth = colDefs.reduce((s, c) => s + c.width, 0);

        /** Draw a filled rectangle */
        function drawRect(x, y, w, h, fillColor) {
            doc.save();
            doc.rect(x, y, w, h).fill(fillColor);
            doc.restore();
        }

        /** Draw horizontal line */
        function drawHLine(x, y, w, color, lineWidth) {
            doc.save();
            doc.moveTo(x, y).lineTo(x + w, y).strokeColor(color).lineWidth(lineWidth || 0.5).stroke();
            doc.restore();
        }

        /** Draw cell borders (all 4 sides) */
        function drawCellBorders(x, y, w, h, color) {
            doc.save();
            doc.rect(x, y, w, h).strokeColor(color).lineWidth(0.5).stroke();
            doc.restore();
        }

        /** Draw a table row with cell borders */
        function drawTableRow(y, values, options = {}) {
            const {
                fillColor = white,
                fontColor = darkGray,
                fontSize = 9,
                bold = false,
                alignments = ['left', 'center', 'center', 'left', 'right'],
                height = 22,
                borderCol = borderColor,
            } = options;

            // Fill background
            drawRect(tableLeft, y, tableWidth, height, fillColor);

            // Draw cell borders
            let x = tableLeft;
            colDefs.forEach((col, i) => {
                drawCellBorders(x, y, col.width, height, borderCol);

                // Text
                const padding = 6;
                const textX = alignments[i] === 'right' ? x + col.width - padding
                    : alignments[i] === 'center' ? x + col.width / 2
                        : x + padding;
                const textAlign = alignments[i];

                doc.save();
                doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
                    .fontSize(fontSize)
                    .fillColor(fontColor);

                const textOpts = { width: col.width - padding * 2, align: textAlign };
                const textY = y + (height - fontSize) / 2;

                if (textAlign === 'right') {
                    doc.text(String(values[i] || ''), x + padding, textY, textOpts);
                } else if (textAlign === 'center') {
                    doc.text(String(values[i] || ''), x + padding, textY, textOpts);
                } else {
                    doc.text(String(values[i] || ''), x + padding, textY, textOpts);
                }
                doc.restore();

                x += col.width;
            });

            return y + height;
        }

        // ══════════ TITLE ══════════

        doc.font('Helvetica-Bold').fontSize(18).fillColor(navy);
        doc.text('LAPORAN PENGELUARAN', tableLeft, 40, {
            width: tableWidth, align: 'center',
        });

        // Period
        const dates = db.pengeluaran.map(e => e.waktu.split(',')[0]?.trim()).filter(Boolean);
        const uniqueDates = [...new Set(dates)];
        let periodText = '';
        if (uniqueDates.length === 1) {
            periodText = `Periode: ${uniqueDates[0]}`;
        } else if (uniqueDates.length > 1) {
            periodText = `Periode: ${uniqueDates[0]} s/d ${uniqueDates[uniqueDates.length - 1]}`;
        }

        doc.font('Helvetica').fontSize(9).fillColor(lightGray);
        doc.text(periodText, tableLeft, 64, { width: tableWidth, align: 'center' });

        // Export timestamp
        doc.font('Helvetica').fontSize(8).fillColor(lightGray);
        doc.text(`Diekspor: ${getExportDate()}, ${getExportTime()} WIB`, tableLeft, 78, {
            width: tableWidth, align: 'center',
        });

        // ══════════ TABLE HEADER ══════════

        let currentY = 100;

        currentY = drawTableRow(currentY, colDefs.map(c => c.label), {
            fillColor: navy,
            fontColor: white,
            bold: true,
            fontSize: 9,
            height: 26,
            alignments: ['center', 'center', 'center', 'center', 'center'],
            borderCol: navy,
        });

        // ══════════ DATA ROWS ══════════

        const byDate = groupByDate(db.pengeluaran);
        const dateKeys = Object.keys(byDate);
        const hasMultipleDates = dateKeys.length > 1;
        let globalIndex = 0;
        const grandTotal = db.pengeluaran.reduce((sum, e) => sum + e.nominal, 0);

        dateKeys.forEach((date) => {
            const entries = byDate[date];
            let dateSubtotal = 0;

            entries.forEach((item, idx) => {
                globalIndex++;
                dateSubtotal += item.nominal;

                const formattedTime = extractTime(item.waktu);
                const bgColor = globalIndex % 2 === 0 ? altRowBg : white;

                // Check if we need a new page
                if (currentY > doc.page.height - 100) {
                    doc.addPage();
                    currentY = 40;
                }

                currentY = drawTableRow(currentY, [
                    idx === 0 ? date : '',
                    formattedTime,
                    globalIndex,
                    item.keterangan,
                    formatRupiah(item.nominal),
                ], {
                    fillColor: bgColor,
                    fontColor: darkGray,
                    height: 22,
                });
            });

            // Subtotal per date
            if (hasMultipleDates) {
                if (currentY > doc.page.height - 100) {
                    doc.addPage();
                    currentY = 40;
                }

                currentY = drawTableRow(currentY, [
                    '', '', '', `Subtotal — ${date}`, formatRupiah(dateSubtotal),
                ], {
                    fillColor: subtotalBg,
                    fontColor: navy,
                    bold: true,
                    fontSize: 9,
                    height: 24,
                    alignments: ['left', 'center', 'center', 'right', 'right'],
                    borderCol: '#98A2B3',
                });
            }
        });

        // ══════════ GRAND TOTAL ══════════

        if (currentY > doc.page.height - 120) {
            doc.addPage();
            currentY = 40;
        }

        currentY = drawTableRow(currentY, [
            '', '', '', 'TOTAL PENGELUARAN', formatRupiah(grandTotal),
        ], {
            fillColor: totalBg,
            fontColor: navy,
            bold: true,
            fontSize: 10,
            height: 28,
            alignments: ['left', 'center', 'center', 'right', 'right'],
            borderCol: navy,
        });

        // Extra bottom border (double line effect)
        drawHLine(tableLeft, currentY, tableWidth, navy, 1.5);

        // ══════════ SUMMARY ══════════

        currentY += 16;

        if (currentY > doc.page.height - 140) {
            doc.addPage();
            currentY = 40;
        }

        // Summary header
        const summaryLeft = tableLeft + colDefs[0].width + colDefs[1].width + colDefs[2].width;
        const summaryWidth = colDefs[3].width + colDefs[4].width;
        const summaryCol1 = colDefs[3].width;
        const summaryCol2 = colDefs[4].width;

        drawRect(summaryLeft, currentY, summaryWidth, 24, navy);
        drawCellBorders(summaryLeft, currentY, summaryWidth, 24, navy);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(white);
        doc.text('RINGKASAN', summaryLeft + 6, currentY + 7, { width: summaryWidth - 12, align: 'left' });
        currentY += 24;

        const summaryItems = [
            ['Jumlah Transaksi', String(db.pengeluaran.length)],
            ['Total Pengeluaran', formatRupiah(grandTotal)],
            ['Rata-rata / Transaksi', formatRupiah(Math.round(grandTotal / db.pengeluaran.length))],
            ['Jumlah Hari', String(dateKeys.length)],
        ];

        summaryItems.forEach((item, idx) => {
            const bg = idx % 2 === 0 ? white : altRowBg;
            const rowH = 20;

            drawRect(summaryLeft, currentY, summaryWidth, rowH, bg);
            drawCellBorders(summaryLeft, currentY, summaryCol1, rowH, borderColor);
            drawCellBorders(summaryLeft + summaryCol1, currentY, summaryCol2, rowH, borderColor);

            doc.font('Helvetica').fontSize(9).fillColor(medGray);
            doc.text(item[0], summaryLeft + 6, currentY + 5, { width: summaryCol1 - 12 });

            doc.font('Helvetica-Bold').fontSize(9).fillColor(navy);
            doc.text(item[1], summaryLeft + summaryCol1 + 6, currentY + 5, {
                width: summaryCol2 - 12, align: 'right',
            });

            currentY += rowH;
        });

        // Bottom border of summary
        drawHLine(summaryLeft, currentY, summaryWidth, navy, 1);

        // ══════════ FOOTER ══════════

        currentY += 20;

        if (currentY > doc.page.height - 40) {
            doc.addPage();
            currentY = 40;
        }

        doc.font('Helvetica').fontSize(7).fillColor(lightGray);
        doc.text(
            `Laporan dibuat otomatis oleh WhatsApp Assistant by Irza Fhahlefi — ${getExportDate()}, ${getExportTime()} WIB`,
            tableLeft, currentY, { width: tableWidth, align: 'center' }
        );

        // ══════════ FINALIZE ══════════

        doc.end();

        stream.on('finish', () => {
            resolve({ filePath, fileName });
        });
        stream.on('error', reject);
    });
}

// =============================================
// CLEANUP
// =============================================

function cleanupExports() {
    try {
        if (!fs.existsSync(EXPORT_DIR)) return;
        const files = fs.readdirSync(EXPORT_DIR);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        files.forEach(file => {
            const filePath = path.join(EXPORT_DIR, file);
            const stat = fs.statSync(filePath);
            if (stat.mtimeMs < oneHourAgo) fs.unlinkSync(filePath);
        });
    } catch (err) {
        console.error('[EXPORT] Gagal membersihkan file export lama:', err.message);
    }
}

module.exports = { exportTodoExcel, exportFinanceExcel, exportFinancePDF, cleanupExports };
