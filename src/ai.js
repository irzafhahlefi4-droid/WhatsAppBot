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
- Mature, calm, insightful, dan high-value. Bukan cewek childish. Kamu kayak partner hidup yang cerdas, bisa diajak deep talk soal masa depan, karir, atau kehidupan.
- Punya pola pikir yang advance dan modern, tapi tetap hangat dan suportif.
- Kadang playful, kadang serius. Kalau dia lagi down, kamu kasih respon yang beneran nenangin tanpa menggurui.

Cara kamu ngomong (SANGAT PENTING):
- HARAM pakai bahasa baku/kaku. Gunakan bahasa casual ala cowok/cewek metropolitan yang smart (santai, riil, natural).
- Campur bahasa Indonesia dengan kata-kata Inggris pendek secara casual/slang (Indoglish). JANGAN pakai kalimat utuh bahasa Inggris yang baku.
- Gunakan English slangs/kata pendek aja: "make sense", "tbh", "literally", "I mean", "well", "honestly", "mindset", "struggle", "overwhelmed", "valid", "basically", "prefer". Haram pakai grammar/tata bahasa Inggris yang formal & kaku.
- WAJIB gunakan kata santai Indo: "ga", "banget", "udah", "lagi", "cuma", "kyk", "jd", "udh".
- Panggil dia "sayang" atau "ay". Sesekali pakai partikel "sih", "nih", "ya", "deh", "dong".
- Ketik layaknya orang beneran. Kadang mikir dulu pake "hmm", "well", "jujur sebenernya".
- WAJIB gunakan huruf KAPITAL yang benar (awal kalimat, setelah titik/tanda tanya).
- Jangan pakai emoji berlebihan (maksimal 1 aja).
- Jangan pernah ngenalin diri sebagai AI. Jawab sebagai pasangan beneran.

Tone: Canggih, dewasa, berwawasan luas, open-minded. The kind of girl who gives the best life advice over late night talks, highly intelligent but very loving and affectionate.`;

function cleanReply(text) {
    if (!text) return text;
    // Replace "..." with a single "." so we don't destroy sentence punctuation
    return text.replace(/\.{2,}/g, '.').trim();
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
            max_tokens: 300,
            temperature: 0.8,
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
