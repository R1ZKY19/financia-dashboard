import { useCallback, useEffect, useState } from 'react';
import { Plus, PiggyBank, Pencil, Trash2, CalendarClock } from 'lucide-react';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import RupiahInput from '../components/ui/RupiahInput';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import SavingProgress from '../charts/SavingProgress';
import { api } from '../services/api';
import { formatDateFull } from '../utils/format';
import { SAVING_STATUS } from '../utils/constants';
import { useApp } from '../context/AppContext';

const STATUS_VARIANT = { Aktif: 'accent', Tercapai: 'success', Dibatalkan: 'neutral' };

const emptyForm = { name: '', target_amount: 0, current_amount: 0, target_date: '', status: 'Aktif', notes: '' };

export default function Tabungan() {
  const { showToast } = useApp();
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSavings(await api.getSavings());
    } catch (err) {
      setError(err.message || 'Gagal memuat data tabungan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }
  function openEdit(s) {
    setEditing(s);
    setForm({ ...s });
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { showToast('Nama target wajib diisi.', 'error'); return; }
    if (!form.target_amount || form.target_amount <= 0) { showToast('Target nominal tidak valid.', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.updateSaving(editing.id, form);
        showToast('Target tabungan diperbarui.');
      } else {
        await api.addSaving(form);
        showToast('Target tabungan ditambahkan.');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan target tabungan.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteSaving(deleteTarget.id);
      showToast('Target tabungan dihapus.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={openAdd} className="btn-primary">
          <Plus className="h-4 w-4" /> Tambah Target
        </button>
      </div>

      {error ? (
        <Card><p className="text-sm text-expense">{error}</p></Card>
      ) : loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !savings.length ? (
        <Card><EmptyState icon={PiggyBank} title="Belum ada target tabungan" description="Buat target untuk mulai menabung, seperti dana darurat atau liburan." actionLabel="+ Tambah Target" onAction={openAdd} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savings.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <PiggyBank className="h-5 w-5 text-accent" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-ink-soft hover:bg-black/5 hover:text-accent"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg text-ink-soft hover:bg-expense/10 hover:text-expense"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-ink dark:text-white">{s.name}</p>
                <Badge variant={STATUS_VARIANT[s.status] || 'neutral'}>{s.status}</Badge>
              </div>
              {s.target_date && (
                <p className="text-xs text-ink-soft flex items-center gap-1 mb-3">
                  <CalendarClock className="h-3 w-3" /> Target: {formatDateFull(s.target_date)}
                </p>
              )}
              <SavingProgress name={s.name} current={Number(s.current_amount)} target={Number(s.target_amount)} />
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Target Tabungan' : 'Tambah Target Tabungan'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Batal</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nama Target</label>
            <input className="input" placeholder="cth. Laptop, Dana Darurat" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Target Nominal</label>
              <RupiahInput value={form.target_amount} onChange={(v) => setForm({ ...form, target_amount: v })} />
            </div>
            <div>
              <label className="label">Terkumpul</label>
              <RupiahInput value={form.current_amount} onChange={(v) => setForm({ ...form, current_amount: v })} />
            </div>
          </div>
          <div>
            <label className="label">Target Tanggal <span className="text-ink-soft font-normal">(opsional)</span></label>
            <input type="date" className="input" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {SAVING_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Catatan <span className="text-ink-soft font-normal">(opsional)</span></label>
            <textarea className="input min-h-[60px] resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Apakah Anda yakin ingin menghapus target tabungan "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
