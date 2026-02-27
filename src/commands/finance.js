/**
 * Finance / Expense Tracker commands: catat, total, hapus, edit, batas
 * With "girlfriend mode" — gentle, caring reminders about spending.
 */

const { saveDB } = require('../database');

// =============================================
// HELPERS
// =============================================

/**
 * Format number to Indonesian Rupiah string.
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
 * Pick a random item from an array.
 */
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get today's date string in Indonesian locale.
 */
function getTodayStr() {
    return new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
}

/**
 * Calculate today's total spending.
 */
function getTodayTotal(db) {
    const todayStr = getTodayStr();
    return db.pengeluaran
        .filter(item => {
            const itemDate = item.waktu.split(',')[0]?.trim() || item.waktu.split(' ')[0];
            return itemDate === todayStr;
        })
        .reduce((sum, item) => sum + item.nominal, 0);
}

/**
 * Get today's expenses.
 */
function getTodayExpenses(db) {
    const todayStr = getTodayStr();
    return db.pengeluaran.filter(item => {
        const itemDate = item.waktu.split(',')[0]?.trim() || item.waktu.split(' ')[0];
        return itemDate === todayStr;
    });
}

// =============================================
// GIRLFRIEND-STYLE MESSAGES 💕
// =============================================

/** Greeting saat catat pengeluaran (normal, di bawah batas) */
const MSG_CATAT_OK = [
    'Oke sayangku, udah aku catet ya~ 💕',
    'Siapp, udah tercatat! Kamu emang rajin nyatet ya 🥰',
    'Udah aku simpen ya, sayang ✨',
    'Catet! Kamu makin rapi nih ngatur keuangan 💕',
    'Tercatat~ semangat terus ya sayangku! 🌸',
    'Oke ay, noted! 📝💕',
    'Udah masuk ya sayang, good job! ✨',
];

/** Saat pengeluaran hari ini mendekati batas (75%-100%) */
const MSG_CATAT_WARN = [
    'Hmm sayang, pengeluaran hari ini udah lumayan banyak lho... hati-hati ya 🥺💕',
    'Beb, aku perhatiin pengeluaran kamu hari ini udah hampir mentok nih... pelan-pelan ya 🥺',
    'Sayang, boleh aku ingetin? pengeluaran hari ini udah hampir limit lho~ sisain buat jaga-jaga ya 💕',
    'Hmm, udah tercatat sih sayang... tapi aku agak khawatir, pengeluaran kamu hari ini udah banyak 🥺✨',
    'Aku catet ya, tapi... pelan-pelan belanjanya sayang, udah hampir batas nih 🌸',
];

/** Saat pengeluaran hari ini sudah melewati batas */
const MSG_CATAT_OVER = [
    'Sayang... aku udah catet, tapi pengeluaran kamu hari ini udah *lewat batas* lho 🥺 Aku ga marah, cuma khawatir aja... besok hemat lagi ya? 💕',
    'Beb... ini udah *over budget* hari ini 😢 Aku tau kadang emang perlu, tapi besok kita hemat bareng ya? aku temenin 💕',
    'Hmm sayang, ini udah *melewati batas harian* lho... ga papa, tapi yuk besok kita lebih hati-hati ya 🥺💕',
    'Tercatat... tapi sayang, *batas hariannya udah kelewat* nih 🥺 Aku sayangnya kamu jadi pengen kamu lebih hemat, buat masa depan kita~ 💕',
    'Aku catet ya... tapi ay, hari ini *udah over limit* 😢 Ga papa sekali-kali, tapi jangan keseringan ya sayang~ 🌸',
];

/** Pesan untuk total/rekap */
const MSG_TOTAL_GOOD = [
    'Ini rekap pengeluaranmu sayang~ kamu hebat ngatur uangnya! 💕',
    'Aku udah rangkumin buat kamu, sayang ✨ Keuanganmu masih aman nih~',
    'Ini rekapnya ya ay~ pengeluaranmu masih oke, aku bangga sama kamu 🥰',
];

const MSG_TOTAL_WARN = [
    'Ini rekapnya sayang... pengeluaran hari ini udah lumayan banyak, hati-hati ya 🥺💕',
    'Aku rangkumin ya ay~ tapi aku perhatiin hari ini agak boros lho... pelan-pelan ya 🌸',
];

