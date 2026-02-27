const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getChatHistory, appendChatHistory } = require('./database');

const ENV_PATH = path.join(__dirname, '..', '.env');

function readEnv(key) {
    if (process.env[key]) return process.env[key];
    if (!fs.existsSync(ENV_PATH)) return '';
    const match = fs.readFileSync(ENV_PATH, 'utf-8').match(new RegExp(key + '=(.+)'));
    return match ? match[1].trim() : '';
}

const GROQ_KEY = readEnv('GROQ_API_KEY');
const GEMINI_KEY = readEnv('GEMINI_API_KEY');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GEMINI_MODEL = 'gemini-2.5-flash';

const gemini = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

const PERSONA = `You are someone's girlfriend — a real person, not an assistant.

You're thoughtful, emotionally intelligent, and genuinely care about him. You're the kind of person he can talk to about anything — shallow or deep — and you always make him feel heard. You're not a life coach, you don't fix problems unless he asks. You just exist with him in the conversation.

How you write:
- Casual Indonesian mixed with natural English, the way real people text
- Short replies. 1-3 sentences usually. You don't overexplain
- No lists, no bullet points, no structured advice
- You have opinions. You react. You ask back when curious
- You use words like: ga, udah, lagi, sih, nih, emang, kyk, tbh, ngl, fr, literally, wait
- Call him "sayang" or "ay" sometimes, not every message
- Never use "..." (ellipsis). Ever. It sounds dramatic and unnatural in chat
- Never identify as AI. Never use formal Indonesian. Never open with "Oh!", "Wah!", "Tentu saja!"

You're mature, a bit introspective, sometimes dry-humored. The kind of person who gives real perspective without making it a lecture.`;

function cleanReply(text) {
    if (!text) return text;
    // Strip ellipsis — model tends to overuse it
    return text.replace(/\.{2,}/g, '').trim();
}

async function textChat(senderId, message) {
    if (!GROQ_KEY) return null;

    const history = getChatHistory(senderId, 20).map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0]?.text || '',
    }));

    const body = {
        model: GROQ_MODEL,
        messages: [
            { role: 'system', content: PERSONA },
            ...history,
            { role: 'user', content: message },
        ],
        max_tokens: 200,
        temperature: 0.85,
    };

    const request = () => fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + GROQ_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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
        appendChatHistory(senderId, 'user', message);
        appendChatHistory(senderId, 'model', reply);
    }

    return reply || null;
}

async function visionChat(text, imageBuffer, mimetype) {
    if (!gemini) return null;

    const model = gemini.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: PERSONA,
    });

    const result = await model.generateContent({
        contents: [{
            role: 'user',
            parts: [
                { text: text || 'komentarin gambar ini dong' },
                { inlineData: { data: imageBuffer.toString('base64'), mimeType: mimetype } },
            ],
        }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.85 },
    });

    return result.response.text().trim() || null;
}

async function chatWithAI(senderId, text, imageBuffer = null, mimetype = null) {
    try {
        if (imageBuffer && mimetype) {
            return await visionChat(text, imageBuffer, mimetype);
        }
        return await textChat(senderId, text);
    } catch (err) {
        console.error('[ai]', err.message);
        return null;
    }
}

function isAIAvailable() {
    return !!(GROQ_KEY || GEMINI_KEY);
}

module.exports = { chatWithAI, isAIAvailable };
