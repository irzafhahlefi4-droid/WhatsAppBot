const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');
const DB_PATH = path.join(DATA_DIR, 'db.json');

/**
 * Full database object, stored in memory.
 * Structure:
 * {
 *   "users": {
 *     "<senderId>": {
 *       "todo": [],
 *       "pengeluaran": []
 *     }
 *   }
 * }
 */
let fullDB = null;

/**
 * Default structure for a new user.
 * @returns {object}
 */
function createUserData() {
  return {
    todo: [],
    pengeluaran: [],
    chatHistory: [],
  };
}

/**
 * Load database from JSON file.
 * Handles migration from old flat format to multi-user format.
 */
function loadDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fullDB = { users: {} };
      saveDB();
      console.log('[DB] File db.json baru dibuat.');
      return;
    }

    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(raw);

    // Migration: old flat format -> multi-user format
    if (!data.users) {
      console.log('[DB] Migrasi dari format lama ke multi-user...');
      const legacyData = {
        todo: data.todo || [],
        pengeluaran: data.pengeluaran || [],
      };

      fullDB = { users: {} };

      // Keep legacy data under a special key if it has content
      if (legacyData.todo.length > 0 || legacyData.pengeluaran.length > 0) {
        fullDB.users['_legacy'] = legacyData;
        console.log('[DB] Data lama disimpan di user "_legacy".');
      }

      saveDB();
      console.log('[DB] Migrasi selesai.');
      return;
    }

    fullDB = data;
  } catch (err) {
    console.error('[DB] Gagal membaca db.json, menggunakan default:', err.message);
    fullDB = { users: {} };
  }
}

/**
 * Get user-specific data by sender ID.
 * Creates a new entry if the user doesn't exist yet.
 * @param {string} senderId - WhatsApp sender JID
 * @returns {object} User data with todo and pengeluaran arrays
 */
function getUserData(senderId) {
  if (!fullDB.users[senderId]) {
    fullDB.users[senderId] = createUserData();
  }
  return fullDB.users[senderId];
}

/**
 * Save the full database to JSON file.
 * Called without arguments — always saves the in-memory fullDB.
 */
function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(fullDB, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Gagal menyimpan db.json:', err.message);
  }
}

/**
 * Get total user count.
 * @returns {number}
 */
function getUserCount() {
  return Object.keys(fullDB.users).length;
}

/**
 * Get AI chat history for a user (max last N turns).
 * @param {string} senderId
 * @param {number} maxTurns
 * @returns {Array<{role: string, parts: {text: string}[]}>}
 */
function getChatHistory(senderId, maxTurns = 20) {
  const user = getUserData(senderId);
  if (!user.chatHistory) user.chatHistory = [];
  // Return last maxTurns entries (each turn = 1 message)
  return user.chatHistory.slice(-maxTurns);
}

/**
 * Append a message to AI chat history for a user and auto-save.
 * @param {string} senderId
 * @param {string} role - 'user' or 'model'
 * @param {string} text
 */
function appendChatHistory(senderId, role, text) {
  const user = getUserData(senderId);
  if (!user.chatHistory) user.chatHistory = [];
  user.chatHistory.push({ role, parts: [{ text }] });
  // Keep last 40 messages max to avoid bloat
  if (user.chatHistory.length > 40) {
    user.chatHistory = user.chatHistory.slice(-40);
  }
  saveDB();
}

function clearChatHistory(senderId) {
  const user = getUserData(senderId);
  user.chatHistory = [];
  saveDB();
}

module.exports = { loadDB, getUserData, saveDB, getUserCount, getChatHistory, appendChatHistory, clearChatHistory };
