/**
 * Todo List commands: todo, todo [isi], done [nomor]
 */

const { saveDB } = require('../database');

/**
 * Handle "todo" command — show all tasks.
 * @param {object} db - Database object
 * @returns {string}
 */
function handleTodoList(db) {
    if (!db.todo || db.todo.length === 0) {
        return '*Daftar Tugas*\n\nBelum ada tugas.\nTambahkan dengan: todo [isi tugas]';
    }

    let list = '*Daftar Tugas*\n----------------------------\n\n';

    db.todo.forEach((item, index) => {
        list += `  ${index + 1}. ${item}\n`;
    });

    list += `\n----------------------------`;
    list += `\nTotal: ${db.todo.length} tugas`;
    list += `\nKetik "done [nomor]" untuk menghapus tugas.`;

    return list;
}

/**
 * Handle "todo [isi]" command — add a new task.
 * @param {object} db - Database object
 * @param {string} task - The task description
 * @returns {string}
 */
function handleTodoAdd(db, task) {
    if (!task || task.trim().length === 0) {
        return 'Format salah.\nContoh: todo beli susu';
    }

    db.todo.push(task.trim());
    saveDB();

    return `Tugas berhasil ditambahkan.\n\n"${task.trim()}"\n\nTotal tugas saat ini: ${db.todo.length}`;
}

/**
 * Handle "done [nomor]" command — remove a task by number.
 * @param {object} db - Database object
 * @param {string} indexStr - The 1-based index string
 * @returns {string}
 */
function handleTodoDone(db, indexStr) {
    if (!indexStr || indexStr.trim().length === 0) {
        return 'Masukkan nomor tugas yang ingin dihapus.\nContoh: done 1';
    }

    const index = parseInt(indexStr.trim(), 10);

    if (isNaN(index)) {
        return 'Nomor tugas harus berupa angka.\nContoh: done 1';
    }

    if (index < 1 || index > db.todo.length) {
        return `Nomor tugas tidak valid.\nTugas yang tersedia: 1 - ${db.todo.length}`;
    }

    const removed = db.todo.splice(index - 1, 1)[0];
    saveDB();

    return `Tugas dihapus: "${removed}"\n\nSisa tugas: ${db.todo.length}`;
}

/**
 * Handle "reset todo" command — clear all tasks.
 * @param {object} db - Database object
 * @returns {string}
 */
function handleResetTodo(db) {
    const count = db.todo.length;

    if (count === 0) {
        return 'Tidak ada data tugas untuk direset.';
    }

    db.todo = [];
    saveDB();

    return `*Data Todo Direset*\n\n${count} tugas telah dihapus.\nDaftar tugas sekarang kosong.`;
}

module.exports = { handleTodoList, handleTodoAdd, handleTodoDone, handleResetTodo };
