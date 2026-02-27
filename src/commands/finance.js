/**
 * Finance / Expense Tracker commands: catat, total
 */

const { saveDB } = require('../database');

/**
 * Format number to Indonesian Rupiah string (with Rp prefix).
 * Used for chat responses only. Excel uses its own numFmt.
 * @param {number} num
 * @returns {string}
 */
function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(num);
}

/**
 * Handle "catat [nominal] [keterangan]" command.
 * @param {object} db - Database object
 * @param {string} args - Raw arguments after "catat"
 * @returns {string}
 */
function handleCatat(db, args) {
    if (!args || args.trim().length === 0) {
        return 'Format salah.\nContoh: catat 25000 makan siang';
    }

    const parts = args.trim().split(/\s+/);
    const nominalStr = parts[0];
    const keterangan = parts.slice(1).join(' ');

    const nominal = parseInt(nominalStr, 10);

    if (isNaN(nominal) || nominal <= 0) {
        return 'Nominal harus berupa angka positif.\nContoh: catat 25000 makan siang';
    }

    if (!keterangan || keterangan.trim().length === 0) {
        return 'Keterangan tidak boleh kosong.\nContoh: catat 25000 makan siang';
    }

    const entry = {
        nominal,
        keterangan: keterangan.trim(),
        waktu: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    };

    db.pengeluaran.push(entry);
    saveDB();

    return `*Pengeluaran Dicatat*\n\nItem    : ${entry.keterangan}\nNominal : ${formatRupiah(nominal)}\nWaktu   : ${entry.waktu}`;
}

/**
 * Handle "total" command — summarize today's expenses.
 * @param {object} db - Database object
 * @returns {string}
 */
function handleTotal(db) {
    if (!db.pengeluaran || db.pengeluaran.length === 0) {
        return '*Rekap Pengeluaran*\n\nBelum ada pengeluaran yang dicatat.\nGunakan: catat [nominal] [keterangan]';
    }

    // Get today's date string in Indonesian locale
    const todayStr = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });

    // Filter today's expenses
    const todayExpenses = db.pengeluaran.filter((item) => {
        const itemDate = item.waktu.split(',')[0]?.trim() || item.waktu.split(' ')[0];
        return itemDate === todayStr;
    });

    // Calculate totals
    const totalAll = db.pengeluaran.reduce((sum, item) => sum + item.nominal, 0);
    const totalToday = todayExpenses.reduce((sum, item) => sum + item.nominal, 0);

    let response = `*Rekap Pengeluaran*\n----------------------------\n\n`;

    // Show today's expenses
    if (todayExpenses.length > 0) {
        response += `Hari Ini:\n`;
        todayExpenses.forEach((item, i) => {
            response += `  ${i + 1}. ${item.keterangan} — ${formatRupiah(item.nominal)}\n`;
        });
        response += `\nTotal Hari Ini : ${formatRupiah(totalToday)}\n`;
    } else {
        response += `Belum ada pengeluaran hari ini.\n`;
    }

    response += `\n----------------------------`;
    response += `\nTotal Keseluruhan : ${formatRupiah(totalAll)}`;
    response += `\nJumlah Transaksi  : ${db.pengeluaran.length}`;
    response += `\n\nKetik "hapus [nomor]" untuk hapus satu item.`;
    response += `\nKetik "edit [nomor] [nominal] [ket]" untuk edit item.`;
    response += `\nKetik "export keuangan" untuk unduh file Excel.`;

    return response;
}

/**
 * Handle "hapus [nomor]" command — remove a single expense by number.
 * @param {object} db - Database object
 * @param {string} indexStr - The 1-based index string
 * @returns {string}
 */
function handleHapusPengeluaran(db, indexStr) {
    if (!db.pengeluaran || db.pengeluaran.length === 0) {
        return 'Belum ada pengeluaran yang dicatat.\nGunakan: catat [nominal] [keterangan]';
    }

    if (!indexStr || indexStr.trim().length === 0) {
        return 'Masukkan nomor pengeluaran yang ingin dihapus.\nContoh: hapus 1';
    }

    const index = parseInt(indexStr.trim(), 10);

    if (isNaN(index)) {
        return 'Nomor pengeluaran harus berupa angka.\nContoh: hapus 1';
    }

    if (index < 1 || index > db.pengeluaran.length) {
        return `Nomor pengeluaran tidak valid.\nData yang tersedia: 1 - ${db.pengeluaran.length}`;
    }

    const removed = db.pengeluaran.splice(index - 1, 1)[0];
    saveDB();

    return `*Pengeluaran Dihapus*\n\nItem    : ${removed.keterangan}\nNominal : ${formatRupiah(removed.nominal)}\nWaktu   : ${removed.waktu}\n\nSisa transaksi: ${db.pengeluaran.length}`;
}

