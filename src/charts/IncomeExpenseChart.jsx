import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatRupiah, formatDateShort } from '../utils/format';
import EmptyState from '../components/ui/EmptyState';
import { LineChart as LineChartIcon } from 'lucide-react';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-medium mb-1">{formatDateShort(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatRupiah(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function IncomeExpenseChart({ data = [] }) {
  if (!data.length) {
    return <EmptyState icon={LineChartIcon} title="Belum ada data" description="Grafik akan muncul setelah ada transaksi pada periode ini." />;
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#DC2626" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={48} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#16A34A" strokeWidth={2} fill="url(#incomeGrad)" />
        <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#DC2626" strokeWidth={2} fill="url(#expenseGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
