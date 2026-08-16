import { useCallback, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Flame, Tag, Repeat, ArrowUpDown } from 'lucide-react';
import Card from '../components/ui/Card';
import IncomeExpenseChart from '../charts/IncomeExpenseChart';
import { api } from '../services/api';
import { useDateRange } from '../hooks/useDateRange';
import { formatRupiah, formatPercent, formatDateShort } from '../utils/format';
import { DATE_FILTER_OPTIONS } from '../utils/constants';

function MetricCard({ icon: Icon, label, value, tone = 'accent', sub }) {
  const toneClass = { accent: 'text-accent bg-accent/10', income: 'text-income bg-income/10', expense: 'text-expense bg-expense/10', warn: 'text-warn bg-warn/10' }[tone];
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${toneClass}`}>
          <Icon className="h-4.5 w-4.5" size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-ink-soft truncate">{label}</p>
          <p className="text-base font-bold text-ink dark:text-white truncate">{value}</p>
          {sub && <p className="text-xs text-ink-soft truncate">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

export default function Analitik() {
  const { preset, setPreset, range } = useDateRange('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api.getAnalytics(range));
    } catch (err) {
      setError(err.message || 'Gagal memuat analitik.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {DATE_FILTER_OPTIONS.filter((o) => o.value !== 'custom').map((opt) => (
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

      {error ? (
        <Card><p className="text-sm text-expense">{error}</p></Card>
      ) : loading || !data ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Card key={i} className="h-20 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard icon={TrendingUp} label="Total Income" value={formatRupiah(data.totalIncome)} tone="income" />
            <MetricCard icon={TrendingDown} label="Total Expense" value={formatRupiah(data.totalExpense)} tone="expense" />
            <MetricCard icon={ArrowUpDown} label="Net Cash Flow" value={formatRupiah(data.netCashFlow)} tone={data.netCashFlow >= 0 ? 'income' : 'expense'} />
            <MetricCard icon={PiggyBank} label="Saving Rate" value={formatPercent(data.savingRate)} tone="accent" />
            <MetricCard icon={Flame} label="Rata-rata Harian" value={formatRupiah(data.avgDailySpending)} tone="warn" sub="pengeluaran" />
            <MetricCard icon={Flame} label="Rata-rata Bulanan" value={formatRupiah(data.avgMonthlySpending)} tone="warn" sub="estimasi" />
            <MetricCard icon={Tag} label="Kategori Terbesar" value={data.largestExpenseCategory} tone="accent" />
            <MetricCard icon={Repeat} label="Kategori Tersering" value={data.mostFrequentCategory} tone="accent" />
          </div>

          <Card>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-ink dark:text-white">Trend Keuangan</h3>
              <span className={`text-xs font-medium ${data.expenseChangePct <= 0 ? 'text-income' : 'text-expense'}`}>
                {data.expenseChangePct <= 0 ? '▼' : '▲'} {formatPercent(Math.abs(data.expenseChangePct))} vs periode sebelumnya
              </span>
            </div>
            <div className="mt-3">
              <IncomeExpenseChart data={data.trendSeries} />
            </div>
          </Card>

          {data.largestExpense && (
            <Card>
              <h3 className="font-semibold text-sm text-ink dark:text-white mb-3">Pengeluaran Terbesar</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink dark:text-white">{data.largestExpense.category}</p>
                  <p className="text-xs text-ink-soft">{formatDateShort(data.largestExpense.date)} {data.largestExpense.description ? `• ${data.largestExpense.description}` : ''}</p>
                </div>
                <p className="text-lg font-bold text-expense">{formatRupiah(data.largestExpense.amount)}</p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
