import { useCallback, useEffect, useState } from 'react';
import { Plus, Tags, Pencil, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import { SkeletonRow } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function Kategori() {
  const { showToast } = useApp();
  const [tab, setTab] = useState('expense');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCategories(await api.getCategories());
    } catch (err) {
      setError(err.message || 'Gagal memuat kategori.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setName('');
    setFormOpen(true);
  }
  function openEdit(c) {
    setEditing(c);
    setName(c.name);
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { showToast('Nama kategori wajib diisi.', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.updateCategory(editing.id, { name, type: editing.type });
        showToast('Kategori diperbarui.');
      } else {
        await api.addCategory({ name, type: tab });
        showToast('Kategori ditambahkan.');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan kategori.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteCategory(deleteTarget.id);
      showToast('Kategori dihapus.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus kategori.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = categories.filter((c) => c.type === tab);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-xl border border-black/10 dark:border-white/10 p-1 bg-white dark:bg-navy-light">
          {[{ v: 'expense', l: 'Pengeluaran' }, { v: 'income', l: 'Pemasukan' }].map((t) => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.v ? 'bg-navy text-white' : 'text-ink-soft'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="btn-primary ml-auto">
          <Plus className="h-4 w-4" /> Tambah
        </button>
      </div>

      <Card padding={false}>
        {error ? (
          <p className="text-sm text-expense p-5">{error}</p>
        ) : loading ? (
          <div className="px-5">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : !filtered.length ? (
          <EmptyState icon={Tags} title="Belum ada kategori" actionLabel="+ Tambah Kategori" onAction={openAdd} />
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5 px-5">
            {filtered.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <span className="text-sm text-ink dark:text-white">{c.name}</span>
                  {c.status === 'inactive' && <Badge variant="neutral">Nonaktif</Badge>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-ink-soft hover:bg-black/5 hover:text-accent"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg text-ink-soft hover:bg-expense/10 hover:text-expense"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Kategori' : `Tambah Kategori ${tab === 'income' ? 'Pemasukan' : 'Pengeluaran'}`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Batal</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <label className="label">Nama Kategori</label>
          <input className="input" placeholder="cth. Hiburan" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Apakah Anda yakin ingin menghapus kategori "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
