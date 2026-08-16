/**
 * ============================================================================
 * FINANCIA — BACKEND API (Google Apps Script)
 * ============================================================================
 * Backend ini adalah SATU-SATUNYA pintu ke Google Sheets. Frontend React
 * tidak pernah membaca Google Sheets secara langsung — semua request lewat
 * Web App URL hasil deploy dari file ini.
 *
 * CARA DEPLOY:
 * 1. Buat Google Spreadsheet baru, lalu buat sheet-sheet berikut (lihat
 *    backend/SHEETS_SETUP.md untuk kolom lengkap):
 *    Users, Transactions, Accounts, Categories, Transfers, Savings, Budgets, Audit_Log
 * 2. Buka Extensions > Apps Script pada spreadsheet tsb, hapus isi default,
 *    lalu tempel seluruh isi file ini.
 * 3. Jalankan fungsi `setup()` sekali dari editor untuk membuat header sheet
 *    otomatis (opsional jika sudah dibuat manual).
 * 4. Jalankan fungsi `createDemoUser()` sekali untuk membuat user pertama
 *    (ubah email/password di dalam fungsi tersebut terlebih dahulu).
 * 5. Deploy > New deployment > Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Salin URL Web App, masukkan ke VITE_API_BASE_URL pada file .env frontend.
 *
 * KEAMANAN:
 * - Password TIDAK PERNAH disimpan plaintext — selalu di-hash (SHA-256 + salt)
 *   sebelum ditulis ke sheet Users.
 * - Setiap endpoint (kecuali login) memvalidasi token sesi sebelum memproses.
 * - User hanya bisa mengakses baris data miliknya sendiri (filter by user_id).
 * - Spreadsheet ID & script ini tidak pernah diekspos ke frontend/GitHub.
 * ============================================================================
 */

// ── KONFIGURASI ─────────────────────────────────────────────────────────────
const SHEET_NAMES = {
  USERS: 'Users',
  TRANSACTIONS: 'Transactions',
  ACCOUNTS: 'Accounts',
  CATEGORIES: 'Categories',
  TRANSFERS: 'Transfers',
  SAVINGS: 'Savings',
  BUDGETS: 'Budgets',
  AUDIT_LOG: 'Audit_Log',
  SESSIONS: 'Sessions',
};

const SESSION_TTL_MINUTES = 8 * 60; // 8 jam
const SALT = 'financia_v1_change_this_salt'; // ganti dengan string acak Anda sendiri

// ── ENTRY POINTS ─────────────────────────────────────────────────────────────

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const action = (e.parameter && e.parameter.action) || '';
  let body = {};
  if (e.postData && e.postData.contents) {
    try { body = JSON.parse(e.postData.contents); } catch (err) { body = {}; }
  }
  const params = Object.assign({}, e.parameter, body);

  try {
    const result = routeAction(action, params);
    return jsonResponse({ success: true, data: result });
  } catch (err) {
    const code = err.code || 'SERVER_ERROR';
    // Error teknis dicatat di log, pesan generik dikirim ke user
    console.error(action, err);
    return jsonResponse({ success: false, code: code, message: err.userMessage || 'Terjadi masalah saat memproses permintaan. Silakan coba lagi.' });
  }
}

