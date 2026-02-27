/**
 * WhatsApp Daily Assistant Bot
 * Main entry point — handles connection, authentication, and message routing.
 *
 * Uses @whiskeysockets/baileys with Multi File Auth State.
 * Supports multi-user: each sender has isolated data.
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');

// Database
const { loadDB, getUserData, getUserCount } = require('./database');

// Commands
const { handleHalo, handleJam } = require('./commands/general');
const { handleMenu } = require('./commands/menu');
const { handleTodoList, handleTodoAdd, handleTodoDone, handleResetTodo } = require('./commands/todo');
const { handleCatat, handleTotal, handleHapusPengeluaran, handleEditPengeluaran, handleResetKeuangan } = require('./commands/finance');
const { exportTodoExcel, exportFinanceExcel, exportFinancePDF, cleanupExports } = require('./commands/export');
const { handleCurhat, handleFallback } = require('./commands/curhat');
const { chatWithAI, isAIAvailable } = require('./ai');
const { startAdmin } = require('./admin');

// --- Config ---
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');
const AUTH_DIR = path.join(DATA_DIR, 'auth_info');
const logger = pino({ level: 'silent' });

// --- Start Banner ---
console.log('========================================');
console.log('   WhatsApp Daily Assistant Bot');
console.log('   Powered by Irza Fhahlefi');
console.log('========================================\n');

// --- Load Database ---
loadDB();
console.log('[BOT] Database loaded.');
console.log(`[BOT] Total user: ${getUserCount()}`);
console.log(`[BOT] AI Chat: ${isAIAvailable() ? 'Aktif (Groq)' : 'Nonaktif — set GROQ_API_KEY di .env'}`);

// --- Start Admin Panel ---
startAdmin();

// --- Message Handler ---

/**
 * Extract text body from incoming message.
 * Supports: conversation, extendedTextMessage
 * @param {object} message - Baileys message object
 * @returns {string|null}
 */
function extractMessageText(message) {
    if (!message) return null;

    if (message.conversation) {
        return message.conversation;
    }

    if (message.extendedTextMessage?.text) {
        return message.extendedTextMessage.text;
    }

    return null;
}

/**
 * Route incoming text to the appropriate command handler.
 * Each command receives user-specific data (userData).
 * @param {string} text - The raw incoming message text
 * @param {object} userData - User-specific data { todo: [], pengeluaran: [] }
 * @returns {string|{type: 'export', handler: string}|null}
 */
function routeCommand(text, userData) {
    const raw = text.trim();
    const lower = raw.toLowerCase();

    // -- export --
    if (lower === 'export todo') {
        return { type: 'export', handler: 'todo' };
    }
    if (lower === 'export pdf keuangan' || lower === 'export pdf pengeluaran') {
        return { type: 'export', handler: 'keuangan-pdf' };
    }
    if (lower === 'export keuangan' || lower === 'export pengeluaran') {
        return { type: 'export', handler: 'keuangan' };
    }

    // -- reset --
    if (lower === 'reset keuangan' || lower === 'reset pengeluaran') {
        return handleResetKeuangan(userData);
    }
    if (lower === 'reset todo') {
        return handleResetTodo(userData);
    }

    // -- halo --
    if (lower === 'halo' || lower === 'hai' || lower === 'hi' || lower === 'hello') {
        return handleHalo();
    }

    // -- menu --
    if (lower === 'menu') {
        return handleMenu();
    }

    // -- jam --
    if (lower === 'jam') {
        return handleJam();
    }

    // -- done [nomor] --
    if (lower.startsWith('done')) {
        const args = raw.substring(4).trim();
        return handleTodoDone(userData, args);
    }

    // -- todo / todo [isi] --
    if (lower.startsWith('todo')) {
        const args = raw.substring(4).trim();
        if (args.length === 0) {
            return handleTodoList(userData);
        }
        return handleTodoAdd(userData, args);
    }

    // -- edit [nomor] [nominal] [keterangan] (keuangan) --
    if (lower.startsWith('edit')) {
        const args = raw.substring(4).trim();
        return handleEditPengeluaran(userData, args);
    }

    // -- hapus [nomor] (keuangan) --
    if (lower.startsWith('hapus')) {
        const args = raw.substring(5).trim();
        return handleHapusPengeluaran(userData, args);
    }

    // -- catat [nominal] [keterangan] --
    if (lower.startsWith('catat')) {
        const args = raw.substring(5).trim();
        return handleCatat(userData, args);
    }

    // -- total --
    if (lower === 'total') {
        return handleTotal(userData);
    }

    return null;
}

/**
 * Handle export command — generate Excel/PDF and return file buffer.
 * @param {string} handler - 'todo', 'keuangan', or 'keuangan-pdf'
 * @param {object} userData - User-specific data
 * @returns {Promise<{text: string}|{document: Buffer, fileName: string, mimetype: string}>}
 */