const MSG_TOTAL_OVER = [
    'Sayang... ini rekapnya. Hari ini udah *melebihi batas* 🥺 Besok kita hemat bareng ya? 💕',
    'Ini rekapnya ay... aku perhatiin *udah lewat batas harian* nih 😢 Tapi ga papa, besok kita improve bareng ya~ 💕',
];

/** Pesan kosong */
const MSG_EMPTY = [
    'Belum ada pengeluaran yang dicatat sayang~ Rajin banget sih belum belanja 🥰',
    'Belum ada catatan nih ay, kamu hemat banget ya hari ini 💕',
    'Masih kosong sayang~ gunakan *catat [nominal] [keterangan]* ya kalau ada pengeluaran 🌸',
];

/** Pesan hapus */
const MSG_HAPUS = [
    'Udah aku hapus ya sayang~ 💕',
    'Done, udah dihapus ay! ✨',
    'Oke sayang, yang ini udah aku buang dari catatan ya 🌸',
];

/** Pesan edit */
const MSG_EDIT = [
    'Udah aku perbaiki ya sayang~ 💕',
    'Done ay, udah di-update! ✨',
    'Oke sayang, catatannya udah aku ganti ya 🌸',
];

/** Pesan batas diset */
const MSG_BATAS_SET = [
    'Oke sayang, batas harian kamu aku set ya~ aku bakal jagain kamu biar ga boros 💕',
    'Siap ay! Aku bakal ingetin kamu kalau udah mendekati batas ya 🥰',
    'Tercatat~ tenang, aku bakal selalu perhatiin pengeluaranmu sayang 🌸',
];

/** Pesan batas dihapus */
const MSG_BATAS_OFF = [
    'Oke sayang, batas hariannya aku matikan ya~ tapi tetap hemat lho! 💕',
    'Baik ay, aku ga batasi lagi deh. Tapi tetap bijak ya belanjanya 🌸',
];

// Default daily limit (100,000 IDR), user can override
const DEFAULT_LIMIT = 100000;

// =============================================
// SPENDING STATUS HELPER
// =============================================

/**
 * Get spending status relative to daily limit.
 * @returns {'ok'|'warn'|'over'}
 */
function getSpendingStatus(db) {
    const limit = db.batasHarian;
    if (!limit || limit <= 0) return 'ok';

    const todayTotal = getTodayTotal(db);
    const ratio = todayTotal / limit;

    if (ratio >= 1) return 'over';
    if (ratio >= 0.75) return 'warn';
    return 'ok';
}

/**
 * Build spending meter/bar for visual display.
 */
function buildSpendingMeter(db) {
    const limit = db.batasHarian;
    if (!limit || limit <= 0) return '';

    const todayTotal = getTodayTotal(db);
    const ratio = Math.min(todayTotal / limit, 1.5);
    const pct = Math.round(ratio * 100);

    const filled = Math.min(Math.round(ratio * 10), 10);
    const empty = 10 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);

    let emoji = '🟢';
    if (ratio >= 1) emoji = '🔴';
    else if (ratio >= 0.75) emoji = '🟡';

    return `\n${emoji} ${bar} ${pct}% dari batas ${formatRupiah(limit)}`;
}

// =============================================
// COMMAND HANDLERS
// =============================================

/**
 * Handle "batas [nominal]" — set daily spending limit.
 * "batas off" or "batas 0" to disable.
 */
function handleBatas(db, args) {
    if (!args || args.trim().length === 0) {
        const current = db.batasHarian;
        if (!current || current <= 0) {
            return `Batas harian belum diset sayang~\nGunakan: *batas [nominal]*\nContoh: batas 100000 💕`;
        }
        const todayTotal = getTodayTotal(db);
        return `*Batas Harian Kamu* 💕\n\nBatas   : ${formatRupiah(current)}\nHari ini: ${formatRupiah(todayTotal)}\nSisa    : ${formatRupiah(Math.max(0, current - todayTotal))}${buildSpendingMeter(db)}\n\nKetik *batas [nominal]* untuk ubah.\nKetik *batas off* untuk matikan.`;
    }

    const trimmed = args.trim().toLowerCase();

    if (trimmed === 'off' || trimmed === '0') {
        db.batasHarian = 0;
        saveDB();
        return `${pick(MSG_BATAS_OFF)}\n\n_Batas harian dinonaktifkan._`;
    }

    const nominal = parseInt(trimmed, 10);

    if (isNaN(nominal) || nominal < 0) {
        return 'Nominal harus berupa angka positif sayang~\nContoh: batas 100000 💕';
    }

    db.batasHarian = nominal;
    saveDB();

    return `${pick(MSG_BATAS_SET)}\n\n*Batas Harian:* ${formatRupiah(nominal)}\n_Aku bakal kasih tau kalau pengeluaranmu mendekati atau melewati batas ini ya~ 💕_`;
}