function routeAction(action, params) {
  // Endpoint yang tidak butuh sesi
  if (action === 'login') return login(params);

  // Semua endpoint lain wajib sesi valid
  const session = requireSession(params.token);

  switch (action) {
    case 'logout': return logout(session);
    case 'validateSession': return { user: publicUser(getUserById(session.userId)) };

    case 'getDashboard': return getDashboard(session, params);
    case 'getAccounts': return getAccounts(session);
    case 'addAccount': return addAccount(session, params);
    case 'updateAccount': return updateAccount(session, params);
    case 'deleteAccount': return deleteAccount(session, params);

    case 'getTransactions': return getTransactions(session, params);
    case 'addTransaction': return addTransaction(session, params);
    case 'updateTransaction': return updateTransaction(session, params);
    case 'deleteTransaction': return deleteTransaction(session, params);

    case 'transfer': return transfer(session, params);
    case 'getTransfers': return getTransfers(session);

    case 'getSavings': return getSavings(session);
    case 'addSaving': return addSaving(session, params);
    case 'updateSaving': return updateSaving(session, params);
    case 'deleteSaving': return deleteSaving(session, params);

    case 'getBudgets': return getBudgets(session, params);
    case 'addBudget': return addBudget(session, params);
    case 'updateBudget': return updateBudget(session, params);
    case 'deleteBudget': return deleteBudget(session, params);

    case 'getCategories': return getCategories(session);
    case 'addCategory': return addCategory(session, params);
    case 'updateCategory': return updateCategory(session, params);
    case 'deleteCategory': return deleteCategory(session, params);

    case 'getReports': return getReports(session, params);
    case 'getAnalytics': return getAnalytics(session, params);

    case 'changePassword': return changePassword(session, params);
    case 'getAuditLog': return getAuditLog(session);

    default:
      throw apiError('UNKNOWN_ACTION', 'Aksi tidak dikenali.');
  }
}

// ── AUTH ─────────────────────────────────────────────────────────────────────

function login(params) {
  const email = String(params.email || '').trim().toLowerCase();
  const password = String(params.password || '');
  if (!email || !password) throw apiError('VALIDATION', 'Email dan password wajib diisi.');

  const users = readSheet(SHEET_NAMES.USERS);
  const user = users.find((u) => String(u.email).toLowerCase() === email);
  if (!user) throw apiError('INVALID_CREDENTIALS', 'Email atau password salah.');
  if (String(user.status) !== 'active') throw apiError('ACCOUNT_INACTIVE', 'Akun tidak aktif. Hubungi administrator.');

  if (!verifyPassword(password, user.password_hash)) {
    throw apiError('INVALID_CREDENTIALS', 'Email atau password salah.');
  }

  const token = createSession(user.id);
  updateRowById(SHEET_NAMES.USERS, user.id, { last_login: nowIso() });
  writeAudit(user.id, 'login', 'auth', user.id);

  return { token: token, user: publicUser(user) };
}

function logout(session) {
  deleteSession(session.token);
  writeAudit(session.userId, 'logout', 'auth', session.userId);
  return { ok: true };
}

function requireSession(token) {
  if (!token) throw apiError('UNAUTHENTICATED', 'Sesi tidak ditemukan. Silakan login kembali.');
  const sessions = readSheet(SHEET_NAMES.SESSIONS);
  const session = sessions.find((s) => s.token === token);
  if (!session) throw apiError('UNAUTHENTICATED', 'Sesi tidak valid. Silakan login kembali.');
  if (new Date(session.expires_at).getTime() < Date.now()) {
    deleteSession(token);
    throw apiError('SESSION_EXPIRED', 'Sesi telah berakhir. Silakan login kembali.');
  }
  return { token: token, userId: session.user_id };
}

function createSession(userId) {
  const token = Utilities.getUuid();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60000).toISOString();
  appendRow(SHEET_NAMES.SESSIONS, { token: token, user_id: userId, expires_at: expiresAt, created_at: nowIso() });
  return token;
}

function deleteSession(token) {
  deleteRowsWhere(SHEET_NAMES.SESSIONS, (row) => row.token === token);
}

function changePassword(session, params) {
  const user = getUserById(session.userId);
  if (!verifyPassword(String(params.currentPassword || ''), user.password_hash)) {
    throw apiError('INVALID_CREDENTIALS', 'Password saat ini salah.');
  }
  const newPassword = String(params.newPassword || '');
  if (newPassword.length < 8) throw apiError('VALIDATION', 'Password baru minimal 8 karakter.');
  updateRowById(SHEET_NAMES.USERS, user.id, { password_hash: hashPassword(newPassword) });
  writeAudit(session.userId, 'change_password', 'auth', user.id);
  return { ok: true };
}

