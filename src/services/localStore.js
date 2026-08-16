// ─────────────────────────────────────────────────────────────────────────
// DEMO/LOCAL ENGINE
// ─────────────────────────────────────────────────────────────────────────
// Aplikasi ini didesain agar seluruh komunikasi data melalui satu API service
// (lihat services/api.js) yang meneruskan request ke Google Apps Script.
//
// File ini adalah *pengganti sementara* backend tersebut, dipakai HANYA
// ketika VITE_API_BASE_URL belum dikonfigurasi (mode demo/lokal), supaya
// aplikasi tetap sepenuhnya fungsional untuk dicoba sebelum Apps Script
// di-deploy. Bentuk data & signature function-nya sengaja dibuat identik
// dengan action Apps Script di backend/Code.gs, sehingga saat API URL
// sudah diisi di .env, aplikasi otomatis memakai data sungguhan tanpa
// perubahan kode di halaman manapun.
//
// Data disimpan di localStorage (bukan database sungguhan) — ini bukan
// pengganti Google Sheets, hanya simulasi untuk development/demo.
// ─────────────────────────────────────────────────────────────────────────

import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../utils/constants';

const STORE_KEY = 'financia_demo_db_v1';
const SESSION_KEY = 'financia_session_v1';
const DEMO_USER = {
  id: 'u1',
  name: 'Andi Pratama',
  email: 'demo@financia.app',
  password: 'demo1234', // demo only — real backend hashes passwords server-side
  status: 'active',
};

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function loadDb() {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fall through to seed
    }
  }
  return seedDb();
}

function saveDb(db) {
  localStorage.setItem(STORE_KEY, JSON.stringify(db));
}

function seedDb() {
  const userId = DEMO_USER.id;
  const accounts = [
    { id: 'acc_bca', user_id: userId, name: 'BCA', type: 'bank', initial_balance: 5000000, status: 'active', created_at: iso(-90) },
    { id: 'acc_cash', user_id: userId, name: 'Cash', type: 'cash', initial_balance: 500000, status: 'active', created_at: iso(-90) },
    { id: 'acc_dana', user_id: userId, name: 'DANA', type: 'ewallet', initial_balance: 750000, status: 'active', created_at: iso(-90) },
  ];

  const categories = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({ id: uid('cat'), user_id: userId, name, type: 'expense', status: 'active', created_at: iso(-90) })),
    ...DEFAULT_INCOME_CATEGORIES.map((name) => ({ id: uid('cat'), user_id: userId, name, type: 'income', status: 'active', created_at: iso(-90) })),
  ];

  const transactions = [];
  const expenseCats = ['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Internet', 'Pulsa'];
  const accIds = accounts.map((a) => a.id);
  for (let i = 0; i < 45; i++) {
    const daysAgo = Math.floor(Math.random() * 75);
    const isIncome = Math.random() < 0.18;
    transactions.push({
      id: uid('trx'),
      user_id: userId,
      date: iso(-daysAgo),
      type: isIncome ? 'income' : 'expense',
      category: isIncome ? 'Gaji' : expenseCats[Math.floor(Math.random() * expenseCats.length)],
      subcategory: '',
      account_id: accIds[Math.floor(Math.random() * accIds.length)],
      amount: isIncome ? randAmount(3000000, 9000000) : randAmount(15000, 850000),
      description: isIncome ? 'Pemasukan bulanan' : 'Transaksi harian',
      created_at: iso(-daysAgo),
      updated_at: iso(-daysAgo),
    });
  }
  // Guaranteed salary this month
  transactions.push({
    id: uid('trx'), user_id: userId, date: iso(-3), type: 'income', category: 'Gaji',
    subcategory: '', account_id: 'acc_bca', amount: 8500000, description: 'Gaji bulanan',
    created_at: iso(-3), updated_at: iso(-3),
  });

  const transfers = [
    { id: uid('trf'), user_id: userId, date: iso(-10), from_account: 'acc_bca', to_account: 'acc_dana', amount: 500000, description: 'Top up e-wallet', created_at: iso(-10) },
  ];

  const savings = [
    { id: uid('sav'), user_id: userId, name: 'Laptop Baru', target_amount: 15000000, current_amount: 8500000, target_date: iso(120, true), status: 'Aktif', created_at: iso(-60) },
    { id: uid('sav'), user_id: userId, name: 'Dana Darurat', target_amount: 20000000, current_amount: 20000000, target_date: iso(-5, true), status: 'Tercapai', created_at: iso(-200) },
  ];

  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const budgets = [
    { id: uid('bud'), user_id: userId, month: monthStr, category: 'Makanan', budget_amount: 2000000, created_at: iso(0) },
    { id: uid('bud'), user_id: userId, month: monthStr, category: 'Transportasi', budget_amount: 1000000, created_at: iso(0) },
    { id: uid('bud'), user_id: userId, month: monthStr, category: 'Hiburan', budget_amount: 500000, created_at: iso(0) },
  ];

  const db = {
    users: [DEMO_USER],
    accounts,
    categories,
    transactions,
    transfers,
    savings,
    budgets,
    audit_log: [],
  };
  saveDb(db);
  return db;
}

