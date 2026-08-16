// ─────────────────────────────────────────────────────────────────────────
// API SERVICE — satu-satunya titik komunikasi ke backend.
//
// Frontend TIDAK PERNAH membaca Google Sheets secara langsung.
// Semua request diteruskan ke Google Apps Script Web App (lihat backend/Code.gs)
// melalui ?action=... sesuai kontrak di bagian 21 spesifikasi.
//
// Ketika VITE_API_BASE_URL belum dikonfigurasi, service ini otomatis jatuh
// ke mode demo (localStore.js) supaya UI tetap dapat dicoba end-to-end.
// Tidak ada komponen/halaman yang boleh melakukan fetch() secara langsung —
// semuanya lewat object `api` di file ini.
// ─────────────────────────────────────────────────────────────────────────

import { localBackend, isDemoMode, ApiError } from './localStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TOKEN_KEY = 'financia_token_v1';

export { ApiError };

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token, remember) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

/**
 * Melakukan request ke Google Apps Script Web App.
 * Apps Script doGet/doPost menerima ?action=NAME&... dan body JSON.
 */
async function callRemote(action, { method = 'GET', params = {}, body } = {}) {
  const url = new URL(API_BASE_URL);
  url.searchParams.set('action', action);
  const token = getToken();
  if (token) url.searchParams.set('token', token);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    method,
    // Apps Script web apps require text/plain to avoid CORS preflight issues
    headers: body ? { 'Content-Type': 'text/plain;charset=utf-8' } : undefined,
    body: body ? JSON.stringify({ ...body, token }) : undefined,
  });

  if (!res.ok) {
    throw new ApiError('NETWORK_ERROR', 'Terjadi masalah saat mengambil data. Silakan coba lagi.');
  }
  const json = await res.json();
  if (!json.success) {
    throw new ApiError(json.code || 'ERROR', json.message || 'Terjadi kesalahan.');
  }
  return json.data;
}

/**
 * Wrapper: pilih remote Apps Script atau demo engine lokal.
 */
async function call(action, opts) {
  if (isDemoMode()) {
    if (!localBackend[action]) {
      throw new ApiError('NOT_IMPLEMENTED', `Aksi "${action}" belum tersedia di mode demo.`);
    }
    const args = opts?.__args || [];
    return localBackend[action](...args);
  }
  return callRemote(action, opts);
}

export const api = {
  demoMode: isDemoMode(),

  async login({ email, password, remember }) {
    const result = await call('login', { method: 'POST', body: { email, password, remember }, __args: [{ email, password, remember }] });
    setToken(result.token, remember);
    return result.user;
  },

  async logout() {
    try {
      await call('logout', { method: 'POST', __args: [] });
    } finally {
      clearToken();
    }
  },

  async validateSession() {
    const result = await call('validateSession', { __args: [] });
    return result.user;
  },

  getDashboard: (params) => call('getDashboard', { params, __args: [params] }),
  getAccounts: () => call('getAccounts', { __args: [] }),
  addAccount: (payload) => call('addAccount', { method: 'POST', body: payload, __args: [payload] }),
  updateAccount: (id, payload) => call('updateAccount', { method: 'POST', body: { id, ...payload }, __args: [id, payload] }),
  deleteAccount: (id) => call('deleteAccount', { method: 'POST', body: { id }, __args: [id] }),

  getTransactions: (params) => call('getTransactions', { params, __args: [params] }),
  addTransaction: (payload) => call('addTransaction', { method: 'POST', body: payload, __args: [payload] }),
  updateTransaction: (id, payload) => call('updateTransaction', { method: 'POST', body: { id, ...payload }, __args: [id, payload] }),
  deleteTransaction: (id) => call('deleteTransaction', { method: 'POST', body: { id }, __args: [id] }),

  transfer: (payload) => call('transfer', { method: 'POST', body: payload, __args: [payload] }),
  getTransfers: () => call('getTransfers', { __args: [] }),

  getSavings: () => call('getSavings', { __args: [] }),
  addSaving: (payload) => call('addSaving', { method: 'POST', body: payload, __args: [payload] }),
  updateSaving: (id, payload) => call('updateSaving', { method: 'POST', body: { id, ...payload }, __args: [id, payload] }),
  deleteSaving: (id) => call('deleteSaving', { method: 'POST', body: { id }, __args: [id] }),

  getBudgets: (params) => call('getBudgets', { params, __args: [params] }),
  addBudget: (payload) => call('addBudget', { method: 'POST', body: payload, __args: [payload] }),
  updateBudget: (id, payload) => call('updateBudget', { method: 'POST', body: { id, ...payload }, __args: [id, payload] }),
  deleteBudget: (id) => call('deleteBudget', { method: 'POST', body: { id }, __args: [id] }),

  getCategories: () => call('getCategories', { __args: [] }),
  addCategory: (payload) => call('addCategory', { method: 'POST', body: payload, __args: [payload] }),
  updateCategory: (id, payload) => call('updateCategory', { method: 'POST', body: { id, ...payload }, __args: [id, payload] }),
  deleteCategory: (id) => call('deleteCategory', { method: 'POST', body: { id }, __args: [id] }),

  getReports: (params) => call('getReports', { params, __args: [params] }),
  getAnalytics: (params) => call('getAnalytics', { params, __args: [params] }),

  changePassword: (payload) => call('changePassword', { method: 'POST', body: payload, __args: [payload] }),
  getAuditLog: () => call('getAuditLog', { __args: [] }),
};