function hashPassword(password) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + SALT);
  return digest.map((b) => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function publicUser(user) {
  const clone = Object.assign({}, user);
  delete clone.password_hash;
  return clone;
}

function getUserById(id) {
  const user = readSheet(SHEET_NAMES.USERS).find((u) => u.id === id);
  if (!user) throw apiError('NOT_FOUND', 'User tidak ditemukan.');
  return user;
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────

function getDashboard(session, params) {
  const from = params.from, to = params.to;
  const trx = readSheet(SHEET_NAMES.TRANSACTIONS).filter((t) => t.user_id === session.userId && inRange(t.date, from, to));
  const income = sumAmount(trx.filter((t) => t.type === 'income'));
  const expense = sumAmount(trx.filter((t) => t.type === 'expense'));

  const accounts = readSheet(SHEET_NAMES.ACCOUNTS).filter((a) => a.user_id === session.userId && a.status === 'active');
  const totalBalance = accounts.reduce((acc, a) => acc + computeAccountBalance(session.userId, a.id, Number(a.initial_balance)), 0);

  const savings = readSheet(SHEET_NAMES.SAVINGS).filter((s) => s.user_id === session.userId && s.status !== 'Dibatalkan');
  const totalSaving = savings.reduce((acc, s) => acc + Number(s.current_amount || 0), 0);

  const monthStr = monthKey(new Date());
  const budgets = readSheet(SHEET_NAMES.BUDGETS).filter((b) => b.user_id === session.userId && b.month === monthStr);
  const totalBudget = budgets.reduce((acc, b) => acc + Number(b.budget_amount || 0), 0);
  const monthExpense = sumAmount(
    readSheet(SHEET_NAMES.TRANSACTIONS).filter((t) => t.user_id === session.userId && t.type === 'expense' && String(t.date).slice(0, 7) === monthStr)
  );

  const recent = trx.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);

  return {
    totalBalance: totalBalance,
    income: income,
    expense: expense,
    netCashFlow: income - expense,
    totalSaving: totalSaving,
    totalBudget: totalBudget,
    sisaBudget: totalBudget - monthExpense,
    recentTransactions: recent,
  };
}

// ── ACCOUNTS ────────────────────────────────────────────────────────────────

function getAccounts(session) {
  return readSheet(SHEET_NAMES.ACCOUNTS)
    .filter((a) => a.user_id === session.userId)
    .map((a) => Object.assign({}, a, { current_balance: computeAccountBalance(session.userId, a.id, Number(a.initial_balance)) }));
}

function addAccount(session, params) {
  validateRequired(params, ['name', 'type']);
  const account = {
    id: newId('acc'), user_id: session.userId, name: params.name, type: params.type,
    initial_balance: Number(params.initial_balance) || 0, status: 'active', created_at: nowIso(),
  };
  appendRow(SHEET_NAMES.ACCOUNTS, account);
  writeAudit(session.userId, 'add', 'accounts', account.id);
  return account;
}

function updateAccount(session, params) {
  assertOwnership(SHEET_NAMES.ACCOUNTS, params.id, session.userId);
  updateRowById(SHEET_NAMES.ACCOUNTS, params.id, pick(params, ['name', 'type', 'initial_balance', 'status']));
  writeAudit(session.userId, 'update', 'accounts', params.id);
  return { ok: true };
}

function deleteAccount(session, params) {
  assertOwnership(SHEET_NAMES.ACCOUNTS, params.id, session.userId);
  const hasTrx = readSheet(SHEET_NAMES.TRANSACTIONS).some((t) => t.account_id === params.id);
  if (hasTrx) throw apiError('IN_USE', 'Rekening memiliki transaksi dan tidak dapat dihapus.');
  deleteRowsWhere(SHEET_NAMES.ACCOUNTS, (row) => row.id === params.id && row.user_id === session.userId);
  writeAudit(session.userId, 'delete', 'accounts', params.id);
  return { ok: true };
}

function computeAccountBalance(userId, accountId, initialBalance) {
  let balance = initialBalance;
  readSheet(SHEET_NAMES.TRANSACTIONS).forEach((t) => {
    if (t.user_id !== userId || t.account_id !== accountId) return;
    balance += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
  });
  readSheet(SHEET_NAMES.TRANSFERS).forEach((t) => {
    if (t.user_id !== userId) return;
    if (t.from_account === accountId) balance -= Number(t.amount);
    if (t.to_account === accountId) balance += Number(t.amount);
  });
  return balance;
}

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────

function getTransactions(session, params) {
  let rows = readSheet(SHEET_NAMES.TRANSACTIONS).filter((t) => t.user_id === session.userId);
  if (params.type) rows = rows.filter((t) => t.type === params.type);
  if (params.category) rows = rows.filter((t) => t.category === params.category);
  if (params.accountId) rows = rows.filter((t) => t.account_id === params.accountId);
  if (params.from || params.to) rows = rows.filter((t) => inRange(t.date, params.from, params.to));
  if (params.search) {
    const q = String(params.search).toLowerCase();
    rows = rows.filter((t) => String(t.description || '').toLowerCase().indexOf(q) !== -1 || String(t.category || '').toLowerCase().indexOf(q) !== -1);
  }
  const sort = params.sort === 'asc' ? 1 : -1;
  rows.sort((a, b) => (a.date > b.date ? -sort : sort));

  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 25;
  const total = rows.length;
  const accounts = readSheet(SHEET_NAMES.ACCOUNTS);
  const items = rows.slice((page - 1) * pageSize, page * pageSize).map((t) => Object.assign({}, t, {
    account_name: (accounts.find((a) => a.id === t.account_id) || {}).name || '-',
  }));

  return { items: items, total: total, page: page, pageSize: pageSize };
}

function addTransaction(session, params) {
  validateTransactionInput(params);
  const trx = {
    id: newId('trx'), user_id: session.userId, date: params.date, type: params.type,
    category: params.category, subcategory: params.subcategory || '', account_id: params.account_id,
    amount: Number(params.amount), description: params.description || '',
    created_at: nowIso(), updated_at: nowIso(),
  };
  appendRow(SHEET_NAMES.TRANSACTIONS, trx);
  writeAudit(session.userId, 'add', 'transactions', trx.id);
  return trx;
}

function updateTransaction(session, params) {
  assertOwnership(SHEET_NAMES.TRANSACTIONS, params.id, session.userId);
  validateTransactionInput(params);
  updateRowById(SHEET_NAMES.TRANSACTIONS, params.id, Object.assign(
    pick(params, ['date', 'type', 'category', 'subcategory', 'account_id', 'amount', 'description']),
    { updated_at: nowIso() }
  ));
  writeAudit(session.userId, 'update', 'transactions', params.id);
  return { ok: true };
}

function deleteTransaction(session, params) {
  assertOwnership(SHEET_NAMES.TRANSACTIONS, params.id, session.userId);
  deleteRowsWhere(SHEET_NAMES.TRANSACTIONS, (row) => row.id === params.id && row.user_id === session.userId);
  writeAudit(session.userId, 'delete', 'transactions', params.id);
  return { ok: true };
}

function validateTransactionInput(params) {
  if (!params.date) throw apiError('VALIDATION', 'Tanggal wajib diisi.');
  if (!params.category) throw apiError('VALIDATION', 'Kategori wajib dipilih.');
  if (!params.account_id) throw apiError('VALIDATION', 'Rekening wajib dipilih.');
  const amount = Number(params.amount);
  if (!amount || isNaN(amount) || amount <= 0) throw apiError('VALIDATION', 'Nominal tidak valid.');
}

// ── TRANSFERS ─────────────────────────────────────────────────────────────────

function transfer(session, params) {
  if (!params.from_account || !params.to_account) throw apiError('VALIDATION', 'Rekening sumber dan tujuan wajib diisi.');
  if (params.from_account === params.to_account) throw apiError('VALIDATION', 'Rekening sumber dan tujuan tidak boleh sama.');
  const amount = Number(params.amount);
  if (!amount || amount <= 0) throw apiError('VALIDATION', 'Nominal transfer tidak valid.');

  assertOwnership(SHEET_NAMES.ACCOUNTS, params.from_account, session.userId);
  assertOwnership(SHEET_NAMES.ACCOUNTS, params.to_account, session.userId);

  const trf = {
    id: newId('trf'), user_id: session.userId, date: params.date || nowIso().slice(0, 10),
    from_account: params.from_account, to_account: params.to_account, amount: amount,
    description: params.description || '', created_at: nowIso(),
  };
  appendRow(SHEET_NAMES.TRANSFERS, trf);
  writeAudit(session.userId, 'transfer', 'transfers', trf.id);
  return trf;
}

function getTransfers(session) {
  const accounts = readSheet(SHEET_NAMES.ACCOUNTS);
  return readSheet(SHEET_NAMES.TRANSFERS)
    .filter((t) => t.user_id === session.userId)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((t) => Object.assign({}, t, {
      from_name: (accounts.find((a) => a.id === t.from_account) || {}).name || '-',
      to_name: (accounts.find((a) => a.id === t.to_account) || {}).name || '-',
    }));
}

// ── SAVINGS ───────────────────────────────────────────────────────────────────

function getSavings(session) {
  return readSheet(SHEET_NAMES.SAVINGS).filter((s) => s.user_id === session.userId);
}

function addSaving(session, params) {
  validateRequired(params, ['name', 'target_amount']);
  const saving = {
    id: newId('sav'), user_id: session.userId, name: params.name,
    target_amount: Number(params.target_amount) || 0, current_amount: Number(params.current_amount) || 0,
    target_date: params.target_date || '', status: params.status || 'Aktif', created_at: nowIso(),
  };
  appendRow(SHEET_NAMES.SAVINGS, saving);
  writeAudit(session.userId, 'add', 'savings', saving.id);
  return saving;
}

function updateSaving(session, params) {
  assertOwnership(SHEET_NAMES.SAVINGS, params.id, session.userId);
  const updates = pick(params, ['name', 'target_amount', 'current_amount', 'target_date', 'status']);
  if (Number(updates.current_amount) >= Number(updates.target_amount) && updates.status === 'Aktif') {
    updates.status = 'Tercapai';
  }
  updateRowById(SHEET_NAMES.SAVINGS, params.id, updates);
  writeAudit(session.userId, 'update', 'savings', params.id);
  return { ok: true };
}

function deleteSaving(session, params) {
  assertOwnership(SHEET_NAMES.SAVINGS, params.id, session.userId);
  deleteRowsWhere(SHEET_NAMES.SAVINGS, (row) => row.id === params.id && row.user_id === session.userId);
  writeAudit(session.userId, 'delete', 'savings', params.id);
  return { ok: true };
}

// ── BUDGETS ───────────────────────────────────────────────────────────────────

function getBudgets(session, params) {
  const month = params.month || monthKey(new Date());
  const budgets = readSheet(SHEET_NAMES.BUDGETS).filter((b) => b.user_id === session.userId && b.month === month);
  const trx = readSheet(SHEET_NAMES.TRANSACTIONS).filter((t) => t.user_id === session.userId && t.type === 'expense' && String(t.date).slice(0, 7) === month);
  return budgets.map((b) => {
    const spent = sumAmount(trx.filter((t) => t.category === b.category));
    return Object.assign({}, b, { spent: spent, remaining: Number(b.budget_amount) - spent });
  });
}

function addBudget(session, params) {
  validateRequired(params, ['month', 'category', 'budget_amount']);
  const existing = readSheet(SHEET_NAMES.BUDGETS).find((b) => b.user_id === session.userId && b.month === params.month && b.category === params.category);
  if (existing) {
    updateRowById(SHEET_NAMES.BUDGETS, existing.id, { budget_amount: Number(params.budget_amount) });
    return existing;
  }
  const budget = {
    id: newId('bud'), user_id: session.userId, month: params.month, category: params.category,
    budget_amount: Number(params.budget_amount) || 0, created_at: nowIso(),
  };
  appendRow(SHEET_NAMES.BUDGETS, budget);
  writeAudit(session.userId, 'add', 'budgets', budget.id);
  return budget;
}

function updateBudget(session, params) {
  assertOwnership(SHEET_NAMES.BUDGETS, params.id, session.userId);
  updateRowById(SHEET_NAMES.BUDGETS, params.id, pick(params, ['category', 'budget_amount', 'month']));
  writeAudit(session.userId, 'update', 'budgets', params.id);
  return { ok: true };
}

function deleteBudget(session, params) {
  assertOwnership(SHEET_NAMES.BUDGETS, params.id, session.userId);
  deleteRowsWhere(SHEET_NAMES.BUDGETS, (row) => row.id === params.id && row.user_id === session.userId);
  return { ok: true };
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────

function getCategories(session) {
  return readSheet(SHEET_NAMES.CATEGORIES).filter((c) => c.user_id === session.userId);
}

function addCategory(session, params) {
  validateRequired(params, ['name', 'type']);
  const category = { id: newId('cat'), user_id: session.userId, name: params.name, type: params.type, status: 'active', created_at: nowIso() };
  appendRow(SHEET_NAMES.CATEGORIES, category);
  writeAudit(session.userId, 'add', 'categories', category.id);
  return category;
}

function updateCategory(session, params) {
  assertOwnership(SHEET_NAMES.CATEGORIES, params.id, session.userId);
  updateRowById(SHEET_NAMES.CATEGORIES, params.id, pick(params, ['name', 'status']));
  writeAudit(session.userId, 'update', 'categories', params.id);
  return { ok: true };
}

function deleteCategory(session, params) {
  assertOwnership(SHEET_NAMES.CATEGORIES, params.id, session.userId);
  deleteRowsWhere(SHEET_NAMES.CATEGORIES, (row) => row.id === params.id && row.user_id === session.userId);
  writeAudit(session.userId, 'delete', 'categories', params.id);
  return { ok: true };
}

// ── REPORTS & ANALYTICS ─────────────────────────────────────────────────────

function getReports(session, params) {
  const trx = readSheet(SHEET_NAMES.TRANSACTIONS).filter((t) => t.user_id === session.userId && inRange(t.date, params.from, params.to));
  const income = sumAmount(trx.filter((t) => t.type === 'income'));
  const expense = sumAmount(trx.filter((t) => t.type === 'expense'));

  const byCategory = {};
  trx.filter((t) => t.type === 'expense').forEach((t) => { byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount); });

  const accounts = readSheet(SHEET_NAMES.ACCOUNTS);
  const byAccount = {};
  trx.forEach((t) => {
    const name = (accounts.find((a) => a.id === t.account_id) || {}).name || 'Lainnya';
    byAccount[name] = byAccount[name] || { income: 0, expense: 0 };
    byAccount[name][t.type] += Number(t.amount);
  });

  return {
    income: income, expense: expense, net: income - expense,
    byCategory: Object.keys(byCategory).map((k) => ({ name: k, value: byCategory[k] })),
    byAccount: Object.keys(byAccount).map((k) => Object.assign({ name: k }, byAccount[k])),
    transactions: trx.sort((a, b) => (a.date < b.date ? 1 : -1)),
  };
}

function getAnalytics(session, params) {
  const trx = readSheet(SHEET_NAMES.TRANSACTIONS).filter((t) => t.user_id === session.userId && inRange(t.date, params.from, params.to));
  const income = sumAmount(trx.filter((t) => t.type === 'income'));
  const expense = sumAmount(trx.filter((t) => t.type === 'expense'));
  const expenseTrx = trx.filter((t) => t.type === 'expense');

  const days = Math.max(1, dayDiff(params.from, params.to));
  const avgDaily = expense / days;

  const byCategory = {};
  expenseTrx.forEach((t) => { byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount); });
  const catEntries = Object.keys(byCategory).map((k) => [k, byCategory[k]]).sort((a, b) => b[1] - a[1]);

  const catCount = {};
  expenseTrx.forEach((t) => { catCount[t.category] = (catCount[t.category] || 0) + 1; });
  const freqEntries = Object.keys(catCount).map((k) => [k, catCount[k]]).sort((a, b) => b[1] - a[1]);

  const largestExpense = expenseTrx.slice().sort((a, b) => Number(b.amount) - Number(a.amount))[0] || null;

  const prevTo = shiftDate(params.from, -1);
  const prevFrom = shiftDate(prevTo, -(dayDiff(params.from, params.to) - 1));
  const prevExpense = sumAmount(readSheet(SHEET_NAMES.TRANSACTIONS).filter((t) => t.user_id === session.userId && t.type === 'expense' && inRange(t.date, prevFrom, prevTo)));
  const expenseChangePct = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : 0;

  return {
    totalIncome: income, totalExpense: expense, netCashFlow: income - expense,
    savingRate: income > 0 ? ((income - expense) / income) * 100 : 0,
    avgDailySpending: avgDaily, avgMonthlySpending: avgDaily * 30,
    largestExpense: largestExpense,
    largestExpenseCategory: catEntries[0] ? catEntries[0][0] : '-',
    mostFrequentCategory: freqEntries[0] ? freqEntries[0][0] : '-',
    expenseChangePct: expenseChangePct,
    trendSeries: buildTrendSeries(trx),
  };
}

