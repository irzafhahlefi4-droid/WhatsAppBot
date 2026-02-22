/**
 * Admin Panel — Express.js web dashboard for monitoring bot data.
 * Provides overview of all users, their todos and expenses.
 */

const express = require('express');
const { loadDB, getUserCount } = require('./database');
const path = require('path');
const fs = require('fs');

const ADMIN_PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..');
const DB_PATH = path.join(DATA_DIR, 'db.json');

/**
 * Start the admin panel server.
 */
function startAdmin() {
  const app = express();

  // --- API Endpoints ---

  app.get('/api/stats', (req, res) => {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const users = db.users || {};
    const userIds = Object.keys(users).filter(k => k !== '_legacy');

    let totalTodos = 0, totalExpenses = 0, totalAmount = 0;
    userIds.forEach(id => {
      totalTodos += (users[id].todo || []).length;
      totalExpenses += (users[id].pengeluaran || []).length;
      totalAmount += (users[id].pengeluaran || []).reduce((s, e) => s + e.nominal, 0);
    });

    res.json({
      totalUsers: userIds.length,
      totalTodos,
      totalExpenses,
      totalAmount,
      users: userIds.map(id => {
        const u = users[id];
        const expTotal = (u.pengeluaran || []).reduce((s, e) => s + e.nominal, 0);
        return {
          id,
          todoCount: (u.todo || []).length,
          expenseCount: (u.pengeluaran || []).length,
          expenseTotal: expTotal,
        };
      }),
    });
  });

  app.get('/api/user/:id', (req, res) => {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const userData = db.users?.[req.params.id];
    if (!userData) return res.status(404).json({ error: 'User not found' });
    res.json({ id: req.params.id, ...userData });
  });

  // --- Admin Page ---

  app.get('/', (req, res) => {
    res.send(getAdminHTML());
  });

  app.listen(ADMIN_PORT, () => {
    console.log(`[ADMIN] Panel aktif di http://localhost:${ADMIN_PORT}`);
  });
}

/**
 * Generate the admin panel HTML.
 */
