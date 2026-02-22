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
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #ffffff;
      --text-main: #111827;
      --text-muted: #6b7280;
      --accent: #111827;
      --accent-hover: #374151;
      --border: #f3f4f6;
      --card-bg: #ffffff;
      --shadow: 0 10px 40px -10px rgba(0,0,0,0.04);
      --radius: 24px;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg-color);
      color: var(--text-main);
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow-x: hidden;
    }

    /* Subtle background blur / gradient from the image */
    body::before {
      content: '';
      position: absolute;
      top: -10%; right: -10%;
      width: 70vw; height: 70vw;
      background: radial-gradient(circle, rgba(245, 235, 245, 0.8) 0%, rgba(255,255,255,0) 70%);
      z-index: -1;
      pointer-events: none;
    }

    .nav {
      padding: 30px 5%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: transparent;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    .nav-logo {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-main);
    }

    .nav-status {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status-dot {
      width: 8px; height: 8px;
      background-color: #10b981;
      border-radius: 50%;
    }

    .nav-buttons {
      display: flex;
      gap: 12px;
    }

    .btn-pill {
      background: transparent;
      color: var(--text-main);
      border: 1px solid var(--border);
      padding: 10px 24px;
      border-radius: 100px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      text-decoration: none;
    }
    
    .btn-pill:hover {
      border-color: #d1d5db;
      background: #f9fafb;
    }

    .btn-pill.dark {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .btn-pill.dark:hover {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
    }

    .main-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 5%;
      width: 100%;
      flex: 1;
    }

    .hero-section {
      margin-bottom: 64px;
      text-align: left;
      max-width: 700px;
    }
    
    .hero-title {
      font-size: 58px;
      font-weight: 800;
      letter-spacing: -1.5px;
      line-height: 1.1;
      margin-bottom: 24px;
    }

    .hero-subtitle {
      font-size: 18px;
      color: var(--text-muted);
      max-width: 500px;
      line-height: 1.6;
      font-weight: 400;
      margin-bottom: 32px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
      margin-bottom: 64px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: var(--radius);
      padding: 32px;
      box-shadow: var(--shadow);
      border: 1px solid rgba(255, 255, 255, 0.8);
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);
      background: rgba(255, 255, 255, 0.9);
    }

    .stat-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .stat-value {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: -1px;
      color: var(--text-main);
    }

    .table-section {
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border: 1px solid rgba(255, 255, 255, 0.8);
      overflow: hidden;
      padding: 40px;
    }

    .table-header-wrap {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .table-title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 16px 8px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      border-bottom: 2px solid var(--border);
    }

    td {
      padding: 24px 8px;
      font-size: 15px;
      font-weight: 500;
      border-bottom: 1px solid var(--border);
    }

    tr {
      cursor: pointer;
      transition: background 0.2s;
    }

    tr:hover td {
      background-color: rgba(249, 250, 251, 0.5);
    }

    tr:last-child td {
      border-bottom: none;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 6px 14px;
      border-radius: 100px;
      font-size: 13px;
      font-weight: 600;
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    .money {
      font-weight: 700;
      color: var(--text-main);
    }

    /* Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .modal-overlay.active {
      display: flex;
      opacity: 1;
    }

    .modal {
      background: #fff;
      border-radius: 32px;
      width: 100%;
      max-width: 500px;
      max-height: 85vh;
      box-shadow: 0 40px 80px -20px rgba(0,0,0,0.15);
      border: 1px solid rgba(255, 255, 255, 0.5);
      display: flex;
      flex-direction: column;
      transform: translateY(20px) scale(0.98);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-overlay.active .modal {
      transform: translateY(0) scale(1);
    }

    .modal-header {
      padding: 32px 32px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .close-btn {
      background: #f3f4f6;
      border: none;
      width: 36px; height: 36px;
      border-radius: 50%;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; color: var(--text-muted);
      transition: background 0.2s;
    }

    .close-btn:hover {
      background: #e5e7eb;
      color: #111;
    }

    .modal-body {
      padding: 0 32px 32px;
      overflow-y: auto;
    }

    .section-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      margin-bottom: 16px;
      margin-top: 24px;
    }
    
    .section-label:first-child { margin-top: 0; }

    .list-item {
      padding: 16px;
      background: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 16px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .list-item-title { font-weight: 600; font-size: 14px; color: var(--text-main); }
    .list-item-time { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    .list-item-amount { font-weight: 700; font-size: 14px; }

    .total-box {
      margin-top: 16px;
      padding: 24px;
      background: var(--accent);
      color: white;
      border-radius: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 20px -5px rgba(17, 24, 39, 0.3);
    }

    .total-box span:first-child { font-size: 14px; font-weight: 500; opacity: 0.8; }
    .total-box span:last-child { font-size: 24px; font-weight: 700; }

    .empty-state {
      padding: 24px;
      text-align: center;
      background: #f9fafb;
      border-radius: 16px;
      font-size: 14px;
      color: var(--text-muted);
      font-weight: 500;
      border: 1px dashed #e5e7eb;
    }

    @media (max-width: 768px) {
      .hero-title { font-size: 40px; }
      .nav { flex-direction: column; gap: 20px; }
      .table-section { padding: 24px; }
    }
  </style>
</head>
<body>

  <nav class="nav">
    <div class="nav-logo">WHATSAPP BOT.™</div>
    <div class="nav-status">
      <div class="status-dot"></div>
      System Online & Active
    </div>
  </nav>

  <main class="main-container">
    <header class="hero-section">
      <h1 class="hero-title">Effortlessly Organize and Simplify Your Data.</h1>
      <p class="hero-subtitle">Automatically track user activity, monitor expenses, and achieve your goals from one minimalist dashboard.</p>
      
      <div class="nav-buttons">
        <button class="btn-pill dark" onclick="loadData()" id="refreshBtn">Get Live Data</button>
        <button class="btn-pill" onclick="document.querySelector('.table-section').scrollIntoView({behavior: 'smooth'})">Explore Users &rarr;</button>
      </div>
    </header>

    <div class="stats-grid" id="stats">
      <!-- Injected by JS -->
    </div>

    <section class="table-section">
      <div class="table-header-wrap">
        <h2 class="table-title">Our System Users</h2>
      </div>

      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Tasks</th>
              <th>Transactions</th>
              <th>Total Spending</th>
            </tr>
          </thead>
          <tbody id="userTable">
            <!-- Injected by JS -->
          </tbody>
        </table>
      </div>
    </section>
  </main>

  <div class="modal-overlay" id="modal" onclick="if(event.target===this)closeModal()">
    <div class="modal">
      <div class="modal-header">
        <h2 id="modalTitle">User Detail</h2>
        <button class="close-btn" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body" id="modalContent"></div>
    </div>
  </div>

  <script>
    async function loadData() {
      try {
        const btn = document.getElementById('refreshBtn');
        const oldText = btn.innerText;
        btn.innerText = 'Refreshing...';
        setTimeout(() => btn.innerText = oldText, 800);

        const res = await fetch('/api/stats');
        const data = await res.json();

        document.getElementById('stats').innerHTML = \`
          <div class="stat-card">
            <span class="stat-title">Users Active</span>
            <span class="stat-value">\${data.totalUsers}</span>
          </div>
          <div class="stat-card">
            <span class="stat-title">To-Do Active</span>
            <span class="stat-value">\${data.totalTodos}</span>
          </div>
          <div class="stat-card">
            <span class="stat-title">Tracked Expenses</span>
            <span class="stat-value">\${data.totalExpenses}</span>
          </div>
          <div class="stat-card">
            <span class="stat-title">Total Revenue</span>
            <span class="stat-value">Rp \${data.totalAmount.toLocaleString('id-ID')}</span>
          </div>
        \`;

        const tbody = document.getElementById('userTable');
        if (data.users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#6b7280;padding:40px">No active users recorded.</td></tr>';
          return;
        }

        tbody.innerHTML = data.users.map(u => \`
          <tr onclick="showUser('\${u.id}')">
            <td><span style="font-weight:600">\${u.id}</span></td>
            <td><span class="badge">\${u.todoCount} Tasks</span></td>
            <td><span class="badge">\${u.expenseCount} Items</span></td>
            <td class="money">Rp \${u.expenseTotal.toLocaleString('id-ID')}</td>
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

        document.getElementById('modalTitle').innerText = id;

        let html = '';

        // Todos
        html += '<div class="section-label">Task List (' + (data.todo || []).length + ')</div>';
        if (data.todo && data.todo.length > 0) {
          html += '<div style="margin-bottom: 24px;">' + data.todo.map((t, i) =>
            '<div class="list-item"><span class="list-item-title">' + (i+1) + '. ' + t + '</span></div>'
          ).join('') + '</div>';
        } else {
          html += '<div class="empty-state" style="margin-bottom: 24px;">No active tasks found.</div>';
        }

        // Expenses
        html += '<div class="section-label">Recorded Expenses (' + (data.pengeluaran || []).length + ')</div>';
        if (data.pengeluaran && data.pengeluaran.length > 0) {
          const total = data.pengeluaran.reduce((s, e) => s + e.nominal, 0);
          html += '<div>' + data.pengeluaran.map(e =>
            '<div class="list-item"><div><div class="list-item-title">' + e.keterangan + '</div><div class="list-item-time">' + e.waktu + '</div></div><div class="list-item-amount">Rp ' + e.nominal.toLocaleString('id-ID') + '</div></div>'
          ).join('') + '</div>';
          html += '<div class="total-box"><span>Total Spent</span><span>Rp ' + total.toLocaleString('id-ID') + '</span></div>';
        } else {
          html += '<div class="empty-state">No recorded transactions.</div>';
        }

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
