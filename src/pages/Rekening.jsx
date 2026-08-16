import { useCallback, useEffect, useState } from 'react';
import { Plus, Wallet, Landmark, Smartphone, CircleDollarSign, Pencil, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import RupiahInput from '../components/ui/RupiahInput';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { formatRupiah } from '../utils/format';
import { ACCOUNT_TYPES } from '../utils/constants';
import { useApp } from '../context/AppContext';

const TYPE_ICON = { bank: Landmark, cash: Wallet, ewallet: Smartphone, other: CircleDollarSign };

export default function Rekening() {
  const { showToast } = useApp();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'bank', initial_balance: 0 });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAccounts(await api.getAccounts());
    } catch (err) {
      setError(err.message || 'Gagal memuat rekening.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm({ name: '', type: 'bank', initial_balance: 0 });
    setFormOpen(true);
  }
  function openEdit(acc) {
    setEditing(acc);
    setForm({ name: acc.name, type: acc.type, initial_balance: acc.initial_balance });
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { showToast('Nama rekening wajib diisi.', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.updateAccount(editing.id, form);
        showToast('Rekening berhasil diperbarui.');
      } else {
        await api.addAccount(form);
        showToast('Rekening berhasil ditambahkan.');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan rekening.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteAccount(deleteTarget.id);
      showToast('Rekening berhasil dihapus.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus rekening.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const totalBalance = accounts.reduce((acc, a) => acc + Number(a.current_balance || 0), 0);

  return (
    <div className="space-y-5">
      <Card className="bg-navy text-white flex items-center justify-between">
        <div>
          <p className="text-xs text-white/60">Total Saldo Seluruh Rekening</p>
          <p className="text-2xl font-bold mt-1">{formatRupiah(totalBalance)}</p>
        </div>
        <button onClick={openAdd} className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Tambah Rekening</span>
        </button>
      </Card>

      {error ? (
        <Card><p className="text-sm text-expense">{error}</p></Card>
      ) : loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !accounts.length ? (
        <Card><EmptyState icon={Wallet} title="Belum ada rekening" description="Tambahkan bank, cash, atau e-wallet Anda." actionLabel="+ Tambah Rekening" onAction={openAdd} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const Icon = TYPE_ICON[acc.type] || Wallet;
            return (
              <Card key={acc.id} className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(acc)} className="p-1.5 rounded-lg text-ink-soft hover:bg-black/5 hover:text-accent"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setDeleteTarget(acc)} className="p-1.5 rounded-lg text-ink-soft hover:bg-expense/10 hover:text-expense"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <p className="text-sm font-semibold text-ink dark:text-white">{acc.name}</p>
                <p className="text-xs text-ink-soft capitalize mb-2">{ACCOUNT_TYPES.find((t) => t.value === acc.type)?.label || acc.type}</p>
                <p className="text-xl font-bold text-ink dark:text-white">{formatRupiah(acc.current_balance)}</p>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Rekening' : 'Tambah Rekening'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Batal</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nama Rekening</label>
            <input className="input" placeholder="cth. BCA, DANA, Cash" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Jenis</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Saldo Awal</label>
            <RupiahInput value={form.initial_balance} onChange={(v) => setForm({ ...form, initial_balance: v })} />
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Apakah Anda yakin ingin menghapus rekening "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
