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
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Outfit', sans-serif;
      background: linear-gradient(135deg, #09090b 0%, #171723 100%);
      color: #fafafa;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Ambient Background Glow */
    body::before {
      content: '';
      position: absolute;
      top: -100px;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      height: 400px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%);
      z-index: -1;
      pointer-events: none;
    }

    /* Header */
    .header {
      padding: 24px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(24, 24, 27, 0.4);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      background: linear-gradient(90deg, #fff, #a1a1aa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }
    .header .status {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 500;
      color: #a1a1aa;
      background: rgba(255, 255, 255, 0.03);
      padding: 8px 16px;
      border-radius: 30px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .header .status .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.6; }
    }

    .container { max-width: 1100px; margin: 0 auto; padding: 40px 24px; width: 100%; flex: 1; }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: rgba(24, 24, 27, 0.5);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      padding: 24px;
      transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    .stat-card::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .stat-card:hover { 
      transform: translateY(-4px); 
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
      border-color: rgba(255, 255, 255, 0.1);
    }
    .stat-card:hover::after { opacity: 1; }
    .stat-card .label {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #71717a;
      margin-bottom: 12px;
    }
    .stat-card .value {
      font-size: 32px;
      font-weight: 700;
      color: #fff;
    }
    .stat-card .value.blue { background: linear-gradient(90deg, #60a5fa, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-card .value.purple { background: linear-gradient(90deg, #c084fc, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-card .value.green { background: linear-gradient(90deg, #34d399, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .stat-card .value.orange { background: linear-gradient(90deg, #fbbf24, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

    /* Controls */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .section-title::before {
      content: '';
      display: block;
      width: 4px;
      height: 20px;
      background: #6366f1;
      border-radius: 4px;
    }
    .refresh-btn {
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #818cf8;
      padding: 10px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .refresh-btn:hover { 
      background: rgba(99, 102, 241, 0.2); 
      transform: translateY(-2px);
    }
    .refresh-btn:active { transform: translateY(0); }

    /* Users Table */
    .table-wrap {
      background: rgba(24, 24, 27, 0.4);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      text-align: left;
      padding: 18px 24px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #a1a1aa;
      background: rgba(0, 0, 0, 0.2);
    }
    tbody td {
      padding: 18px 24px;
      font-size: 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }
    tbody tr { 
      cursor: pointer; 
      transition: background 0.2s, transform 0.2s; 
    }
    tbody tr:hover { 
      background: rgba(255, 255, 255, 0.03); 
    }
    tbody tr:last-child td { border-bottom: none; }
    
    .user-id {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #d4d4d8;
      background: rgba(255, 255, 255, 0.05);
      padding: 4px 8px;
      border-radius: 6px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 30px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .badge-blue { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }
    .badge-green { background: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
    .money-amount {
      font-weight: 600;
      color: #fbbf24;
    }

    /* Detail Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 100;
      justify-content: center;
      align-items: center;
      padding: 20px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .modal-overlay.active { 
      display: flex; 
      opacity: 1;
    }
    .modal {
      background: #18181b;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      width: 100%;
      max-width: 600px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      transform: scale(0.95) translateY(20px);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .modal-overlay.active .modal {
      transform: scale(1) translateY(0);
    }
    .modal-header {
      padding: 24px 30px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h2 { font-size: 20px; font-weight: 600; color: #fff; }
    .modal-close {
      background: rgba(255,255,255,0.05);
      border: none;
      color: #a1a1aa;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .modal-close:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; transform: rotate(90deg); }
    
    .modal-body {
      padding: 30px;
      overflow-y: auto;
    }
    .modal-section { margin-bottom: 30px; }
    .modal-section:last-child { margin-bottom: 0; }
    .modal-section h3 {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #a1a1aa;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .item-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .item-list li {
      padding: 14px 18px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.04);
      border-radius: 12px;
      font-size: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: transform 0.2s;
    }
    .item-list li:hover { transform: translateX(4px); background: rgba(255,255,255,0.04); }
    
    .item-list li .info { display: flex; flex-direction: column; gap: 4px; }
    .item-list li .title { font-weight: 500; color: #e4e4e7; }
    .item-list li .time { font-size: 12px; color: #71717a; }
    
    .item-list li .amount { font-weight: 600; color: #fbbf24; background: rgba(251, 191, 36, 0.1); padding: 4px 10px; border-radius: 8px; }
    
    .modal-total {
        margin-top: 16px;
        padding: 16px;
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%);
        border: 1px solid rgba(245, 158, 11, 0.2);
        border-radius: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .modal-total span:first-child { font-weight: 600; color: #d4d4d8; }
    .modal-total span:last-child { font-weight: 700; color: #fbbf24; font-size: 18px; }

    .empty-msg {
      color: #71717a;
      background: rgba(0,0,0,0.2);
      border: 1px dashed rgba(255,255,255,0.1);
      border-radius: 12px;
      text-align: center;
      padding: 30px;
      font-size: 14px;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
  </style>
</head>
<body>
  <div class="header">
    <h1>WhatsApp Bot</h1>
    <div class="status">
      <div class="dot"></div>
      Bot Online
    </div>
  </div>

  <div class="container">
    <div class="stats-grid" id="stats">
        <!-- Kept empty, populated by JS -->
    </div>

    <div class="top-bar">
      <h2 class="section-title">Semua User</h2>
      <button class="refresh-btn" onclick="loadData()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-10.09l5.67-5.67"/></svg>
        Refresh Data
      </button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>User ID (Sender)</th>
            <th>Total Tugas (Todo)</th>
            <th>Transaksi</th>
            <th>Total Pengeluaran</th>
          </tr>
        </thead>
        <tbody id="userTable"></tbody>
      </table>
    </div>
  </div>

  <div class="modal-overlay" id="modal" onclick="if(event.target===this)closeModal()">
    <div class="modal">
      <div class="modal-header">
        <h2 id="modalTitle">Detail Pengguna</h2>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body" id="modalContent"></div>
    </div>
  </div>

  <script>
    async function loadData() {
      try {
        const btn = document.querySelector('.refresh-btn svg');
        btn.style.animation = 'pulse 1s';
        setTimeout(() => btn.style.animation = '', 1000);

        const res = await fetch('/api/stats');
        const data = await res.json();

        document.getElementById('stats').innerHTML = \`
          <div class="stat-card">
            <div class="label">Total Pengguna Aktif</div>
            <div class="value blue">\${data.totalUsers}</div>
          </div>
          <div class="stat-card">
            <div class="label">Total Tugas Tersimpan</div>
            <div class="value purple">\${data.totalTodos}</div>
          </div>
          <div class="stat-card">
            <div class="label">Total Transaksi Dicatat</div>
            <div class="value green">\${data.totalExpenses}</div>
          </div>
          <div class="stat-card">
            <div class="label">Akumulasi Pengeluaran</div>
            <div class="value orange">Rp \${data.totalAmount.toLocaleString('id-ID')}</div>
          </div>
        \`;

        const tbody = document.getElementById('userTable');
        if (data.users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#71717a;padding:60px">Belum ada user yang terdaftar di database.</td></tr>';
          return;
        }

        tbody.innerHTML = data.users.map(u => \`
          <tr onclick="showUser('\${u.id}')">
            <td><span class="user-id">\${u.id}</span></td>
            <td><span class="badge badge-blue">\${u.todoCount} Tugas</span></td>
            <td><span class="badge badge-green">\${u.expenseCount} Item</span></td>
            <td class="money-amount">Rp \${u.expenseTotal.toLocaleString('id-ID')}</td>
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

        document.getElementById('modalTitle').innerHTML = \`Detail: <span style="color:#a1a1aa; font-size:16px;">\${id}</span>\`;

        let html = '';

        // Todos
        html += '<div class="modal-section"><h3>Daftar Tugas (' + (data.todo || []).length + ')</h3>';
        if (data.todo && data.todo.length > 0) {
          html += '<ul class="item-list">' + data.todo.map((t, i) =>
            '<li><span class="title">' + (i+1) + '. ' + t + '</span></li>'
          ).join('') + '</ul>';
        } else {
          html += '<div class="empty-msg">Pengguna ini tidak memiliki daftar tugas.</div>';
        }
        html += '</div>';

        // Expenses
        html += '<div class="modal-section"><h3>Riwayat Pengeluaran (' + (data.pengeluaran || []).length + ')</h3>';
        if (data.pengeluaran && data.pengeluaran.length > 0) {
          const total = data.pengeluaran.reduce((s, e) => s + e.nominal, 0);
          html += '<ul class="item-list">' + data.pengeluaran.map(e =>
            '<li><div class="info"><span class="title">' + e.keterangan + '</span><span class="time">' + e.waktu + '</span></div><span class="amount">Rp ' + e.nominal.toLocaleString('id-ID') + '</span></li>'
          ).join('') + '</ul>';
          html += '<div class="modal-total"><span>Total Pengeluaran</span><span>Rp ' + total.toLocaleString('id-ID') + '</span></div>';
        } else {
          html += '<div class="empty-msg">Pengguna ini belum mencatat pengeluaran.</div>';
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
