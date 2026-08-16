import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, ArrowUpRight, ArrowDownRight, Pencil, Trash2, SlidersHorizontal } from 'lucide-react';
import Card from './ui/Card';
import EmptyState from './ui/EmptyState';
import Pagination from './ui/Pagination';
import ConfirmModal from './ui/ConfirmModal';
import TransactionFormModal from './TransactionFormModal';
import { SkeletonRow } from './ui/Skeleton';
import { api } from '../services/api';
import { formatRupiah, formatDateShort } from '../utils/format';
import { useApp } from '../context/AppContext';

function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * type: 'income' | 'expense' | undefined (undefined = semua jenis, untuk halaman Transaksi)
 */
export default function TransactionListPage({ type, title, emptyLabel }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useApp();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [formOpen, setFormOpen] = useState(searchParams.get('add') === '1');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounced(search);

  const loadMeta = useCallback(async () => {
    const [cats, accs] = await Promise.all([api.getCategories(), api.getAccounts()]);
    setCategories(type ? cats.filter((c) => c.type === type) : cats);
    setAccounts(accs.filter((a) => a.status === 'active'));
  }, [type]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getTransactions({
        type, page, pageSize, search: debouncedSearch, category: category || undefined, accountId: accountId || undefined,
      });
      setRows(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err.message || 'Terjadi masalah saat mengambil data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [type, page, pageSize, debouncedSearch, category, accountId]);

  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { loadRows(); }, [loadRows]);
  useEffect(() => { setPage(1); }, [debouncedSearch, category, accountId]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setFormOpen(true);
  }

  async function handleSubmit(form) {
    setSaving(true);
    try {
      if (editing) {
        await api.updateTransaction(editing.id, form);
        showToast('Transaksi berhasil diperbarui.');
      } else {
        await api.addTransaction(form);
        showToast('Transaksi berhasil disimpan.');
      }
      setFormOpen(false);
      searchParams.delete('add');
      setSearchParams(searchParams, { replace: true });
      loadRows();
    } catch (err) {
      showToast(err.message || 'Transaksi gagal disimpan. Silakan coba lagi.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteTransaction(deleteTarget.id);
      showToast('Transaksi berhasil dihapus.');
      setDeleteTarget(null);
      loadRows();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus transaksi.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const showTypeColumn = !type;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-ink-soft absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            className="input pl-10"
            placeholder="Cari catatan atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select className="input !w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Semua kategori</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select className="input !w-auto hidden sm:block" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Semua rekening</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button onClick={openAdd} className="btn-primary shrink-0">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>
      </div>

      <Card padding={false}>
        {error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-expense mb-3">{error}</p>
            <button onClick={loadRows} className="btn-secondary text-xs">Coba lagi</button>
          </div>
        ) : loading ? (
          <div className="divide-y divide-black/5 dark:divide-white/5 px-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : !rows.length ? (
          <EmptyState title={emptyLabel || 'Belum ada transaksi'} actionLabel="+ Tambah Transaksi" onAction={openAdd} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-soft border-b border-black/5 dark:border-white/5">
                    <th className="font-medium px-5 py-3">Tanggal</th>
                    {showTypeColumn && <th className="font-medium px-3 py-3">Jenis</th>}
                    <th className="font-medium px-3 py-3">Kategori</th>
                    <th className="font-medium px-3 py-3">Rekening</th>
                    <th className="font-medium px-3 py-3">Catatan</th>
                    <th className="font-medium px-3 py-3 text-right">Nominal</th>
                    <th className="font-medium px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {rows.map((t) => (
                    <tr key={t.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-ink dark:text-gray-200 whitespace-nowrap">{formatDateShort(t.date)}</td>
                      {showTypeColumn && (
                        <td className="px-3 py-3">
                          {t.type === 'income' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-income"><ArrowDownRight className="h-3.5 w-3.5" />Masuk</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-expense"><ArrowUpRight className="h-3.5 w-3.5" />Keluar</span>
                          )}
                        </td>
                      )}
                      <td className="px-3 py-3 text-ink dark:text-gray-200">{t.category}</td>
                      <td className="px-3 py-3 text-ink-soft">{t.account_name}</td>
                      <td className="px-3 py-3 text-ink-soft max-w-[220px] truncate">{t.description || '-'}</td>
                      <td className={`px-3 py-3 text-right font-semibold whitespace-nowrap ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-ink-soft hover:bg-black/5 dark:hover:bg-white/10 hover:text-accent">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded-lg text-ink-soft hover:bg-expense/10 hover:text-expense">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-black/5 dark:divide-white/5 px-4">
              {rows.map((t) => (
                <div key={t.id} className="py-3.5 flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-income/10' : 'bg-expense/10'}`}>
                    {t.type === 'income' ? <ArrowDownRight className="h-4 w-4 text-income" /> : <ArrowUpRight className="h-4 w-4 text-expense" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-ink dark:text-white truncate">{t.category}</p>
                      <p className={`text-sm font-semibold shrink-0 ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                      </p>
                    </div>
                    <p className="text-xs text-ink-soft mt-0.5">{formatDateShort(t.date)} • {t.account_name}</p>
                    {t.description && <p className="text-xs text-ink-soft mt-0.5 truncate">{t.description}</p>}
                    <div className="flex gap-3 mt-1.5">
                      <button onClick={() => openEdit(t)} className="text-xs text-accent font-medium">Edit</button>
                      <button onClick={() => setDeleteTarget(t)} className="text-xs text-expense font-medium">Hapus</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pb-4">
              <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
            </div>
          </>
        )}
      </Card>

      <TransactionFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); searchParams.delete('add'); setSearchParams(searchParams, { replace: true }); }}
        onSubmit={handleSubmit}
        type={editing?.type || type || 'expense'}
        categories={categories}
        accounts={accounts}
        initial={editing}
        saving={saving}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message="Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}
