/**
 * Export commands — generate Excel files for todo and finance data.
 * Uses ExcelJS to create professionally formatted .xlsx files.
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const EXPORT_DIR = path.join(__dirname, '..', '..', 'exports');

if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

// --- Shared Helpers ---

const FONT = {
    title: { name: 'Calibri', size: 14, bold: true },
    subtitle: { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF7F8C8D' } },
    header: { name: 'Calibri', size: 10, bold: true },
    body: { name: 'Calibri', size: 10 },
    total: { name: 'Calibri', size: 10, bold: true },
    footer: { name: 'Calibri', size: 8, italic: true, color: { argb: 'FF999999' } },
};

const BORDER = {
    thin: { style: 'thin', color: { argb: 'FF000000' } },
    none: { style: 'none' },
};

const ACCT_FMT = '_("Rp"* #,##0_)';

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

// --- Todo Export ---

async function exportTodoExcel(db) {
    if (!db.todo || db.todo.length === 0) return null;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WhatsApp Assistant Bot';
    const sheet = workbook.addWorksheet('Todo List');

    // Column widths
    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 50;
    sheet.getColumn(3).width = 16;

    // Title
    sheet.mergeCells('A1:C1');
    const title = sheet.getCell('A1');
    title.value = 'DAFTAR TUGAS';
    title.font = FONT.title;
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Subtitle
    sheet.mergeCells('A2:C2');
    const sub = sheet.getCell('A2');
    sub.value = `Diekspor: ${getExportDate()}, ${getExportTime()} WIB`;
    sub.font = FONT.subtitle;
    sub.alignment = { horizontal: 'center' };
    sheet.getRow(2).height = 18;

    // Spacer
    sheet.getRow(3).height = 6;

    // Header
    const hdr = sheet.addRow(['No', 'Tugas', 'Status']);
    hdr.font = FONT.header;
    hdr.height = 24;
    hdr.alignment = { vertical: 'middle' };
    for (let i = 1; i <= 3; i++) {
        hdr.getCell(i).border = {
            top: BORDER.thin, bottom: BORDER.thin,
            left: BORDER.none, right: BORDER.none,
        };
    }

    // Data
    db.todo.forEach((task, idx) => {
        const row = sheet.addRow([idx + 1, task, 'Belum Selesai']);
        row.font = FONT.body;
        row.height = 20;
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        if (idx === db.todo.length - 1) {
            for (let i = 1; i <= 3; i++) {
                row.getCell(i).border = { bottom: BORDER.thin };
            }
        }
    });

    // Total
    const totalRow = sheet.addRow(['', `Total: ${db.todo.length} tugas`, '']);
    totalRow.font = FONT.total;
    totalRow.height = 22;

    const fileName = `Todo_List_${getTimestamp()}.xlsx`;
    const filePath = path.join(EXPORT_DIR, fileName);
    await workbook.xlsx.writeFile(filePath);
    return { filePath, fileName };
}

// --- Finance Export (Accounting Style) ---

async function exportFinanceExcel(db) {
    if (!db.pengeluaran || db.pengeluaran.length === 0) return null;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WhatsApp Assistant Bot';
    const sheet = workbook.addWorksheet('Laporan Keuangan', {
        pageSetup: { paperSize: 9, orientation: 'portrait' },
    });

    // Column widths (accounting layout: Tanggal | Jam | No | Keterangan | Jumlah)
    sheet.getColumn(1).width = 18;  // Tanggal
    sheet.getColumn(2).width = 10;  // Jam
    sheet.getColumn(3).width = 6;   // No
    sheet.getColumn(4).width = 36;  // Keterangan
    sheet.getColumn(5).width = 20;  // Jumlah

    const COL_COUNT = 5;

    // ========== HEADER ==========
    // Row 1: Report title
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'LAPORAN PENGELUARAN';
    titleCell.font = { ...FONT.title, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 35;

    // Row 2: Period
    sheet.mergeCells('A2:E2');
    const periodCell = sheet.getCell('A2');
    // Find date range
    const dates = db.pengeluaran.map(e => e.waktu.split(',')[0]?.trim()).filter(Boolean);
    const uniqueDates = [...new Set(dates)];
    let periodText = '';
    if (uniqueDates.length === 1) {
        periodText = `Periode: ${uniqueDates[0]}`;
    } else if (uniqueDates.length > 1) {
        periodText = `Periode: ${uniqueDates[0]} s/d ${uniqueDates[uniqueDates.length - 1]}`;
    }
    periodCell.value = periodText;
    periodCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF555555' } };
    periodCell.alignment = { horizontal: 'center' };
    sheet.getRow(2).height = 20;

    // Row 3: Spacer
    sheet.getRow(3).height = 10;

    // ========== TABLE HEADER ==========
    const headerRow = sheet.addRow(['Tanggal', 'Jam', 'No', 'Keterangan', 'Jumlah']);
    headerRow.font = FONT.header;
    headerRow.height = 26;
    headerRow.alignment = { vertical: 'middle' };
    // Double top border + single bottom border (accounting style)
    for (let i = 1; i <= COL_COUNT; i++) {
        headerRow.getCell(i).border = {
            top: { style: 'double', color: { argb: 'FF000000' } },
            bottom: BORDER.thin,
            left: BORDER.none,
            right: BORDER.none,
        };
        headerRow.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // ========== DATA ROWS ==========
    // Group entries by date for subtotals
    const byDate = {};
    db.pengeluaran.forEach(item => {
        const date = item.waktu.split(',')[0]?.trim() || 'Tidak diketahui';
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(item);
    });

    let globalIndex = 0;

    Object.entries(byDate).forEach(([date, entries], dateIdx) => {
        let dateSubtotal = 0;

        entries.forEach((item, idx) => {
            globalIndex++;
            dateSubtotal += item.nominal;

            // Extract and format time (e.g. from '02.07.05' to '02:07')
            const timePart = item.waktu.split(',')[1]?.trim() || '';
            let formattedTime = '';
            if (timePart) {
                formattedTime = timePart.split('.').slice(0, 2).join(':');
            }

            const row = sheet.addRow([
                idx === 0 ? date : '',
                formattedTime,
                globalIndex,
                item.keterangan,
                item.nominal,
            ]);

            row.font = FONT.body;
            row.height = 20;
            row.getCell(5).numFmt = ACCT_FMT;
            row.getCell(1).alignment = { vertical: 'middle' };
            row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }; // Jam
            row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }; // No
            row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };  // Jumlah
        });

        // Subtotal per date (if more than 1 date group)
        if (Object.keys(byDate).length > 1) {
            const subRow = sheet.addRow(['', '', '', `Subtotal ${date}`, dateSubtotal]);
            subRow.font = { ...FONT.body, italic: true, color: { argb: 'FF666666' } };
            subRow.height = 20;
            subRow.getCell(5).numFmt = ACCT_FMT;
            subRow.getCell(5).alignment = { horizontal: 'right' };
            // Thin top border on subtotal row
            for (let i = 1; i <= COL_COUNT; i++) {
                subRow.getCell(i).border = {
                    top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                };
            }
        }
    });

    // ========== TOTAL ROW ==========
    const grandTotal = db.pengeluaran.reduce((sum, e) => sum + e.nominal, 0);

    const totalRow = sheet.addRow(['', '', '', 'TOTAL', grandTotal]);
    totalRow.font = { ...FONT.total, size: 11 };
    totalRow.height = 28;
    totalRow.getCell(5).numFmt = ACCT_FMT;
    totalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    // Double bottom border (accounting style for totals)
    for (let i = 1; i <= COL_COUNT; i++) {
        totalRow.getCell(i).border = {
            top: BORDER.thin,
            bottom: { style: 'double', color: { argb: 'FF000000' } },
            left: BORDER.none,
            right: BORDER.none,
        };
    }

    // ========== SUMMARY ==========
    const spacer1 = sheet.addRow([]);
    spacer1.height = 12;

    const summaryHeader = sheet.addRow(['', '', '', 'Ringkasan', '']);
    summaryHeader.font = { ...FONT.header, size: 11 };
    summaryHeader.height = 24;

    const summaryItems = [
        ['', '', 'Jumlah Transaksi', db.pengeluaran.length],
        ['', '', 'Total Pengeluaran', grandTotal],
        ['', '', 'Rata-rata per Transaksi', Math.round(grandTotal / db.pengeluaran.length)],
        ['', '', 'Jumlah Hari', Object.keys(byDate).length],
    ];

    summaryItems.forEach((data, idx) => {
        const row = sheet.addRow(data);
        row.font = FONT.body;
        row.height = 18;
        if (idx === 1 || idx === 2) {
            row.getCell(4).numFmt = ACCT_FMT;
        }
    });

    // ========== FOOTER ==========
    const spacer2 = sheet.addRow([]);
    spacer2.height = 20;

    sheet.mergeCells(`A${sheet.rowCount + 1}:D${sheet.rowCount + 1}`);
    const footerRow = sheet.getRow(sheet.rowCount);
    footerRow.height = 16;
    const footerCell = sheet.getCell(`A${sheet.rowCount}`);
    footerCell.value = `Laporan dibuat otomatis oleh WhatsApp Assistant by Irza Fhahlefi — ${getExportDate()}, ${getExportTime()} WIB`;
    footerCell.font = FONT.footer;
    footerCell.alignment = { horizontal: 'center' };

    // ========== SAVE ==========
    const fileName = `Laporan_Keuangan_${getTimestamp()}.xlsx`;
    const filePath = path.join(EXPORT_DIR, fileName);
    await workbook.xlsx.writeFile(filePath);
    return { filePath, fileName };
}

// --- Cleanup ---

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

module.exports = { exportTodoExcel, exportFinanceExcel, cleanupExports };
