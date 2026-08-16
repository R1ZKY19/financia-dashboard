import { useCallback, useEffect, useState } from 'react';
import { Download, FileBarChart } from 'lucide-react';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ExpenseByCategoryChart from '../charts/ExpenseByCategoryChart';
import { api } from '../services/api';
import { useDateRange } from '../hooks/useDateRange';
import { formatRupiah, formatDateShort } from '../utils/format';
import { DATE_FILTER_OPTIONS } from '../utils/constants';
import { useApp } from '../context/AppContext';

export default function Laporan() {
  const { preset, setPreset, custom, setCustom, range } = useDateRange('month');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useApp();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setReport(await api.getReports(range));
    } catch (err) {
      setError(err.message || 'Gagal memuat laporan.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  function exportCSV() {
    if (!report?.transactions?.length) {
      showToast('Tidak ada data untuk diekspor.', 'warning');
      return;
    }
    const header = ['Tanggal', 'Jenis', 'Kategori', 'Nominal', 'Catatan'];
    const rows = report.transactions.map((t) => [
      t.date, t.type === 'income' ? 'Pemasukan' : 'Pengeluaran', t.category, t.amount, (t.description || '').replace(/,/g, ' '),
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-keuangan-${range.from}_${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Laporan CSV berhasil diunduh.');
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {DATE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPreset(opt.value)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                preset === opt.value ? 'bg-navy text-white border-navy' : 'bg-white dark:bg-navy-light text-ink-soft border-black/10 dark:border-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex gap-2">
            <input type="date" className="input !w-auto" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} />
            <input type="date" className="input !w-auto" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} />
          </div>
        )}
        <button onClick={exportCSV} className="btn-secondary sm:ml-auto">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {error ? (
        <Card><p className="text-sm text-expense">{error}</p></Card>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-24 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card><p className="text-xs text-ink-soft mb-1">Total Pemasukan</p><p className="text-lg font-bold text-income">{formatRupiah(report.income)}</p></Card>
            <Card><p className="text-xs text-ink-soft mb-1">Total Pengeluaran</p><p className="text-lg font-bold text-expense">{formatRupiah(report.expense)}</p></Card>
            <Card className="col-span-2 sm:col-span-1"><p className="text-xs text-ink-soft mb-1">Net Cash Flow</p><p className={`text-lg font-bold ${report.net >= 0 ? 'text-income' : 'text-expense'}`}>{formatRupiah(report.net)}</p></Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <h3 className="font-semibold text-sm text-ink dark:text-white mb-4">Laporan Kategori</h3>
              <ExpenseByCategoryChart data={report.byCategory} />
            </Card>
            <Card className="lg:col-span-2" padding={false}>
              <h3 className="font-semibold text-sm text-ink dark:text-white px-5 pt-5 mb-2">Laporan Rekening</h3>
              {!report.byAccount.length ? (
                <EmptyState icon={FileBarChart} title="Belum ada data" />
              ) : (
                <div className="px-5 pb-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-ink-soft border-b border-black/5 dark:border-white/5">
                        <th className="font-medium py-2">Rekening</th>
                        <th className="font-medium py-2 text-right">Pemasukan</th>
                        <th className="font-medium py-2 text-right">Pengeluaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {report.byAccount.map((a) => (
                        <tr key={a.name}>
                          <td className="py-2.5 text-ink dark:text-gray-200">{a.name}</td>
                          <td className="py-2.5 text-right text-income">{formatRupiah(a.income)}</td>
                          <td className="py-2.5 text-right text-expense">{formatRupiah(a.expense)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          <Card padding={false}>
            <h3 className="font-semibold text-sm text-ink dark:text-white px-5 pt-5 mb-2">Detail Transaksi</h3>
            {!report.transactions.length ? (
              <EmptyState title="Belum ada transaksi pada periode ini" />
            ) : (
              <div className="overflow-x-auto px-5 pb-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink-soft border-b border-black/5 dark:border-white/5">
                      <th className="font-medium py-2">Tanggal</th>
                      <th className="font-medium py-2">Jenis</th>
                      <th className="font-medium py-2">Kategori</th>
                      <th className="font-medium py-2 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {report.transactions.slice(0, 100).map((t) => (
                      <tr key={t.id}>
                        <td className="py-2 text-ink-soft whitespace-nowrap">{formatDateShort(t.date)}</td>
                        <td className="py-2">{t.type === 'income' ? <span className="text-income text-xs">Masuk</span> : <span className="text-expense text-xs">Keluar</span>}</td>
                        <td className="py-2 text-ink dark:text-gray-200">{t.category}</td>
                        <td className={`py-2 text-right font-medium ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>{formatRupiah(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