function getAdminHTML() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel — WhatsApp Bot</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0f1117;
      color: #e4e4e7;
      min-height: 100vh;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #1a1b23 0%, #252630 100%);
      border-bottom: 1px solid #2a2b35;
      padding: 20px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 600;
      color: #fff;
    }
    .header .status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #71717a;
    }
    .header .status .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .container { max-width: 1200px; margin: 0 auto; padding: 24px; }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: #1a1b23;
      border: 1px solid #2a2b35;
      border-radius: 12px;
      padding: 20px;
      transition: border-color 0.2s;
    }
    .stat-card:hover { border-color: #3b3c4a; }
    .stat-card .label {
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #71717a;
      margin-bottom: 8px;
    }
    .stat-card .value {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
    }
    .stat-card .value.green { color: #22c55e; }
    .stat-card .value.blue { color: #3b82f6; }
    .stat-card .value.purple { color: #a855f7; }
    .stat-card .value.orange { color: #f59e0b; }

    /* Section */
    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #fff;
    }

    /* Users Table */
    .table-wrap {
      background: #1a1b23;
      border: 1px solid #2a2b35;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 32px;
    }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      text-align: left;
      padding: 14px 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #71717a;
      background: #15161e;
      border-bottom: 1px solid #2a2b35;
    }
    tbody td {
      padding: 14px 20px;
      font-size: 14px;
      border-bottom: 1px solid #1f2029;
    }
    tbody tr { cursor: pointer; transition: background 0.15s; }
    tbody tr:hover { background: #1f2029; }
    tbody tr:last-child td { border-bottom: none; }
    .user-id {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #a1a1aa;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-blue { background: #1e3a5f; color: #60a5fa; }
    .badge-green { background: #14532d; color: #4ade80; }

    /* Detail Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 100;
      justify-content: center;
      align-items: flex-start;
      padding: 60px 20px;
      overflow-y: auto;
    }
    .modal-overlay.active { display: flex; }
    .modal {
      background: #1a1b23;
      border: 1px solid #2a2b35;
      border-radius: 16px;
      width: 100%;
      max-width: 700px;
      padding: 28px;
      animation: slideUp 0.2s ease;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .modal-header h2 { font-size: 18px; font-weight: 600; }
    .modal-close {
      background: #2a2b35;
      border: none;
      color: #e4e4e7;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .modal-close:hover { background: #3b3c4a; }
    .modal-section { margin-bottom: 24px; }
    .modal-section h3 {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #71717a;
      margin-bottom: 12px;
    }
    .item-list { list-style: none; }
    .item-list li {
      padding: 10px 14px;
      background: #15161e;
      border-radius: 8px;
      margin-bottom: 6px;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .item-list li .amount {
      font-weight: 600;
      color: #f59e0b;
    }
    .item-list li .time {
      font-size: 11px;
      color: #71717a;
    }
    .empty-msg {
      color: #52525b;
      font-style: italic;
      font-size: 13px;
      text-align: center;
      padding: 20px;
    }

    /* Refresh */
    .refresh-btn {
      background: #2a2b35;
      border: 1px solid #3b3c4a;
      color: #e4e4e7;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s;
      font-family: 'Inter', sans-serif;
    }
    .refresh-btn:hover { background: #3b3c4a; border-color: #52525b; }

    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>WhatsApp Bot — Admin Panel</h1>
    <div class="status">
      <div class="dot"></div>
      Bot Online
    </div>
  </div>

  <div class="container">
    <div class="stats-grid" id="stats"></div>

    <div class="top-bar">
      <h2 class="section-title">Users</h2>
      <button class="refresh-btn" onclick="loadData()">Refresh</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Todo</th>
            <th>Pengeluaran</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody id="userTable"></tbody>
      </table>
    </div>
  </div>

  <div class="modal-overlay" id="modal" onclick="if(event.target===this)closeModal()">
    <div class="modal">
      <div class="modal-header">
        <h2 id="modalTitle">User Detail</h2>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div id="modalContent"></div>
    </div>
  </div>

  <script>
    async function loadData() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();

        document.getElementById('stats').innerHTML = \`
          <div class="stat-card"><div class="label">Total Users</div><div class="value blue">\${data.totalUsers}</div></div>
          <div class="stat-card"><div class="label">Total Todo</div><div class="value purple">\${data.totalTodos}</div></div>
          <div class="stat-card"><div class="label">Total Transaksi</div><div class="value green">\${data.totalExpenses}</div></div>
          <div class="stat-card"><div class="label">Total Pengeluaran</div><div class="value orange">Rp \${data.totalAmount.toLocaleString('id-ID')}</div></div>
        \`;

        const tbody = document.getElementById('userTable');
        if (data.users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#52525b;padding:40px">Belum ada user</td></tr>';
          return;
        }

        tbody.innerHTML = data.users.map(u => \`
          <tr onclick="showUser('\${u.id}')">
            <td><span class="user-id">\${u.id}</span></td>
            <td><span class="badge badge-blue">\${u.todoCount} tugas</span></td>
            <td><span class="badge badge-green">\${u.expenseCount} transaksi</span></td>
            <td>Rp \${u.expenseTotal.toLocaleString('id-ID')}</td>
          </tr>
        \`).join('');
      } catch (e) {
        console.error(e);
      }
    }

    async function showUser(id) {
      try {
        const res = await fetch('/api/user/' + encodeURIComponent(id));
        const data = await res.json();

        document.getElementById('modalTitle').textContent = id;

        let html = '';

        // Todos
        html += '<div class="modal-section"><h3>Todo List (' + (data.todo || []).length + ')</h3>';
        if (data.todo && data.todo.length > 0) {
          html += '<ul class="item-list">' + data.todo.map((t, i) =>
            '<li><span>' + (i+1) + '. ' + t + '</span></li>'
          ).join('') + '</ul>';
        } else {
          html += '<div class="empty-msg">Tidak ada tugas</div>';
        }
        html += '</div>';

        // Expenses
        html += '<div class="modal-section"><h3>Pengeluaran (' + (data.pengeluaran || []).length + ')</h3>';
        if (data.pengeluaran && data.pengeluaran.length > 0) {
          const total = data.pengeluaran.reduce((s, e) => s + e.nominal, 0);
          html += '<ul class="item-list">' + data.pengeluaran.map(e =>
            '<li><div><span>' + e.keterangan + '</span><br><span class="time">' + e.waktu + '</span></div><span class="amount">Rp ' + e.nominal.toLocaleString('id-ID') + '</span></li>'
          ).join('') + '</ul>';
          html += '<div style="text-align:right;padding:10px 14px;font-weight:600;color:#f59e0b">Total: Rp ' + total.toLocaleString('id-ID') + '</div>';
        } else {
          html += '<div class="empty-msg">Tidak ada pengeluaran</div>';
        }
        html += '</div>';

        document.getElementById('modalContent').innerHTML = html;
        document.getElementById('modal').classList.add('active');
      } catch (e) {
        console.error(e);
      }
    }

    function closeModal() {
      document.getElementById('modal').classList.remove('active');
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    loadData();
    setInterval(loadData, 10000);
  </script>
</body>
</html>`;
}

module.exports = { startAdmin };
