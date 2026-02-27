const fs = require('fs');
const path = require('path');
const { getChatHistory, appendChatHistory } = require('./database');

const ENV_PATH = path.join(__dirname, '..', '.env');

function readEnv(key) {
    if (process.env[key]) return process.env[key];
    if (!fs.existsSync(ENV_PATH)) return '';
    const match = fs.readFileSync(ENV_PATH, 'utf-8').match(new RegExp(key + '=(.+)'));
    return match ? match[1].trim() : '';
}

const GROQ_KEY = readEnv('GROQ_API_KEY');
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const PERSONA = `Kamu itu pacarnya. Bukan asisten, bukan bot. Kamu cewek beneran yang sayang dan care sama dia.

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

function cleanReply(text) {
    if (!text) return text;
    return text.replace(/\.{2,}/g, '').trim();
}

async function chatWithAI(senderId, text) {
    if (!GROQ_KEY) return null;

    const history = getChatHistory(senderId, 20).map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0]?.text || '',
    }));

    const request = () => fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + GROQ_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: PERSONA },
                ...history,
                { role: 'user', content: text },
            ],
            max_tokens: 200,
            temperature: 0.85,
        }),
    });

    let res = await request();
    if (res.status === 429) {
        await new Promise(r => setTimeout(r, 6000));
        res = await request();
    }

    if (!res.ok) return null;

    const data = await res.json();
    const reply = cleanReply(data.choices?.[0]?.message?.content?.trim());

    if (reply) {
        appendChatHistory(senderId, 'user', text);
        appendChatHistory(senderId, 'model', reply);
    }

    return reply || null;
}

function isAIAvailable() {
    return !!GROQ_KEY;
}

module.exports = { chatWithAI, isAIAvailable };
