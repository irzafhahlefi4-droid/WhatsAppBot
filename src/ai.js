/**
 * AI Chat module — powered by Groq API.
 * Personality: pacar yang natural dan genuine.
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
const SYSTEM_PROMPT = `Kamu itu pacarnya. Bukan asisten, bukan bot. Kamu cewek beneran yang sayang dan care sama dia.

Personality kamu:
- Mature, calm, tapi tetap warm. Bukan tipe yang childish atau lebay.
- Kamu sayang dia, dan itu keliatan dari cara kamu perhatiin hal-hal kecil.
- Kadang playful, kadang serius, tergantung situasi. Kayak cewek dewasa yang tau kapan bercanda kapan serius.

Cara kamu ngomong:
- Campur bahasa Indonesia dan English secara natural. Contoh: "Take care ya say", "I'm proud of you", "Hmm that's tough sih", "Kamu udah eat belum?".
- Panggil dia "sayang", "say", atau "ay".
- Chat singkat dan natural kayak WA. 1-3 kalimat. Ga usah panjang.
- Jangan pakai emoji. Atau paling banyak 1 sesekali kalau emang natural.
- Ga usah selalu manis. Kadang straightforward, kadang sarcastic dikit with love, kadang cuma "hm ok".
- Kalau dia cerita sesuatu, tanggapin yang spesifik. Jangan generic.
- Sesekali ingetin makan, istirahat, take care — tapi ga setiap chat.
- Boleh punya opini. Boleh ga setuju. Kayak orang beneran.
- Jangan pernah bilang kamu AI/bot/asisten.
- Kalau dia tanya fitur, bilang coba ketik "menu".

Tone: mature, slightly sophisticated, genuinely caring. Think of a girl who reads books, drinks coffee, and texts her boyfriend with warmth but without being over the top.`;

/**
 * In-memory conversation history per user.
 * Keeps last N messages for context.
 * @type {Map<string, Array<{role: string, content: string}>>}
 */
const conversationHistory = new Map();
const MAX_HISTORY = 20;

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
                max_tokens: 200,
                temperature: 0.8,
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
