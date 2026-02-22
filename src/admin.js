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
    :root {
      --bg-body: #f8fafc;
      --bg-card: #ffffff;
      --bg-header: rgba(255, 255, 255, 0.85);
      
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border-color: #e2e8f0;
      
      --brand-primary: #3b82f6;
      --brand-hover: #2563eb;
      
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Outfit', sans-serif;
      background: var(--bg-body);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Decorative Background Element */
    body::before {
      content: '';
      position: absolute;
      top: -150px;
      right: -100px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(255,255,255,0) 70%);
      z-index: -1;
      pointer-events: none;
    }

    /* Header */
    .header {
      padding: 20px 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-header);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-main);
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header h1::before {
      content: '';
      display: inline-block;
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 8px;
    }
    .header .status {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 600;
      color: #047857;
      background: #d1fae5;
      padding: 8px 16px;
      border-radius: 30px;
      border: 1px solid #10b981;
    }
    .header .status .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.6; }
    }

    .container { max-width: 1100px; margin: 0 auto; padding: 48px 24px; width: 100%; flex: 1; }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
      margin-bottom: 48px;
    }
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 28px 24px;
      box-shadow: var(--shadow-sm);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 4px; height: 100%;
      background: var(--brand-primary);
      border-radius: 4px 0 0 4px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .stat-card:hover { 
      transform: translateY(-4px); 
      box-shadow: var(--shadow-lg);
    }
    .stat-card:hover::before { opacity: 1; }
    
    .stat-card .icon-wrap {
      width: 40px; height: 40px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 16px;
    }
    .ic-blue { background: #dbeafe; color: #2563eb; }
    .ic-purple { background: #f3e8ff; color: #9333ea; }
    .ic-green { background: #d1fae5; color: #059669; }
    .ic-orange { background: #fef3c7; color: #d97706; }

    .stat-card .label {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .stat-card .value {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-main);
    }

    /* Controls */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-main);
    }
    .refresh-btn {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      padding: 10px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s;
      font-family: inherit;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .refresh-btn:hover { 
      background: var(--bg-body); 
      border-color: #cbd5e1;
    }
    .refresh-btn:active { transform: translateY(2px); box-shadow: none; }

    /* Users Table */
    .table-wrap {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: var(--shadow-md);
    }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      text-align: left;
      padding: 18px 24px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      background: #f1f5f9;
      border-bottom: 1px solid var(--border-color);
    }
    tbody td {
      padding: 20px 24px;
      font-size: 15px;
      font-weight: 500;
      border-bottom: 1px solid var(--border-color);
    }
    tbody tr { 
      cursor: pointer; 
      transition: background 0.2s; 
    }
    tbody tr:hover { 
      background: #f8fafc; 
    }
    tbody tr:last-child td { border-bottom: none; }
    
    .user-id {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      font-weight: 600;
      color: var(--brand-hover);
      background: #eff6ff;
      padding: 6px 10px;
      border-radius: 8px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 6px 14px;
      border-radius: 30px;
      font-size: 13px;
      font-weight: 600;
    }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-green { background: #d1fae5; color: #065f46; }
    .money-amount {
      font-weight: 700;
      color: var(--text-main);
    }

    /* Detail Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      z-index: 100;
      justify-content: center;
      align-items: center;
      padding: 20px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .modal-overlay.active { display: flex; opacity: 1; }
    
    .modal {
      background: var(--bg-card);
      border-radius: 24px;
      width: 100%;
      max-width: 600px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      transform: scale(0.95) translateY(20px);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .modal-overlay.active .modal { transform: scale(1) translateY(0); }
    
    .modal-header {
      padding: 24px 32px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border-radius: 24px 24px 0 0;
    }
    .modal-header h2 { font-size: 20px; font-weight: 700; color: var(--text-main); }
    .modal-close {
      background: #e2e8f0;
      border: none;
      color: var(--text-muted);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .modal-close:hover { background: #fee2e2; color: #ef4444; }
    
    .modal-body {
      padding: 32px;
      overflow-y: auto;
    }
    .modal-section { margin-bottom: 32px; }
    .modal-section:last-child { margin-bottom: 0; }
    .modal-section h3 {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }
    
    .item-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
    .item-list li {
      padding: 16px;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      font-size: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: transform 0.2s;
    }
    .item-list li:hover { transform: translateX(4px); border-color: #cbd5e1; }
    
    .item-list li .info { display: flex; flex-direction: column; gap: 4px; }
    .item-list li .title { font-weight: 600; color: var(--text-main); }
    .item-list li .time { font-size: 12px; font-weight: 500; color: var(--text-muted); }
    
    .item-list li .amount { font-weight: 700; color: #047857; }
    
    .modal-total {
        margin-top: 16px;
        padding: 20px;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .modal-total span:first-child { font-weight: 600; color: #166534; }
    .modal-total span:last-child { font-weight: 800; color: #166534; font-size: 20px; }

    .empty-msg {
      color: var(--text-muted);
      background: #f1f5f9;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      text-align: center;
      padding: 32px;
      font-size: 14px;
      font-weight: 500;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <h1>WhatsApp Bot</h1>
    <div class="status">
      <div class="dot"></div>
      Bot Aktif
    </div>
  </div>

  <div class="container">
    <div class="stats-grid" id="stats">
        <!-- Kept empty, populated by JS -->
    </div>

    <div class="top-bar">
      <h2 class="section-title">Data Pengguna</h2>
      <button class="refresh-btn" onclick="loadData()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-10.09l5.67-5.67"/></svg>
        Segarkan Data
      </button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nomor WhatsApp</th>
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
        <h2 id="modalTitle">Info Pengguna</h2>
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
            <div class="icon-wrap ic-blue"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
            <div class="label">Total Pengguna</div>
            <div class="value">\${data.totalUsers}</div>
          </div>
          <div class="stat-card">
            <div class="icon-wrap ic-purple"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div>
            <div class="label">Tugas Tersimpan</div>
            <div class="value">\${data.totalTodos}</div>
          </div>
          <div class="stat-card">
            <div class="icon-wrap ic-green"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg></div>
            <div class="label">Total Transaksi</div>
            <div class="value">\${data.totalExpenses}</div>
          </div>
          <div class="stat-card">
            <div class="icon-wrap ic-orange"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
            <div class="label">Uang Keluar</div>
            <div class="value">Rp \${data.totalAmount.toLocaleString('id-ID')}</div>
          </div>
        \`;

        const tbody = document.getElementById('userTable');
        if (data.users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:60px">Belum ada user yang terdaftar di database.</td></tr>';
          return;
        }

        tbody.innerHTML = data.users.map(u => \`
          <tr onclick="showUser('\${u.id}')">
            <td><span class="user-id">\${u.id}</span></td>
            <td><span class="badge badge-blue">\${u.todoCount} Tugas</span></td>
            <td><span class="badge badge-green">\${u.expenseCount} Transaksi</span></td>
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

        document.getElementById('modalTitle').innerHTML = \`\${id}\`;

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