function buildTrendSeries(trx) {
  const map = {};
  trx.forEach((t) => {
    map[t.date] = map[t.date] || { date: t.date, income: 0, expense: 0 };
    map[t.date][t.type] += Number(t.amount);
  });
  return Object.keys(map).map((k) => map[k]).sort((a, b) => (a.date > b.date ? 1 : -1));
}

function getAuditLog(session) {
  return readSheet(SHEET_NAMES.AUDIT_LOG)
    .filter((l) => l.user_id === session.userId)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, 50);
}

// ── HELPERS: SHEET ACCESS ─────────────────────────────────────────────────────

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw apiError('SHEET_NOT_FOUND', 'Konfigurasi database tidak lengkap.');
  return sheet;
}

/** Baca seluruh sheet menjadi array of object (batch read, bukan cell-by-cell). */
function readSheet(name) {
  const sheet = getSheet(name);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row.every((c) => c === '')) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      let v = row[idx];
      if (v instanceof Date) v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      obj[h] = v;
    });
    rows.push(obj);
  }
  return rows;
}

function appendRow(sheetName, obj) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map((h) => (obj[h] !== undefined ? obj[h] : ''));
  sheet.appendRow(row);
}

function updateRowById(sheetName, id, updates) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('id');
  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol] === id) {
      Object.keys(updates).forEach((key) => {
        const col = headers.indexOf(key);
        if (col !== -1) sheet.getRange(i + 1, col + 1).setValue(updates[key]);
      });
      return true;
    }
  }
  throw apiError('NOT_FOUND', 'Data tidak ditemukan.');
}