function iso(offsetDays, future = false) {
  const d = new Date();
  d.setDate(d.getDate() + (future ? Math.abs(offsetDays) : offsetDays));
  return d.toISOString().slice(0, 10);
}

function randAmount(min, max) {
  return Math.round((min + Math.random() * (max - min)) / 1000) * 1000;
}

function audit(db, userId, action, module, recordId) {
  db.audit_log.unshift({
    id: uid('log'), user_id: userId, action, module, record_id: recordId,
    timestamp: new Date().toISOString(), ip_or_session: 'local-demo',
  });
  db.audit_log = db.audit_log.slice(0, 200);
}

function computeAccountBalance(db, accountId) {
  const acc = db.accounts.find((a) => a.id === accountId);
  if (!acc) return 0;
  let balance = Number(acc.initial_balance) || 0;
  for (const t of db.transactions) {
    if (t.account_id !== accountId) continue;
    balance += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
  }
  for (const t of db.transfers) {
    if (t.from_account === accountId) balance -= Number(t.amount);
    if (t.to_account === accountId) balance += Number(t.amount);
  }
  return balance;
}

function requireSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) throw new ApiError('UNAUTHENTICATED', 'Sesi tidak ditemukan. Silakan login kembali.');
  const session = JSON.parse(raw);
  if (session.expiresAt < Date.now()) {
    localStorage.removeItem(SESSION_KEY);
    throw new ApiError('SESSION_EXPIRED', 'Sesi telah berakhir. Silakan login kembali.');
  }
  return session;
}

export class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 jam

