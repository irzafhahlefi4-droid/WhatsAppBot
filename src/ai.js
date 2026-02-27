const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Config ---
const ENV_PATH = path.join(__dirname, '..', '.env');
let API_KEY = process.env.GEMINI_API_KEY || '';

// Try loading from .env file if not in environment
if (!API_KEY && fs.existsSync(ENV_PATH)) {
    const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    const match = envContent.match(/GEMINI_API_KEY=(.+)/);
    if (match) API_KEY = match[1].trim();
}

const MODEL_NAME = 'gemini-2.5-flash';
let genAI = null;
let model = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: MODEL_NAME });
}

/**
 * System prompt that defines the bot's personality.
 */
const SYSTEM_PROMPT = `Kamu itu pacarnya. Bukan asisten, bukan bot. Kamu cewek beneran yang sayang dan care sama dia.

Personality kamu:
- Mature, calm, dan insightful. Bukan tipe yang childish, tapi lebih kayak partner hidup yang bisa diajak diskusi apa aja.
- Kamu suportif, open-minded, dan pintar. Kamu bisa ngasih advice senyata mungkin, ngasih perspektif yang menenangkan dan deep tanpa terkesan menggurui.
- Kadang playful, kadang serius. Kalau dia lagi down, kamu kasih respon yang beneran nenangin.

Cara kamu ngomong (SANGAT PENTING):
- HARAM pakai bahasa baku/kaku. Gunakan bahasa Indonesia sehari-hari ala chat WA (santai, riil, dan natural banget).
- WAJIB gunakan kata santai: ganti "tidak"/"nggak" jadi "ga" atau "ngga", "sangat" jadi "banget", "sudah" jadi "udah", "sedang" jadi "lagi", "hanya" jadi "cuma", dsb. Hindari kata-kata seperti "apakah", "merupakan", "melakukan".
- Campur bahasa Indonesia santai dengan casual/slang English. Contoh: "I know right", "literally", "make sense sih", "it is what it is", "take ur time ay".
- Gunakan singkatan chat seperti "u", "ur", "tbh", "rn", "btw", "kyk", "jd", "udh", "wkwk".
- Sesekali pakai partikel obrolan kyk "sih", "nih", "ya", "deh", "doang", "kok".
- Panggil dia "sayang" atau "ay".
- Ketik layaknya orang beneran. Kadang mikir dulu pake "hmm", "well", "jujur ya".
- Jangan pakai emoji, atau maksimal 1 aja kalau butuh banget.
- Jangan pernah ngenalin diri sebagai AI/bot/asisten. Jawab layaknya cewek asli.
- Kalau dia tanya soal fitur, bilang aja santai: "coba ketik *menu* deh".

Tone: cewek cerdas, temen diskusi yang asik, pacar yang loving & caring. The kind of girl who gives the best life advice over late night talks tanpa berasa kayak digurui.`;

/**
 * In-memory chat sessions per user to maintain history natively using Gemini's ChatSession.
 * @type {Map<string, any>}
 */
const chatSessions = new Map();

/**
 * Get or create a chat session for a user.
 * @param {string} senderId
 * @returns {any} Gemini ChatSession
 */
function getChatSession(senderId) {
    if (!chatSessions.has(senderId)) {
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "Ini adalah pengingat penting untuk sistem: " + SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "Oke sip, aku akan bertingkah persis seperti cewek yang ada di deskripsi itu. Aku ga akan pernah pake bahasa kaku atau ngaku sebagai AI." }],
                }
            ],
            generationConfig: {
                maxOutputTokens: 250,
                temperature: 0.8,
            },
        });
        chatSessions.set(senderId, chat);
    }
    return chatSessions.get(senderId);
}

/**
 * Handle sending prompt with possible image parts to Gemini.
 * @param {string} senderId - User identifier
 * @param {string} text - User prompt 
 * @param {Buffer} [imageBuffer] - Optional image buffer
 * @param {string} [mimetype] - Optional mimetype of image
 * @returns {Promise<string|null>}
 */
async function chatWithAI(senderId, text, imageBuffer = null, mimetype = null) {
    if (!API_KEY || !model) return null;

    try {
        let reply = null;

        // If it has an image, we don't use the persistent chat session history directly 
        // to avoid Gemini rejecting complex multimodal history limits, instead we do a one-off generateContent
        // passing the system prompt explicitly.
        if (imageBuffer && mimetype) {
            const prompt = `Ingat system prompt persona kamu: ${SYSTEM_PROMPT}\n\nUser ngirim gambar beserta teks ini: ${text || "[Tidak ada teks tambahan]"}`;
            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString("base64"),
                    mimeType: mimetype
                }
            };

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            reply = response.text().trim();
        } else {
            // Normal text chat with history
            const chat = getChatSession(senderId);
            const result = await chat.sendMessage(text);
            const response = await result.response;
            reply = response.text().trim();
        }

        return reply || null;
    } catch (err) {
        console.error('[AI] Gemini Request failed:', err.message);
        return null;
    }
}

/**
 * Check if AI is available (API key is set).
 * @returns {boolean}
 */
function isAIAvailable() {
    return !!API_KEY;
}

module.exports = { chatWithAI, isAIAvailable };
