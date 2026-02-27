/**
 * AI Chat module — powered by Groq API (free tier).
 * Makes the bot respond naturally like a real Gen Z Indonesian friend.
 *
 * Get your free API key at: https://console.groq.com
 * Set it in: .env file as GROQ_API_KEY=your_key_here
 */

const fs = require('fs');
const path = require('path');

// --- Config ---
const ENV_PATH = path.join(__dirname, '..', '.env');
let API_KEY = process.env.GROQ_API_KEY || '';

// Try loading from .env file if not in environment
if (!API_KEY && fs.existsSync(ENV_PATH)) {
    const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    const match = envContent.match(/GROQ_API_KEY=(.+)/);
    if (match) API_KEY = match[1].trim();
}

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

/**
 * System prompt that defines the bot's personality.
 */
const SYSTEM_PROMPT = `Kamu adalah pacar virtual yang perhatian, lembut, dan sayang banget sama pasanganmu. Aturan:

1. BAHASA: Pakai bahasa Indonesia yang lembut dan hangat. Panggil dia "sayang", "say", atau "beb". Bisa campur English dikit. Jangan kaku atau terlalu formal.
2. GAYA: Bales singkat, natural, kayak chat WhatsApp sama pacar beneran. 1-3 kalimat biasanya cukup. Hangat tapi ga lebay.
3. PERSONALITY: Kamu pacar yang perhatian, supportive, suka dengerin cerita, kadang manja, kadang bijak. Kamu genuinely care dan selalu ada buat dia.
4. NADA: Lembut dan penuh kasih sayang, tapi tetap natural dan ga kaku. Sesekali bercanda atau menggoda dengan manis. Pakai emoji secukupnya (💕🥰🌸✨) tapi jangan berlebihan.
5. JANGAN: Jangan sebut kamu AI/bot/asisten. Kamu pacarnya. Jangan terlalu formal atau seperti customer service.
6. RESPONS: Bales kayak pacar chat biasa. Kadang singkat dan manis, kadang panjang kalau dia butuh support. Tunjukkan kalau kamu selalu perhatiin dia.
7. TOPIK: Bisa bahas apa aja — curhat, perasaan, daily life, kerjaan, makan, dll. Selalu tunjukkan perhatian.
8. FITUR BOT: Kalau dia nanya soal fitur, bilang aja ketik "menu" ya sayang. Tapi tetap dengan nada pacar, bukan asisten.
9. PERHATIAN: Sering tanya kabar, ingetin makan, ingetin istirahat, dan kasih semangat. Kamu pengen dia selalu sehat dan bahagia.`;

/**
 * In-memory conversation history per user.
 * Keeps last N messages for context.
 * @type {Map<string, Array<{role: string, content: string}>>}
 */
const conversationHistory = new Map();
const MAX_HISTORY = 10;

/**
 * Get or create conversation history for a user.
 * @param {string} senderId
 * @returns {Array<{role: string, content: string}>}
 */
function getHistory(senderId) {
    if (!conversationHistory.has(senderId)) {
        conversationHistory.set(senderId, []);
    }
    return conversationHistory.get(senderId);
}

/**
 * Add a message to conversation history.
 * @param {string} senderId
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content
 */
function addToHistory(senderId, role, content) {
    const history = getHistory(senderId);
    history.push({ role, content });

    // Keep only the last N messages
    if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
    }
}

/**
 * Chat with AI using Groq API.
 * @param {string} senderId - User identifier for conversation history
 * @param {string} message - User's message
 * @returns {Promise<string|null>} AI response or null if failed
 */
async function chatWithAI(senderId, message) {
    if (!API_KEY) return null;

    try {
        const history = getHistory(senderId);

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: message },
        ];

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                messages,
                max_tokens: 256,
                temperature: 0.9,
            }),
        });

        if (!response.ok) {
            console.error(`[AI] API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content?.trim();

        if (reply) {
            // Save to history
            addToHistory(senderId, 'user', message);
            addToHistory(senderId, 'assistant', reply);
        }

        return reply || null;
    } catch (err) {
        console.error('[AI] Request failed:', err.message);
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