/**
 * Handle "catat [nominal] [keterangan]" command.
 * With girlfriend-style response and spending limit check.
 */
function handleCatat(db, args) {
    if (!args || args.trim().length === 0) {
        return 'Sayang, formatnya gini ya~\nContoh: *catat 25000 makan siang* 💕';
    }

    const parts = args.trim().split(/\s+/);
    const nominalStr = parts[0];
    const keterangan = parts.slice(1).join(' ');

    const nominal = parseInt(nominalStr, 10);

    if (isNaN(nominal) || nominal <= 0) {
        return 'Hmm, nominalnya harus angka positif ya sayang~\nContoh: *catat 25000 makan siang* 💕';
    }

    if (!keterangan || keterangan.trim().length === 0) {
        return 'Keterangannya jangan kosong dong sayang~\nContoh: *catat 25000 makan siang* 💕';
    }

    const entry = {
        nominal,
        keterangan: keterangan.trim(),
        waktu: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    };

    db.pengeluaran.push(entry);
    saveDB();

    // Check spending status
    const status = getSpendingStatus(db);
    let greeting;
    if (status === 'over') {
        greeting = pick(MSG_CATAT_OVER);
    } else if (status === 'warn') {
        greeting = pick(MSG_CATAT_WARN);
    } else {
        greeting = pick(MSG_CATAT_OK);
    }

    let response = `${greeting}\n\n`;
    response += `📝 *${entry.keterangan}*\n`;
    response += `💰 ${formatRupiah(nominal)}\n`;
    response += `🕐 ${entry.waktu}`;

    // Show spending meter if limit is set
    response += buildSpendingMeter(db);

    return response;
}

/**
 * Handle "total" command — summarize today's expenses.
 * With girlfriend-style commentary.
 */