function deleteRowsWhere(sheetName, predicate) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const rowsToDelete = [];
  for (let i = 1; i < values.length; i++) {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = values[i][idx]; });
    if (predicate(obj)) rowsToDelete.push(i + 1);
  }
  // hapus dari bawah ke atas agar index tidak bergeser
  rowsToDelete.sort((a, b) => b - a).forEach((rowIndex) => sheet.deleteRow(rowIndex));
}

function assertOwnership(sheetName, id, userId) {
  const row = readSheet(sheetName).find((r) => r.id === id);
  if (!row) throw apiError('NOT_FOUND', 'Data tidak ditemukan.');
  if (row.user_id !== userId) throw apiError('FORBIDDEN', 'Anda tidak memiliki akses ke data ini.');
  return row;
}

function writeAudit(userId, action, module, recordId) {
  appendRow(SHEET_NAMES.AUDIT_LOG, {
    id: newId('log'), user_id: userId, action: action, module: module, record_id: recordId,
    timestamp: nowIso(), ip_or_session: 'apps-script',
  });
}

// ── HELPERS: MISC ─────────────────────────────────────────────────────────────

function newId(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}

function nowIso() {
  return new Date().toISOString();
}

function monthKey(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM');
}

function inRange(date, from, to) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function dayDiff(from, to) {
  if (!from || !to) return 30;
  const a = new Date(from), b = new Date(to);
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

function shiftDate(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function sumAmount(arr) {
  return arr.reduce((acc, t) => acc + Number(t.amount || 0), 0);
}

function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => { if (obj[k] !== undefined) out[k] = obj[k]; });
  return out;
}

