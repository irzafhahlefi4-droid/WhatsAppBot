const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    downloadMediaMessage,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');

const { loadDB, getUserData, getUserCount, clearChatHistory } = require('./database');
const { handleHalo, handleJam } = require('./commands/general');
const { handleMenu } = require('./commands/menu');
const { handleTodoList, handleTodoAdd, handleTodoDone, handleResetTodo } = require('./commands/todo');
const { handleCatat, handleTotal, handleHapusPengeluaran, handleEditPengeluaran, handleResetKeuangan, handleBatas } = require('./commands/finance');
const { exportTodoExcel, exportFinanceExcel, exportFinancePDF, cleanupExports } = require('./commands/export');
const { handleCurhat, handleFallback } = require('./commands/curhat');
const { chatWithAI, isAIAvailable } = require('./ai');
const { startAdmin } = require('./admin');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');
const AUTH_DIR = path.join(DATA_DIR, 'auth_info');
const logger = pino({ level: 'silent' });

console.log('========================================');
console.log('   WhatsApp Daily Assistant Bot');
console.log('   Powered by Irza Fhahlefi');
console.log('========================================\n');

loadDB();
console.log(`[bot] ${getUserCount()} user loaded`);
console.log(`[bot] AI ${isAIAvailable() ? 'active (Groq)' : 'inactive'}`);

startAdmin();

function extractText(message) {
    if (!message) return null;
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message.imageMessage) return message.imageMessage.caption || '';
    return null;
}

function routeCommand(text, userData) {
    const raw = text.trim();
    const cmd = raw.toLowerCase();

    if (cmd === 'export todo') return { type: 'export', handler: 'todo' };
    if (cmd === 'export pdf keuangan' || cmd === 'export pdf pengeluaran') return { type: 'export', handler: 'keuangan-pdf' };
    if (cmd === 'export keuangan' || cmd === 'export pengeluaran') return { type: 'export', handler: 'keuangan' };
    if (cmd === 'reset keuangan' || cmd === 'reset pengeluaran') return handleResetKeuangan(userData);
    if (cmd === 'reset todo') return handleResetTodo(userData);
    if (cmd === 'halo' || cmd === 'hai' || cmd === 'hi' || cmd === 'hello') return handleHalo();
    if (cmd === 'menu') return handleMenu();
    if (cmd === 'jam') return handleJam();
    if (cmd === 'total') return handleTotal(userData);

    if (cmd.startsWith('done')) return handleTodoDone(userData, raw.slice(4).trim());
    if (cmd.startsWith('todo')) {
        const args = raw.slice(4).trim();
        return args ? handleTodoAdd(userData, args) : handleTodoList(userData);
    }
    if (cmd.startsWith('edit')) return handleEditPengeluaran(userData, raw.slice(4).trim());
    if (cmd.startsWith('hapus')) return handleHapusPengeluaran(userData, raw.slice(5).trim());
    if (cmd.startsWith('catat')) return handleCatat(userData, raw.slice(5).trim());
    if (cmd.startsWith('batas')) return handleBatas(userData, raw.slice(5).trim());

    return null;
}

async function sendExport(sock, sender, handler, userData) {
    const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const exporters = {
        'todo': [exportTodoExcel, XLSX_MIME, 'Ga ada tugas yang bisa di-export nih'],
        'keuangan': [exportFinanceExcel, XLSX_MIME, 'Ga ada catatan pengeluaran buat di-export'],
        'keuangan-pdf': [exportFinancePDF, 'application/pdf', 'Ga ada catatan pengeluaran buat dibikin PDF'],
    };

    const [exporter, mimetype, emptyMsg] = exporters[handler];
    const result = await exporter(userData);

    if (!result) return sock.sendMessage(sender, { text: emptyMsg });

    const buffer = fs.readFileSync(result.filePath);
    try { fs.unlinkSync(result.filePath); } catch { }

    return sock.sendMessage(sender, { document: buffer, fileName: result.fileName, mimetype });
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    let version;
    try {
        const info = await fetchLatestBaileysVersion();
        version = info.version;
    } catch {
        version = [2, 3000, 1015901307];
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

    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            console.log('\n[auth] Scan QR:\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (code === DisconnectReason.loggedOut) {
                console.log('[conn] Logged out. Hapus auth_info dan scan ulang.');
                process.exit(1);
            }
            setTimeout(startBot, 3000);
        }

        if (connection === 'open') {
            console.log('[conn] Connected\n');
            cleanupExports();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            try {
                if (msg.key.fromMe) continue;
                if (msg.key.remoteJid === 'status@broadcast') continue;

                const hasImage = msg.message?.imageMessage
                    || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

                let text = extractText(msg.message);
                if (text === null && !hasImage) continue;
                if (!text && hasImage) text = '';

                const sender = msg.key.remoteJid;
                const name = msg.pushName || 'Unknown';
                const userData = getUserData(sender);

                console.log(`[msg] ${name}: ${text || '[image]'}`);

                const command = routeCommand(text || '', userData);

                // Special: reset chat history
                if (text?.trim().toLowerCase() === 'reset chat') {
                    clearChatHistory(sender);
                    await sock.sendMessage(sender, { text: 'Oke, kita mulai fresh lagi ya' });
                    continue;
                }
                if (command && text) {
                    if (typeof command === 'object' && command.type === 'export') {
                        await sendExport(sock, sender, command.handler, userData);
                    } else {
                        await sock.sendMessage(sender, { text: command });
                    }
                    continue;
                }

                let imageBuffer = null;
                let reply = null;

                if (isAIAvailable() && text) {
                    reply = await chatWithAI(sender, text);
                }

                if (!reply && !isAIAvailable() && text) {
                    reply = handleCurhat(text) || handleFallback(text);
                }

                if (reply) {
                    await sock.sendMessage(sender, { text: reply });
                }

            } catch (err) {
                console.error('[err]', err.message);
            }
        }
    });
}

startBot().catch(err => {
    console.error('[fatal]', err);
    process.exit(1);
});
