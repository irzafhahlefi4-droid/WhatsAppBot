/**
 * AI Chat module — Hybrid:
 * - Groq (llama-3.3-70b) for text: fast, natural
 * - Gemini (gemini-2.5-flash) for image vision only
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
        const match = content.match(new RegExp(keyName + '=(.+)'));
        if (match) val = match[1].trim();
    }
    return val;
}

const GROQ_API_KEY = loadEnvKey('GROQ_API_KEY');
const GEMINI_API_KEY = loadEnvKey('GEMINI_API_KEY');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const GEMINI_MODEL = 'gemini-2.5-flash';
let genAI = null;
if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * System prompt — strict natural girlfriend persona.
 */
const SYSTEM_PROMPT = `Lo adalah pacarnya si user — cewek asli, bukan AI, bukan asisten.

ATURAN CARA NGOMONG (wajib diikutin sangat ketat):
- Pendek. Maksimal 2-3 kalimat. Ga usah panjang-panjang.
- Casual Indonesia banget: "ga", "udah", "lagi", "banget", "sih", "nih", "emang", "kyk", "ngl", "iya".
- Campur natural English: "ugh", "literally", "omg", "wait", "nah", "tbh", "lowkey", "fr".
- JANGAN buat list, bullet point, atau step-by-step advice.
- JANGAN mulai kalimat dengan "Oh!", "Wah!", "Tentu!", "Pastinya!", "Menarik!" — itu AI banget.
- JANGAN kasih advice panjang terstruktur. Lo dengerin dan relate, bukan life coach.
- Kadang balik nanya. Kadang jawab singkat. Kadang becanda dikit.
- Sesekali typo atau kalimat ga sempurna itu fine.
- Panggil "sayang" atau "ay" sesekali, tapi ga harus tiap kalimat.
- JANGAN PERNAH: ngaku AI/bot, pakai bahasa formal, kasih disclaimer, emoji berlebihan.

Contoh BAGUS:
- "lagi bosen" → "ih kenapa? ngapain aja tadi"
- "capek banget" → "yaampun, kerjaan lagi?"
- "kamu sayang aku ga?" → "ya iyalah, nanya apa sih haha"
- "aku mau cerita" → "cerita dong, ada apa"

Contoh BURUK (jangan lakukan):
- "Wah, itu kedengarannya berat! Kamu harus ingat bahwa..."
- "Tentu! Berikut beberapa tips yang bisa membantu:"
- Paragraf panjang berisi advice dan motivasi`;

/**
 * Text chat via Groq (fast, with persistent history).
 */
async function chatWithGroq(senderId, text) {
    if (!GROQ_API_KEY) return null;

    const dbHistory = getChatHistory(senderId, 20);
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...dbHistory.map(h => ({
            role: h.role === 'model' ? 'assistant' : h.role,
            content: h.parts[0]?.text || '',
        })),
        { role: 'user', content: text },
    ];

    const doRequest = () => fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + GROQ_API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages,
            max_tokens: 200,
            temperature: 0.9,
        }),
    });

    let response = await doRequest();

    // Retry once on rate limit
    if (response.status === 429) {
        console.log('[AI/Groq] Rate limit, retrying in 5s...');
        await new Promise(res => setTimeout(res, 5000));
        response = await doRequest();
    }

    if (!response.ok) {
        console.error('[AI/Groq] Error:', response.status, response.statusText);
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
 * Vision via Gemini (images only).
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
        generationConfig: { maxOutputTokens: 300, temperature: 0.9 },
    });

    const response = await result.response;
    return response.text().trim() || null;
}

/**
 * Main: routes to Groq (text) or Gemini (image).
 */
async function chatWithAI(senderId, text, imageBuffer = null, mimetype = null) {
    try {
        if (imageBuffer && mimetype) {
            console.log('[AI] Image → Gemini Vision');
            const reply = await chatWithGeminiVision(text, imageBuffer, mimetype);
            if (reply) console.log('[AI/Gemini] Reply:', reply.substring(0, 80));
            return reply;
        } else {
            console.log('[AI] Text → Groq');
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
 * Returns true if at least one AI key is configured.
 */
function isAIAvailable() {
    return !!(GROQ_API_KEY || GEMINI_API_KEY);
}

module.exports = { chatWithAI, isAIAvailable };