export const localBackend = {
  async login({ email, password, remember }) {
    await delay();
    const db = loadDb();
    const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user || user.password !== password) {
      throw new ApiError('INVALID_CREDENTIALS', 'Email atau password salah.');
    }
    if (user.status !== 'active') {
      throw new ApiError('ACCOUNT_INACTIVE', 'Akun tidak aktif. Hubungi administrator.');
    }
    user.last_login = new Date().toISOString();
    audit(db, user.id, 'login', 'auth', user.id);
    saveDb(db);

    const session = {
      token: uid('tok'),
      userId: user.id,
      expiresAt: Date.now() + SESSION_TTL_MS,
      remember: !!remember,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { token: session.token, user: safeUser(user) };
  },

  async logout() {
    await delay(150);
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw);
      const db = loadDb();
      audit(db, session.userId, 'logout', 'auth', session.userId);
      saveDb(db);
    }
    localStorage.removeItem(SESSION_KEY);
    return { ok: true };
  },

  async validateSession() {
    await delay(200);
    const session = requireSession();
    const db = loadDb();
    const user = db.users.find((u) => u.id === session.userId);
    if (!user) throw new ApiError('UNAUTHENTICATED', 'Sesi tidak valid.');
    return { user: safeUser(user) };
  },

  async getDashboard({ from, to }) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    const trx = db.transactions.filter((t) => t.user_id === session.userId && inRange(t.date, from, to));
    const income = sum(trx.filter((t) => t.type === 'income'));
    const expense = sum(trx.filter((t) => t.type === 'expense'));
    const totalBalance = db.accounts
      .filter((a) => a.user_id === session.userId && a.status === 'active')
      .reduce((acc, a) => acc + computeAccountBalance(db, a.id), 0);
    const totalSaving = db.savings
      .filter((s) => s.user_id === session.userId && s.status !== 'Dibatalkan')
      .reduce((acc, s) => acc + Number(s.current_amount), 0);

    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthBudgets = db.budgets.filter((b) => b.user_id === session.userId && b.month === monthStr);
    const totalBudget = sum2(monthBudgets, 'budget_amount');
    const monthExpense = sum(
      db.transactions.filter((t) => t.user_id === session.userId && t.type === 'expense' && t.date.startsWith(monthStr))
    );
    const sisaBudget = totalBudget - monthExpense;

    return {
      totalBalance,
      income,
      expense,
      netCashFlow: income - expense,
      totalSaving,
      sisaBudget,
      totalBudget,
      recentTransactions: [...trx].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8),
    };
  },

  async getAccounts() {
    await delay();
    const session = requireSession();
    const db = loadDb();
    return db.accounts
      .filter((a) => a.user_id === session.userId)
      .map((a) => ({ ...a, current_balance: computeAccountBalance(db, a.id) }));
  },

  async addAccount(payload) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    const account = {
      id: uid('acc'), user_id: session.userId, name: payload.name, type: payload.type,
      initial_balance: Number(payload.initial_balance) || 0, status: 'active', created_at: new Date().toISOString(),
    };
    db.accounts.push(account);
    audit(db, session.userId, 'add', 'accounts', account.id);
    saveDb(db);
    return account;
  },

  async updateAccount(id, payload) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    const acc = db.accounts.find((a) => a.id === id && a.user_id === session.userId);
    if (!acc) throw new ApiError('NOT_FOUND', 'Rekening tidak ditemukan.');
    Object.assign(acc, payload);
    audit(db, session.userId, 'update', 'accounts', id);
    saveDb(db);
    return acc;
  },

  async deleteAccount(id) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    const hasTrx = db.transactions.some((t) => t.account_id === id);
    if (hasTrx) throw new ApiError('IN_USE', 'Rekening memiliki transaksi dan tidak dapat dihapus.');
    db.accounts = db.accounts.filter((a) => !(a.id === id && a.user_id === session.userId));
    audit(db, session.userId, 'delete', 'accounts', id);
    saveDb(db);
    return { ok: true };
  },

  async getTransactions({ type, page = 1, pageSize = 25, search = '', category, accountId, from, to, sort = 'desc' } = {}) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    let rows = db.transactions.filter((t) => t.user_id === session.userId);
    if (type) rows = rows.filter((t) => t.type === type);
    if (category) rows = rows.filter((t) => t.category === category);
    if (accountId) rows = rows.filter((t) => t.account_id === accountId);
    if (from || to) rows = rows.filter((t) => inRange(t.date, from, to));
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((t) => (t.description || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q));
    }
    rows.sort((a, b) => (sort === 'asc' ? (a.date > b.date ? 1 : -1) : (a.date < b.date ? 1 : -1)));
    const total = rows.length;
    const start = (page - 1) * pageSize;
    const items = rows.slice(start, start + pageSize).map((t) => ({
      ...t,
      account_name: db.accounts.find((a) => a.id === t.account_id)?.name || '-',
    }));
    return { items, total, page, pageSize };
  },

  async addTransaction(payload) {
    await delay();
    const session = requireSession();
    validateTransaction(payload);
    const db = loadDb();
    const trx = {
      id: uid('trx'), user_id: session.userId, date: payload.date, type: payload.type,
      category: payload.category, subcategory: payload.subcategory || '', account_id: payload.account_id,
      amount: Number(payload.amount), description: payload.description || '',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    db.transactions.push(trx);
    audit(db, session.userId, 'add', 'transactions', trx.id);
    saveDb(db);
    return trx;
  },

  async updateTransaction(id, payload) {
    await delay();
    const session = requireSession();
    validateTransaction(payload);
    const db = loadDb();
    const trx = db.transactions.find((t) => t.id === id && t.user_id === session.userId);
    if (!trx) throw new ApiError('NOT_FOUND', 'Transaksi tidak ditemukan.');
    Object.assign(trx, payload, { updated_at: new Date().toISOString() });
    audit(db, session.userId, 'update', 'transactions', id);
    saveDb(db);
    return trx;
  },

  async deleteTransaction(id) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    db.transactions = db.transactions.filter((t) => !(t.id === id && t.user_id === session.userId));
    audit(db, session.userId, 'delete', 'transactions', id);
    saveDb(db);
    return { ok: true };
  },

  async transfer(payload) {
    await delay();
    const session = requireSession();
    if (!payload.from_account || !payload.to_account) throw new ApiError('VALIDATION', 'Rekening sumber dan tujuan wajib diisi.');
    if (payload.from_account === payload.to_account) throw new ApiError('VALIDATION', 'Rekening sumber dan tujuan tidak boleh sama.');
    const amount = Number(payload.amount);
    if (!amount || amount <= 0) throw new ApiError('VALIDATION', 'Nominal transfer tidak valid.');
    const db = loadDb();
    const trf = {
      id: uid('trf'), user_id: session.userId, date: payload.date, from_account: payload.from_account,
      to_account: payload.to_account, amount, description: payload.description || '',
      created_at: new Date().toISOString(),
    };
    db.transfers.push(trf);
    audit(db, session.userId, 'transfer', 'transfers', trf.id);
    saveDb(db);
    return trf;
  },

  async getTransfers() {
    await delay();
    const session = requireSession();
    const db = loadDb();
    return db.transfers
      .filter((t) => t.user_id === session.userId)
      .map((t) => ({
        ...t,
        from_name: db.accounts.find((a) => a.id === t.from_account)?.name || '-',
        to_name: db.accounts.find((a) => a.id === t.to_account)?.name || '-',
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  },

  async getSavings() {
    await delay();
    const session = requireSession();
    const db = loadDb();
    return db.savings.filter((s) => s.user_id === session.userId);
  },

  async addSaving(payload) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    const saving = {
      id: uid('sav'), user_id: session.userId, name: payload.name,
      target_amount: Number(payload.target_amount) || 0, current_amount: Number(payload.current_amount) || 0,
      target_date: payload.target_date || '', status: payload.status || 'Aktif', created_at: new Date().toISOString(),
    };
    db.savings.push(saving);
    audit(db, session.userId, 'add', 'savings', saving.id);
    saveDb(db);
    return saving;
  },

  async updateSaving(id, payload) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    const saving = db.savings.find((s) => s.id === id && s.user_id === session.userId);
    if (!saving) throw new ApiError('NOT_FOUND', 'Target tabungan tidak ditemukan.');
    Object.assign(saving, payload);
    if (Number(saving.current_amount) >= Number(saving.target_amount) && saving.status === 'Aktif') {
      saving.status = 'Tercapai';
    }
    audit(db, session.userId, 'update', 'savings', id);
    saveDb(db);
    return saving;
  },

  async deleteSaving(id) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    db.savings = db.savings.filter((s) => !(s.id === id && s.user_id === session.userId));
    audit(db, session.userId, 'delete', 'savings', id);
    saveDb(db);
    return { ok: true };
  },

  async getBudgets({ month } = {}) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    const now = new Date();
    const monthStr = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const budgets = db.budgets.filter((b) => b.user_id === session.userId && b.month === monthStr);
    return budgets.map((b) => {
      const spent = sum(
        db.transactions.filter(
          (t) => t.user_id === session.userId && t.type === 'expense' && t.category === b.category && t.date.startsWith(monthStr)
        )
      );
      return { ...b, spent, remaining: Number(b.budget_amount) - spent };
    });
  },

  async addBudget(payload) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    const existing = db.budgets.find((b) => b.user_id === session.userId && b.month === payload.month && b.category === payload.category);
    if (existing) {
      existing.budget_amount = Number(payload.budget_amount);
      saveDb(db);
      return existing;
    }
    const budget = {
      id: uid('bud'), user_id: session.userId, month: payload.month, category: payload.category,
      budget_amount: Number(payload.budget_amount) || 0, created_at: new Date().toISOString(),
    };
    db.budgets.push(budget);
    audit(db, session.userId, 'add', 'budgets', budget.id);
    saveDb(db);
    return budget;
  },

  async updateBudget(id, payload) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    const budget = db.budgets.find((b) => b.id === id && b.user_id === session.userId);
    if (!budget) throw new ApiError('NOT_FOUND', 'Budget tidak ditemukan.');
    Object.assign(budget, payload);
    audit(db, session.userId, 'update', 'budgets', id);
    saveDb(db);
    return budget;
  },

  async deleteBudget(id) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    db.budgets = db.budgets.filter((b) => !(b.id === id && b.user_id === session.userId));
    saveDb(db);
    return { ok: true };
  },

  async getCategories() {
    await delay();
    const session = requireSession();
    const db = loadDb();
    return db.categories.filter((c) => c.user_id === session.userId);
  },

  async addCategory(payload) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    const category = {
      id: uid('cat'), user_id: session.userId, name: payload.name, type: payload.type,
      status: 'active', created_at: new Date().toISOString(),
    };
    db.categories.push(category);
    audit(db, session.userId, 'add', 'categories', category.id);
    saveDb(db);
    return category;
  },

  async updateCategory(id, payload) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    const category = db.categories.find((c) => c.id === id && c.user_id === session.userId);
    if (!category) throw new ApiError('NOT_FOUND', 'Kategori tidak ditemukan.');
    Object.assign(category, payload);
    audit(db, session.userId, 'update', 'categories', id);
    saveDb(db);
    return category;
  },

  async deleteCategory(id) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    db.categories = db.categories.filter((c) => !(c.id === id && c.user_id === session.userId));
    audit(db, session.userId, 'delete', 'categories', id);
    saveDb(db);
    return { ok: true };
  },

  async getReports({ from, to, groupBy = 'category' } = {}) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    const trx = db.transactions.filter((t) => t.user_id === session.userId && inRange(t.date, from, to));
    const income = sum(trx.filter((t) => t.type === 'income'));
    const expense = sum(trx.filter((t) => t.type === 'expense'));

    const byCategory = {};
    trx.filter((t) => t.type === 'expense').forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
    });

    const byAccount = {};
    trx.forEach((t) => {
      const name = db.accounts.find((a) => a.id === t.account_id)?.name || 'Lainnya';
      byAccount[name] = byAccount[name] || { income: 0, expense: 0 };
      byAccount[name][t.type] += Number(t.amount);
    });

    return {
      income, expense, net: income - expense,
      byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
      byAccount: Object.entries(byAccount).map(([name, v]) => ({ name, ...v })),
      transactions: trx.sort((a, b) => (a.date < b.date ? 1 : -1)),
    };
  },

  async getAnalytics({ from, to } = {}) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    const trx = db.transactions.filter((t) => t.user_id === session.userId && inRange(t.date, from, to));
    const income = sum(trx.filter((t) => t.type === 'income'));
    const expense = sum(trx.filter((t) => t.type === 'expense'));
    const expenseTrx = trx.filter((t) => t.type === 'expense');

    const days = Math.max(1, dayDiff(from, to));
    const avgDaily = expense / days;
    const avgMonthly = avgDaily * 30;

    const byCategory = {};
    expenseTrx.forEach((t) => { byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount); });
    const catEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const largestCategory = catEntries[0]?.[0] || '-';

    const catCount = {};
    expenseTrx.forEach((t) => { catCount[t.category] = (catCount[t.category] || 0) + 1; });
    const mostFrequent = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    const largestExpense = expenseTrx.sort((a, b) => Number(b.amount) - Number(a.amount))[0] || null;

    // previous period comparison
    const rangeDays = dayDiff(from, to);
    const prevTo = shiftDate(from, -1);
    const prevFrom = shiftDate(prevTo, -rangeDays + 1);
    const prevTrx = db.transactions.filter((t) => t.user_id === session.userId && inRange(t.date, prevFrom, prevTo));
    const prevExpense = sum(prevTrx.filter((t) => t.type === 'expense'));
    const expenseChangePct = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : 0;

    const savingRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    return {
      totalIncome: income,
      totalExpense: expense,
      netCashFlow: income - expense,
      savingRate,
      avgDailySpending: avgDaily,
      avgMonthlySpending: avgMonthly,
      largestExpense,
      largestExpenseCategory: largestCategory,
      mostFrequentCategory: mostFrequent,
      expenseChangePct,
      trendSeries: buildTrendSeries(trx, from, to),
    };
  },

  async changePassword({ currentPassword, newPassword }) {
    await delay();
    const session = requireSession();
    const db = loadDb();
    const user = db.users.find((u) => u.id === session.userId);
    if (!user || user.password !== currentPassword) throw new ApiError('INVALID_CREDENTIALS', 'Password saat ini salah.');
    if (!newPassword || newPassword.length < 8) throw new ApiError('VALIDATION', 'Password baru minimal 8 karakter.');
    user.password = newPassword;
    audit(db, session.userId, 'change_password', 'auth', user.id);
    saveDb(db);
    return { ok: true };
  },

  async getAuditLog() {
    await delay();
    const session = requireSession();
    const db = loadDb();
    return db.audit_log.filter((l) => l.user_id === session.userId).slice(0, 50);
  },
};

