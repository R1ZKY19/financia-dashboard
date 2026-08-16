import { useCallback, useEffect, useState } from 'react';
import { Plus, Target, Pencil, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import RupiahInput from '../components/ui/RupiahInput';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { formatRupiah, formatMonthYear, formatPercent } from '../utils/format';
import { useApp } from '../context/AppContext';

function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function statusOf(spent, budget) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  if (pct > 100) return { label: 'Melewati budget', variant: 'danger' };
  if (pct >= 80) return { label: 'Hampir habis', variant: 'warning' };
  return { label: 'Normal', variant: 'success' };
}

export default function Budget() {
  const { showToast } = useApp();
  const [month, setMonth] = useState(currentMonthStr());
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category: '', budget_amount: 0 });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [b, c] = await Promise.all([api.getBudgets({ month }), api.getCategories()]);
      setBudgets(b);
      setCategories(c.filter((cat) => cat.type === 'expense'));
    } catch (err) {
      setError(err.message || 'Gagal memuat budget.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ category: '', budget_amount: 0 });
    setFormOpen(true);
  }
  function openEdit(b) {
    setEditing(b);
    setForm({ category: b.category, budget_amount: b.budget_amount });
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.category) { showToast('Kategori wajib dipilih.', 'error'); return; }
    if (!form.budget_amount || form.budget_amount <= 0) { showToast('Nominal budget tidak valid.', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.updateBudget(editing.id, { ...form, month });
        showToast('Budget diperbarui.');
      } else {
        await api.addBudget({ ...form, month });
        showToast('Budget ditambahkan.');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan budget.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteBudget(deleteTarget.id);
      showToast('Budget dihapus.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus budget.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const totalBudget = budgets.reduce((a, b) => a + Number(b.budget_amount), 0);
  const totalSpent = budgets.reduce((a, b) => a + Number(b.spent), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="input !w-auto"
        />
        <button onClick={openAdd} className="btn-primary sm:ml-auto">
          <Plus className="h-4 w-4" /> Tambah Budget
        </button>
      </div>

      {!loading && budgets.length > 0 && (
        <Card className="bg-navy text-white">
          <p className="text-xs text-white/60 mb-1">Total Budget {formatMonthYear(`${month}-01`)}</p>
          <p className="text-xl font-bold">{formatRupiah(totalSpent)} <span className="text-white/50 text-sm font-normal">/ {formatRupiah(totalBudget)}</span></p>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-3">
            <div
              className={`h-full rounded-full ${totalSpent > totalBudget ? 'bg-expense' : 'bg-accent'}`}
              style={{ width: `${Math.min(100, totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0)}%` }}
            />
          </div>
        </Card>
      )}

      {error ? (
        <Card><p className="text-sm text-expense">{error}</p></Card>
      ) : loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !budgets.length ? (
        <Card><EmptyState icon={Target} title="Belum ada budget bulan ini" description="Tentukan batas pengeluaran per kategori agar keuangan lebih terkontrol." actionLabel="+ Tambah Budget" onAction={openAdd} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const pct = b.budget_amount > 0 ? Math.min(100, (b.spent / b.budget_amount) * 100) : 0;
            const status = statusOf(b.spent, b.budget_amount);
            const barColor = status.variant === 'danger' ? 'bg-expense' : status.variant === 'warning' ? 'bg-warn' : 'bg-income';
            return (
              <Card key={b.id}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-ink dark:text-white">{b.category}</p>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(b)} className="p-1 rounded-lg text-ink-soft hover:bg-black/5 hover:text-accent"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteTarget(b)} className="p-1 rounded-lg text-ink-soft hover:bg-expense/10 hover:text-expense"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
                <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden mt-3 mb-2">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-ink-soft">
                  <span>{formatRupiah(b.spent)} terpakai</span>
                  <span>{formatPercent(pct, 0)}</span>
                </div>
                <p className="text-xs text-ink-soft mt-1">Budget: {formatRupiah(b.budget_amount)} • Sisa: {formatRupiah(b.remaining)}</p>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Budget' : 'Tambah Budget'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Batal</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Kategori</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={!!editing}>
              <option value="">Pilih kategori</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Budget Bulanan</label>
            <RupiahInput value={form.budget_amount} onChange={(v) => setForm({ ...form, budget_amount: v })} />
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Apakah Anda yakin ingin menghapus budget "${deleteTarget?.category}"?`}
      />
    </div>
  );
}