async function handleExport(handler, userData) {
    let result;
    let mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (handler === 'todo') {
        result = await exportTodoExcel(userData);
        if (!result) {
            return { text: 'Tidak ada data todo untuk di-export.' };
        }
    } else if (handler === 'keuangan') {
        result = await exportFinanceExcel(userData);
        if (!result) {
            return { text: 'Tidak ada data pengeluaran untuk di-export.' };
        }
    } else if (handler === 'keuangan-pdf') {
        result = await exportFinancePDF(userData);
        mimetype = 'application/pdf';
        if (!result) {
            return { text: 'Tidak ada data pengeluaran untuk di-export.' };
        }
    }

    // Read file into buffer for sending
    const fileBuffer = fs.readFileSync(result.filePath);

    // Clean up the file after reading
    try { fs.unlinkSync(result.filePath); } catch (e) { /* ignore */ }

    return {
        document: fileBuffer,
        fileName: result.fileName,
        mimetype,
    };
}

// --- WhatsApp Connection ---

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    // Fetch latest WA Web version to avoid 405 errors
    let version;
    try {
        const versionInfo = await fetchLatestBaileysVersion();
        version = versionInfo.version;
        console.log(`[AUTH] WA Web version: ${version.join('.')}`);
    } catch (err) {
        version = [2, 3000, 1015901307];
        console.log(`[AUTH] Version fetch failed, using fallback: ${version.join('.')}`);
    }

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        version,
        logger,
        browser: ['WhatsApp Bot', 'Chrome', '1.0.0'],
        generateHighQualityLinkPreview: false,
    });

    // -- Connection Updates --
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n[AUTH] Scan QR code di bawah ini untuk login:\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

            console.log(`[CONN] Koneksi terputus. Reason: ${reason}`);

            if (reason === DisconnectReason.loggedOut) {
                console.log('[CONN] Logged out. Hapus folder auth_info dan scan ulang QR.');
                process.exit(1);
            }

            console.log('[CONN] Mencoba reconnect...');
            setTimeout(() => startBot(), 3000);
        }

        if (connection === 'open') {
            console.log('[CONN] Bot berhasil terhubung ke WhatsApp.');
            console.log('[CONN] Bot siap menerima pesan.\n');

            // Clean up old export files on connect
            cleanupExports();
        }
    });

    // -- Save Credentials on Update --
    sock.ev.on('creds.update', saveCreds);

    // -- Message Handler --
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            try {
                if (msg.key.fromMe) continue;
                if (msg.key.remoteJid === 'status@broadcast') continue;

                const text = extractMessageText(msg.message);
                if (!text) continue;

                const sender = msg.key.remoteJid;
                const pushName = msg.pushName || 'Unknown';

                // Get user-specific data for this sender
                const userData = getUserData(sender);

                // Log incoming message
                console.log(`[MSG] Dari: ${pushName} (${sender})`);
                console.log(`[MSG] Pesan: ${text}`);

                // Route to command handler with user-specific data
                const response = routeCommand(text, userData);

                if (response) {
                    const commandName = text.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase();
                    console.log(`[CMD] Menjalankan: ${commandName}`);

                    // Handle export commands (returns file)
                    if (typeof response === 'object' && response.type === 'export') {
                        const exportResult = await handleExport(response.handler, userData);

                        if (exportResult.text) {
                            await sock.sendMessage(sender, { text: exportResult.text });
                        } else {
                            await sock.sendMessage(sender, {
                                document: exportResult.document,
                                fileName: exportResult.fileName,
                                mimetype: exportResult.mimetype,
                            });
                            console.log(`[CMD] File terkirim: ${exportResult.fileName}`);
                        }
                    } else {
                        await sock.sendMessage(sender, { text: response });
                    }

                    console.log(`[CMD] Response terkirim ke ${pushName}`);
                } else {
                    // Non-command message — use AI or keyword fallback
                    let chatReply = null;

                    // Try AI first
                    if (isAIAvailable()) {
                        chatReply = await chatWithAI(sender, text);
                        if (chatReply) {
                            console.log(`[AI] Response generated`);
                        }
                    }

                    // Fallback to keyword matching
                    if (!chatReply) {
                        chatReply = handleCurhat(text) || handleFallback(text);
                        console.log(`[CHAT] Keyword fallback`);
                    }

                    await sock.sendMessage(sender, { text: chatReply });
                    console.log(`[CHAT] Response terkirim ke ${pushName}`);
                }

                console.log('');
            } catch (err) {
                console.error('[ERR] Error memproses pesan:', err.message);
            }
        }
    });
}

// --- Start ---
startBot().catch((err) => {
    console.error('[FATAL] Gagal memulai bot:', err);
    process.exit(1);
});