function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

function inRange(date, from, to) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function sum(arr) {
  return arr.reduce((acc, t) => acc + Number(t.amount || 0), 0);
}
function sum2(arr, key) {
  return arr.reduce((acc, t) => acc + Number(t[key] || 0), 0);
}

function dayDiff(from, to) {
  if (!from || !to) return 30;
  const a = new Date(from);
  const b = new Date(to);
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

function shiftDate(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildTrendSeries(trx, from, to) {
  const map = {};
  trx.forEach((t) => {
    map[t.date] = map[t.date] || { date: t.date, income: 0, expense: 0 };
    map[t.date][t.type] += Number(t.amount);
  });
  return Object.values(map).sort((a, b) => (a.date > b.date ? 1 : -1));
}

function validateTransaction(payload) {
  if (!payload.date) throw new ApiError('VALIDATION', 'Tanggal wajib diisi.');
  if (!payload.category) throw new ApiError('VALIDATION', 'Kategori wajib dipilih.');
  if (!payload.account_id) throw new ApiError('VALIDATION', 'Rekening wajib dipilih.');
  const amount = Number(payload.amount);
  if (!amount || Number.isNaN(amount) || amount <= 0) throw new ApiError('VALIDATION', 'Nominal tidak valid.');
}

function delay(ms = 380) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isDemoMode() {
  const url = import.meta.env.VITE_API_BASE_URL;
  return !url || url.includes('XXXXXXXXXXXXXXXX') || url.trim() === '';
}

export function resetDemoData() {
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(SESSION_KEY);
}
