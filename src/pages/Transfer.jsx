import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, ArrowRight } from 'lucide-react';
import Card from '../components/ui/Card';
import RupiahInput from '../components/ui/RupiahInput';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonRow } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { formatRupiah, formatDateShort, todayISO } from '../utils/format';
import { useApp } from '../context/AppContext';

export default function Transfer() {
  const { showToast } = useApp();
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ date: todayISO(), from_account: '', to_account: '', amount: 0, description: '' });
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [accs, trfs] = await Promise.all([api.getAccounts(), api.getTransfers()]);
      setAccounts(accs.filter((a) => a.status === 'active'));
      setTransfers(trfs);
    } catch (err) {
      setError(err.message || 'Gagal memuat data transfer.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function validate() {
    const e = {};
    if (!form.from_account) e.from_account = 'Pilih rekening sumber';
    if (!form.to_account) e.to_account = 'Pilih rekening tujuan';
    if (form.from_account && form.from_account === form.to_account) e.to_account = 'Tidak boleh sama dengan sumber';
    if (!form.amount || form.amount <= 0) e.amount = 'Nominal tidak valid';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.transfer(form);
      showToast('Transfer berhasil disimpan.');
      setForm({ date: todayISO(), from_account: '', to_account: '', amount: 0, description: '' });
      load();
    } catch (err) {
      showToast(err.message || 'Transfer gagal disimpan. Silakan coba lagi.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <Card className="lg:col-span-2 h-fit">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <ArrowLeftRight className="h-4.5 w-4.5 text-accent" size={18} />
          </div>
          <h3 className="font-semibold text-ink dark:text-white">Transfer Antar Rekening</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tanggal</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div>
              <label className="label">Dari</label>
              <select className="input" value={form.from_account} onChange={(e) => setForm({ ...form, from_account: e.target.value })}>
                <option value="">Pilih</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <ArrowRight className="h-4 w-4 text-ink-soft mb-2.5" />
            <div>
              <label className="label">Ke</label>
              <select className="input" value={form.to_account} onChange={(e) => setForm({ ...form, to_account: e.target.value })}>
                <option value="">Pilih</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          {(errors.from_account || errors.to_account) && (
            <p className="text-xs text-expense -mt-2">{errors.from_account || errors.to_account}</p>
          )}
          <div>
            <label className="label">Nominal</label>
            <RupiahInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
            {errors.amount && <p className="text-xs text-expense mt-1">{errors.amount}</p>}
          </div>
          <div>
            <label className="label">Catatan <span className="text-ink-soft font-normal">(opsional)</span></label>
            <input className="input" placeholder="cth. Top up e-wallet" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <p className="text-xs text-ink-soft bg-black/5 dark:bg-white/5 rounded-lg px-3 py-2">
            Transfer tidak dihitung sebagai pengeluaran. Total kekayaan Anda tidak berubah.
          </p>
          <button type="submit" className="btn-primary w-full" disabled={saving}>{saving ? 'Memproses...' : 'Transfer Sekarang'}</button>
        </form>
      </Card>

      <Card className="lg:col-span-3" padding={false}>
        <h3 className="font-semibold text-ink dark:text-white px-5 pt-5 mb-2">Riwayat Transfer</h3>
        {error ? (
          <p className="text-sm text-expense px-5 pb-5">{error}</p>
        ) : loading ? (
          <div className="px-5 pb-5">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : !transfers.length ? (
          <EmptyState icon={ArrowLeftRight} title="Belum ada transfer" description="Riwayat transfer antar rekening akan tampil di sini." />
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5 px-5 pb-2">
            {transfers.map((t) => (
              <div key={t.id} className="py-3.5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <ArrowLeftRight className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink dark:text-white">{t.from_name} <ArrowRight className="inline h-3 w-3 mx-1" /> {t.to_name}</p>
                  <p className="text-xs text-ink-soft">{formatDateShort(t.date)}{t.description ? ` • ${t.description}` : ''}</p>
                </div>
                <p className="text-sm font-semibold text-accent shrink-0">{formatRupiah(t.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