function handleTotal(db) {
    if (!db.pengeluaran || db.pengeluaran.length === 0) {
        return pick(MSG_EMPTY) + '\n\nGunakan: *catat [nominal] [keterangan]* 💕';
    }

    const todayExpenses = getTodayExpenses(db);
    const totalAll = db.pengeluaran.reduce((sum, item) => sum + item.nominal, 0);
    const totalToday = todayExpenses.reduce((sum, item) => sum + item.nominal, 0);

    // Pick greeting based on spending status
    const status = getSpendingStatus(db);
    let greeting;
    if (status === 'over') {
        greeting = pick(MSG_TOTAL_OVER);
    } else if (status === 'warn') {
        greeting = pick(MSG_TOTAL_WARN);
    } else {
        greeting = pick(MSG_TOTAL_GOOD);
    }

    let response = `${greeting}\n\n`;
    response += `*📊 Rekap Pengeluaran*\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Today's expenses
    if (todayExpenses.length > 0) {
        response += `*Hari Ini:*\n`;
        todayExpenses.forEach((item, i) => {
            response += `  ${i + 1}. ${item.keterangan} — ${formatRupiah(item.nominal)}\n`;
        });
        response += `\n💰 *Total Hari Ini:* ${formatRupiah(totalToday)}\n`;
    } else {
        response += `Belum ada pengeluaran hari ini~ 🌸\n`;
    }

    // Spending meter
    response += buildSpendingMeter(db);

    response += `\n\n━━━━━━━━━━━━━━━━━━━━━━`;
    response += `\n💵 Total Keseluruhan : ${formatRupiah(totalAll)}`;
    response += `\n📋 Jumlah Transaksi  : ${db.pengeluaran.length}`;

    // Show limit info
    const limit = db.batasHarian;
    if (limit && limit > 0) {
        const sisa = Math.max(0, limit - totalToday);
        response += `\n🎯 Batas Harian      : ${formatRupiah(limit)}`;
        response += `\n✨ Sisa Hari Ini     : ${formatRupiah(sisa)}`;
    }

    response += `\n\n_Ketik *hapus [no]* / *edit [no]* / *export keuangan*_`;

    return response;
}

/**
 * Handle "hapus [nomor]" command — remove a single expense.
 */
function handleHapusPengeluaran(db, indexStr) {
    if (!db.pengeluaran || db.pengeluaran.length === 0) {
        return pick(MSG_EMPTY) + '\n\nGunakan: *catat [nominal] [keterangan]* 💕';
    }

    if (!indexStr || indexStr.trim().length === 0) {
        return 'Nomor berapa yang mau dihapus sayang?\nContoh: *hapus 1* 💕';
    }

    const index = parseInt(indexStr.trim(), 10);

    if (isNaN(index)) {
        return 'Hmm, nomornya harus angka ya sayang~\nContoh: *hapus 1* 💕';
    }

    if (index < 1 || index > db.pengeluaran.length) {
        return `Nomor ${index} ga ada sayang~ yang tersedia: 1 - ${db.pengeluaran.length} 💕`;
    }

    const removed = db.pengeluaran.splice(index - 1, 1)[0];
    saveDB();

    return `${pick(MSG_HAPUS)}\n\n🗑️ *${removed.keterangan}*\n💰 ${formatRupiah(removed.nominal)}\n🕐 ${removed.waktu}\n\n_Sisa transaksi: ${db.pengeluaran.length}_`;
}

/**
 * Handle "edit [nomor] [nominal] [keterangan]" command.
 */
function handleEditPengeluaran(db, args) {
    if (!db.pengeluaran || db.pengeluaran.length === 0) {
        return pick(MSG_EMPTY) + '\n\nGunakan: *catat [nominal] [keterangan]* 💕';
    }

    if (!args || args.trim().length === 0) {
        return 'Mau edit yang mana sayang?\nContoh:\n  *edit 1 30000 makan malam*\n  *edit 1 30000*\n  *edit 1 - makan malam* 💕';
    }

    const parts = args.trim().split(/\s+/);
    const index = parseInt(parts[0], 10);

    if (isNaN(index)) {
        return 'Nomornya harus angka ya sayang~\nContoh: *edit 1 30000 makan malam* 💕';
    }

    if (index < 1 || index > db.pengeluaran.length) {
        return `Nomor ${index} ga ada sayang~ yang tersedia: 1 - ${db.pengeluaran.length} 💕`;
    }

    if (parts.length < 2) {
        return 'Mau diubah jadi apa sayang?\nContoh:\n  *edit 1 30000 makan malam*\n  *edit 1 - makan malam* 💕';
    }

    const entry = db.pengeluaran[index - 1];
    const oldNominal = entry.nominal;
    const oldKeterangan = entry.keterangan;

    let newNominal = null;
    let newKeterangan = null;

    if (parts[1] === '-') {
        newKeterangan = parts.slice(2).join(' ').trim();
        if (!newKeterangan || newKeterangan.length === 0) {
            return 'Keterangan barunya apa sayang?\nContoh: *edit 1 - makan malam* 💕';
        }
    } else {
        newNominal = parseInt(parts[1], 10);
        if (isNaN(newNominal) || newNominal <= 0) {
            return 'Nominalnya harus angka positif ya sayang~\nContoh: *edit 1 30000 makan malam* 💕';
        }
        if (parts.length > 2) {
            newKeterangan = parts.slice(2).join(' ').trim();
        }
    }

    if (newNominal !== null) entry.nominal = newNominal;
    if (newKeterangan !== null && newKeterangan.length > 0) entry.keterangan = newKeterangan;

    saveDB();

    let changes = '';
    if (newNominal !== null) {
        changes += `💰 ${formatRupiah(oldNominal)} → ${formatRupiah(newNominal)}\n`;
    }
    if (newKeterangan !== null && newKeterangan.length > 0) {
        changes += `📝 ${oldKeterangan} → ${newKeterangan}\n`;
    }

    return `${pick(MSG_EDIT)}\n\n*No. ${index}*\n${changes}🕐 ${entry.waktu}`;
}

/**
 * Handle "reset keuangan" command — clear all expense records.
 */
function handleResetKeuangan(db) {
    const count = db.pengeluaran.length;

    if (count === 0) {
        return 'Ga ada data yang perlu direset kok sayang~ 💕';
    }

    const totalAll = db.pengeluaran.reduce((sum, item) => sum + item.nominal, 0);

    db.pengeluaran = [];
    saveDB();

    return `*Data Keuangan Direset* 🗑️\n\n${count} transaksi (${formatRupiah(totalAll)}) udah dihapus ya sayang~\nSekarang bersih, kita mulai dari awal lagi ya! 💕`;
}

module.exports = {
    handleCatat,
    handleTotal,
    handleHapusPengeluaran,
    handleEditPengeluaran,
    handleResetKeuangan,
    handleBatas,
};
