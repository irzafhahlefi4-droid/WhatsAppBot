/**
 * AI Chat module — Hybrid approach:
 * - Groq (llama-3.3-70b) for text chat: fast, natural, reliable
 * - Gemini (gemini-2.5-flash) for image vision: only when image is sent
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getChatHistory, appendChatHistory } = require('./database');

// --- Config ---
const ENV_PATH = path.join(__dirname, '..', '.env');

function loadEnvKey(keyName) {
    let val = process.env[keyName] || '';
    if (!val && fs.existsSync(ENV_PATH)) {
        const content = fs.readFileSync(ENV_PATH, 'utf-8');
        const match = content.match(new RegExp(`${keyName}=(.+)`));
        if (match) val = match[1].trim();
    }
    return val;
}

const GROQ_API_KEY = loadEnvKey('GROQ_API_KEY');
const GEMINI_API_KEY = loadEnvKey('GEMINI_API_KEY');

// Groq setup
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Gemini setup (vision only)
const GEMINI_MODEL = 'gemini-2.5-flash';
let genAI = null;
if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * System prompt — girlfriend persona.
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
 * Text chat using Groq API (fast, reliable, persistent history via DB).
 * @param {string} senderId
 * @param {string} text
 * @returns {Promise<string|null>}
 */
async function chatWithGroq(senderId, text) {
    if (!GROQ_API_KEY) return null;

    // Load last 20 messages from DB for context
    const dbHistory = getChatHistory(senderId, 20);
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        // Convert Gemini-format history [{role, parts:[{text}]}] to OpenAI format
        ...dbHistory.map(h => ({ role: h.role === 'model' ? 'assistant' : h.role, content: h.parts[0]?.text || '' })),
        { role: 'user', content: text },
    ];

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages,
            max_tokens: 300,
            temperature: 0.8,
        }),
    });

    if (!response.ok) {
        console.error(`[AI/Groq] Error: ${response.status} ${response.statusText}`);
        return null;
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (reply) {
        appendChatHistory(senderId, 'user', text);
        appendChatHistory(senderId, 'model', reply);
    }

    return reply || null;
}

/**
 * Vision using Gemini (only for images).
 * @param {string} text - Caption or empty
 * @param {Buffer} imageBuffer
 * @param {string} mimetype
 * @returns {Promise<string|null>}
 */
async function chatWithGeminiVision(text, imageBuffer, mimetype) {
    if (!GEMINI_API_KEY || !genAI) return null;

    const imageModel = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: SYSTEM_PROMPT,
    });

    const imagePart = {
        inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: mimetype,
        },
    };
    const textPart = { text: text || 'Komentari gambar ini dong' };

    const result = await imageModel.generateContent({
        contents: [{ role: 'user', parts: [textPart, imagePart] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.85 },
    });

    const response = await result.response;
    return response.text().trim() || null;
}

/**
 * Main entry point. Routes to Groq (text) or Gemini (image).
 * @param {string} senderId
 * @param {string} text
 * @param {Buffer} [imageBuffer]
 * @param {string} [mimetype]
 * @returns {Promise<string|null>}
 */
async function chatWithAI(senderId, text, imageBuffer = null, mimetype = null) {
    try {
        if (imageBuffer && mimetype) {
            console.log('[AI] Vision request → Gemini');
            const reply = await chatWithGeminiVision(text, imageBuffer, mimetype);
            if (reply) console.log('[AI/Gemini] Reply:', reply.substring(0, 80));
            return reply;
        } else {
            console.log('[AI] Text request → Groq');
            const reply = await chatWithGroq(senderId, text);
            if (reply) console.log('[AI/Groq] Reply:', reply.substring(0, 80));
            return reply;
        }
    } catch (err) {
        console.error('[AI] Error:', err.message);
        return null;
    }
}

/**
 * AI is available if at least Groq key is set.
 * @returns {boolean}
 */
function isAIAvailable() {
    return !!(GROQ_API_KEY || GEMINI_API_KEY);
}

module.exports = { chatWithAI, isAIAvailable };
