import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Target, Sparkles,
  ArrowUpRight, ArrowDownRight, ArrowLeftRight, RefreshCcw,
} from 'lucide-react';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import { SkeletonCard, SkeletonRow } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import IncomeExpenseChart from '../charts/IncomeExpenseChart';
import ExpenseByCategoryChart from '../charts/ExpenseByCategoryChart';
import { api } from '../services/api';
import { useDateRange } from '../hooks/useDateRange';
import { formatRupiah, formatDateShort } from '../utils/format';
import { DATE_FILTER_OPTIONS } from '../utils/constants';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { preset, setPreset, range } = useDateRange('month');
  const [data, setData] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useApp();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, rep] = await Promise.all([
        api.getDashboard(range),
        api.getReports({ ...range, groupBy: 'category' }),
      ]);
      setData(dash);
      setReport(rep);
    } catch (err) {
      setError(err.message || 'Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const insights = data ? buildInsights(data, report) : [];

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {DATE_FILTER_OPTIONS.filter((o) => o.value !== 'custom').map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPreset(opt.value)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              preset === opt.value
                ? 'bg-navy text-white border-navy'
                : 'bg-white dark:bg-navy-light text-ink-soft border-black/10 dark:border-white/10 hover:bg-black/5'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button onClick={load} className="shrink-0 ml-auto p-2 rounded-full text-ink-soft hover:bg-black/5 dark:hover:bg-white/10" title="Muat ulang">
          <RefreshCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {error && (
        <Card className="border-expense/20">
          <p className="text-sm text-expense mb-2">{error}</p>
          <button onClick={load} className="btn-secondary text-xs">Coba lagi</button>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {loading || !data ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Total Saldo" value={data.totalBalance} icon={Wallet} highlight />
            <StatCard label="Pemasukan" value={data.income} icon={TrendingUp} tone="income" />
            <StatCard label="Pengeluaran" value={data.expense} icon={TrendingDown} tone="expense" />
            <StatCard label="Tabungan" value={data.totalSaving} icon={PiggyBank} tone="accent" />
            <StatCard label="Sisa Budget" value={data.sisaBudget} icon={Target} tone={data.sisaBudget < 0 ? 'expense' : 'warn'} />
          </>
        )}
      </div>

      {/* Insights */}
      {!loading && insights.length > 0 && (
        <Card className="bg-gradient-to-br from-accent/5 to-transparent border-accent/10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-accent" />
            <h3 className="font-semibold text-sm text-ink dark:text-white">Insight Keuangan</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {insights.map((text, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-ink dark:text-gray-200 bg-white/60 dark:bg-white/5 rounded-xl px-3 py-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-sm text-ink dark:text-white mb-4">Income vs Expense</h3>
          {loading ? <div className="h-[280px] animate-pulse bg-black/5 dark:bg-white/5 rounded-xl" /> : <IncomeExpenseChart data={report?.transactions ? buildSeries(report.transactions) : []} />}
        </Card>
        <Card>
          <h3 className="font-semibold text-sm text-ink dark:text-white mb-4">Pengeluaran per Kategori</h3>
          {loading ? <div className="h-[280px] animate-pulse bg-black/5 dark:bg-white/5 rounded-xl" /> : <ExpenseByCategoryChart data={report?.byCategory || []} />}
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-ink dark:text-white">Transaksi Terbaru</h3>
          <Link to="/transaksi" className="text-xs text-accent font-medium hover:underline">Lihat semua</Link>
        </div>
        {loading ? (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : !data?.recentTransactions?.length ? (
          <EmptyState title="Belum ada transaksi" description="Mulai catat pemasukan atau pengeluaran Anda." actionLabel="+ Tambah Transaksi" onAction={() => (window.location.href = '/pengeluaran')} />
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {data.recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-income/10' : 'bg-expense/10'}`}>
                  {t.type === 'income' ? <ArrowDownRight className="h-4 w-4 text-income" /> : <ArrowUpRight className="h-4 w-4 text-expense" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink dark:text-white truncate">{t.category}</p>
                  <p className="text-xs text-ink-soft">{formatDateShort(t.date)}</p>
                </div>
                <p className={`text-sm font-semibold shrink-0 ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function buildSeries(transactions) {
  const map = {};
  transactions.forEach((t) => {
    map[t.date] = map[t.date] || { date: t.date, income: 0, expense: 0 };
    map[t.date][t.type] += Number(t.amount);
  });
  return Object.values(map).sort((a, b) => (a.date > b.date ? 1 : -1));
}

function buildInsights(data, report) {
  const insights = [];
  if (data.netCashFlow >= 0) {
    insights.push(`Cash flow periode ini positif ${formatRupiah(data.netCashFlow)}.`);
  } else {
    insights.push(`Cash flow periode ini negatif ${formatRupiah(Math.abs(data.netCashFlow))}. Perhatikan pengeluaran Anda.`);
  }
  if (report?.byCategory?.length) {
    const top = [...report.byCategory].sort((a, b) => b.value - a.value)[0];
    if (top) insights.push(`Kategori "${top.name}" menjadi pengeluaran terbesar periode ini sebesar ${formatRupiah(top.value)}.`);
  }
  if (data.totalBudget > 0) {
    const usedPct = ((data.totalBudget - data.sisaBudget) / data.totalBudget) * 100;
    insights.push(`Anda telah menggunakan ${usedPct.toFixed(0)}% dari total budget bulan ini.`);
  }
  return insights;
}
