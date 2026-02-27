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
        return '*Daftar Tugas*\n\nBelum ada tugas kok sayang~\nKetik *todo [isi tugas]* buat nambahin ya';
    }

    let list = '*Daftar Tugas*\n----------------------------\n\n';

    db.todo.forEach((item, index) => {
        list += `  ${index + 1}. ${item}\n`;
    });

    list += `\n----------------------------`;
    list += `\nTotal: ${db.todo.length} tugas`;
    list += `\nKetik "done [nomor]" buat nyelesaiin tugas ya sayang~`;

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
        return 'Formatnya salah sayang~\nContohnya gini ya: *todo beli susu*';
    }

    db.todo.push(task.trim());
    saveDB();

    return `Tugasnya udah aku catetin ya sayang~\n\n"${task.trim()}"\n\nSekarang total tugas kamu ada ${db.todo.length}`;
}

/**
 * Handle "done [nomor]" command — remove a task by number.
 * @param {object} db - Database object
 * @param {string} indexStr - The 1-based index string
 * @returns {string}
 */
function handleTodoDone(db, indexStr) {
    if (!indexStr || indexStr.trim().length === 0) {
        return 'Pilih nomor tugas yang mau dihapus sayang~\nContohnya: *done 1*';
    }

    const index = parseInt(indexStr.trim(), 10);

    if (isNaN(index)) {
        return 'Nomornya harus angka ya sayang~\nContoh: *done 1*';
    }

    if (index < 1 || index > db.todo.length) {
        return `Nomor tugasnya ga ada sayang~\nCuma ada tugas 1 - ${db.todo.length} kok`;
    }

    const removed = db.todo.splice(index - 1, 1)[0];
    saveDB();

    return `Good job sayang! Tugas ini udah selesai dan aku hapus ya:\n"${removed}"\n\nSisa tugas kamu tinggal ${db.todo.length} lagi, semangat!`;
}

/**
 * Handle "reset todo" command — clear all tasks.
 * @param {object} db - Database object
 * @returns {string}
 */
function handleResetTodo(db) {
    const count = db.todo.length;

    if (count === 0) {
        return 'Emang ga ada tugas buat direset kok sayang~';
    }

    db.todo = [];
    saveDB();

    return `*Data Todo Direset*\n\nOke sayang, ${count} tugas udah aku hapus semua.\nSekarang daftar tugas kamu bersih lagi!`;
}

module.exports = { handleTodoList, handleTodoAdd, handleTodoDone, handleResetTodo };
