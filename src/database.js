const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db.json');

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

module.exports = { loadDB, getUserData, saveDB, getUserCount };
