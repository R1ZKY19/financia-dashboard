import { useEffect, useState } from 'react';
import Modal from './ui/Modal';
import RupiahInput from './ui/RupiahInput';
import { todayISO } from '../utils/format';

const empty = (type) => ({
  date: todayISO(), type, category: '', subcategory: '', account_id: '', amount: 0, description: '',
});

export default function TransactionFormModal({ open, onClose, onSubmit, type, categories, accounts, initial, saving }) {
  const [form, setForm] = useState(empty(type));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : empty(type));
      setErrors({});
    }
  }, [open, initial, type]);

  function validate() {
    const e = {};
    if (!form.date) e.date = 'Tanggal wajib diisi';
    if (!form.category) e.category = 'Kategori wajib dipilih';
    if (!form.account_id) e.account_id = 'Rekening wajib dipilih';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Nominal tidak valid';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? `Edit ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}` : `Tambah ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Tanggal</label>
          <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          {errors.date && <p className="text-xs text-expense mt-1">{errors.date}</p>}
        </div>
        <div>
          <label className="label">{type === 'income' ? 'Sumber Pemasukan / Kategori' : 'Kategori'}</label>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id || c} value={c.name || c}>{c.name || c}</option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-expense mt-1">{errors.category}</p>}
        </div>
        {type === 'expense' && (
          <div>
            <label className="label">Subkategori <span className="text-ink-soft font-normal">(opsional)</span></label>
            <input className="input" placeholder="cth. Makan siang" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
          </div>
        )}
        <div>
          <label className="label">Rekening</label>
          <select className="input" value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
            <option value="">Pilih rekening</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {errors.account_id && <p className="text-xs text-expense mt-1">{errors.account_id}</p>}
        </div>
        <div>
          <label className="label">Nominal</label>
          <RupiahInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
          {errors.amount && <p className="text-xs text-expense mt-1">{errors.amount}</p>}
        </div>
        <div>
          <label className="label">Catatan <span className="text-ink-soft font-normal">(opsional)</span></label>
          <textarea className="input min-h-[70px] resize-none" placeholder="Tambahkan catatan..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </form>
    </Modal>
  );
}