function validateRequired(params, keys) {
  keys.forEach((k) => {
    if (params[k] === undefined || params[k] === null || params[k] === '') {
      throw apiError('VALIDATION', 'Field "' + k + '" wajib diisi.');
    }
  });
}

function apiError(code, userMessage) {
  const err = new Error(userMessage);
  err.code = code;
  err.userMessage = userMessage;
  return err;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ── SETUP UTILITIES (jalankan manual sekali dari editor Apps Script) ──────────

/** Membuat seluruh sheet & header yang dibutuhkan jika belum ada. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schema = {
    Users: ['id', 'name', 'email', 'password_hash', 'status', 'created_at', 'last_login'],
    Transactions: ['id', 'user_id', 'date', 'type', 'category', 'subcategory', 'account_id', 'amount', 'description', 'created_at', 'updated_at'],
    Accounts: ['id', 'user_id', 'name', 'type', 'initial_balance', 'status', 'created_at'],
    Categories: ['id', 'user_id', 'name', 'type', 'status', 'created_at'],
    Transfers: ['id', 'user_id', 'date', 'from_account', 'to_account', 'amount', 'description', 'created_at'],
    Savings: ['id', 'user_id', 'name', 'target_amount', 'current_amount', 'target_date', 'status', 'created_at'],
    Budgets: ['id', 'user_id', 'month', 'category', 'budget_amount', 'created_at'],
    Audit_Log: ['id', 'user_id', 'action', 'module', 'record_id', 'timestamp', 'ip_or_session'],
    Sessions: ['token', 'user_id', 'expires_at', 'created_at'],
  };
  Object.keys(schema).forEach((name) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, schema[name].length).setValues([schema[name]]);
      sheet.setFrozenRows(1);
    }
  });
  Logger.log('Setup selesai. Sheet yang dibutuhkan sudah dibuat.');
}

/** Jalankan sekali untuk membuat user pertama. Ganti email & password di bawah. */
function createDemoUser() {
  const email = 'demo@financia.app'; // GANTI
  const password = 'GantiPassword123'; // GANTI — gunakan password yang kuat
  const name = 'Andi Pratama'; // GANTI

  const existing = readSheet(SHEET_NAMES.USERS).find((u) => String(u.email).toLowerCase() === email.toLowerCase());
  if (existing) { Logger.log('User sudah ada.'); return; }

  appendRow(SHEET_NAMES.USERS, {
    id: newId('u'), name: name, email: email, password_hash: hashPassword(password),
    status: 'active', created_at: nowIso(), last_login: '',
  });
  Logger.log('User dibuat: ' + email);
}

/** Hapus sesi yang sudah kedaluwarsa. Jadwalkan sebagai trigger harian (opsional). */
function cleanupExpiredSessions() {
  const now = Date.now();
  deleteRowsWhere(SHEET_NAMES.SESSIONS, (row) => new Date(row.expires_at).getTime() < now);
}