/**
 * Handle "edit [nomor] [nominal baru] [keterangan baru]" command.
 * Allows editing the nominal and/or description of an existing expense.
 *
 * Formats:
 *   edit 1 30000 makan malam   — edit nominal & keterangan
 *   edit 1 30000               — edit nominal saja
 *   edit 1 - makan malam       — edit keterangan saja (gunakan "-" untuk skip nominal)
 *
 * @param {object} db - Database object
 * @param {string} args - Raw arguments after "edit"
 * @returns {string}
 */
function handleEditPengeluaran(db, args) {
    if (!db.pengeluaran || db.pengeluaran.length === 0) {
        return 'Belum ada pengeluaran yang dicatat.\nGunakan: catat [nominal] [keterangan]';
    }

    if (!args || args.trim().length === 0) {
        return 'Format salah.\nContoh:\n  edit 1 30000 makan malam\n  edit 1 30000\n  edit 1 - makan malam';
    }

    const parts = args.trim().split(/\s+/);

    // First part must be the index
    const index = parseInt(parts[0], 10);

    if (isNaN(index)) {
        return 'Nomor pengeluaran harus berupa angka.\nContoh: edit 1 30000 makan malam';
    }

    if (index < 1 || index > db.pengeluaran.length) {
        return `Nomor pengeluaran tidak valid.\nData yang tersedia: 1 - ${db.pengeluaran.length}`;
    }

    if (parts.length < 2) {
        return 'Format salah.\nContoh:\n  edit 1 30000 makan malam\n  edit 1 30000\n  edit 1 - makan malam';
    }

    const entry = db.pengeluaran[index - 1];
    const oldNominal = entry.nominal;
    const oldKeterangan = entry.keterangan;

    let newNominal = null;
    let newKeterangan = null;

    if (parts[1] === '-') {
        // Skip nominal, edit keterangan only
        newKeterangan = parts.slice(2).join(' ').trim();
        if (!newKeterangan || newKeterangan.length === 0) {
            return 'Keterangan baru tidak boleh kosong.\nContoh: edit 1 - makan malam';
        }
    } else {
        // Parse nominal
        newNominal = parseInt(parts[1], 10);
        if (isNaN(newNominal) || newNominal <= 0) {
            return 'Nominal harus berupa angka positif.\nContoh: edit 1 30000 makan malam';
        }
        // Check if there's also a new keterangan
        if (parts.length > 2) {
            newKeterangan = parts.slice(2).join(' ').trim();
        }
    }

    // Apply changes
    if (newNominal !== null) {
        entry.nominal = newNominal;
    }
    if (newKeterangan !== null && newKeterangan.length > 0) {
        entry.keterangan = newKeterangan;
    }

    saveDB();

    // Build response showing what changed
    let changes = '';
    if (newNominal !== null) {
        changes += `Nominal : ${formatRupiah(oldNominal)} → ${formatRupiah(newNominal)}\n`;
    }
    if (newKeterangan !== null && newKeterangan.length > 0) {
        changes += `Item    : ${oldKeterangan} → ${newKeterangan}\n`;
    }

    return `*Pengeluaran Diperbarui*\n\nNo. ${index}\n${changes}Waktu   : ${entry.waktu}`;
}

/**
 * Handle "reset keuangan" command — clear all expense records.
 * @param {object} db - Database object
 * @returns {string}
 */
function handleResetKeuangan(db) {
    const count = db.pengeluaran.length;

    if (count === 0) {
        return 'Tidak ada data pengeluaran untuk direset.';
    }

    const totalAll = db.pengeluaran.reduce((sum, item) => sum + item.nominal, 0);

    db.pengeluaran = [];
    saveDB();

    return `*Data Keuangan Direset*\n\n${count} transaksi (${formatRupiah(totalAll)}) telah dihapus.\nData pengeluaran sekarang kosong.`;
}

module.exports = { handleCatat, handleTotal, handleHapusPengeluaran, handleEditPengeluaran, handleResetKeuangan };
