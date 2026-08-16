import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatRupiah, formatDateShort } from '../utils/format';
import EmptyState from '../components/ui/EmptyState';
import { BarChart3 } from 'lucide-react';

export default function CashFlowChart({ data = [] }) {
  const chartData = data.map((d) => ({ date: d.date, net: d.income - d.expense }));
  if (!chartData.length) {
    return <EmptyState icon={BarChart3} title="Belum ada data" description="Cash flow akan tampil setelah ada transaksi." />;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={48} />
        <Tooltip formatter={(v) => formatRupiah(v)} labelFormatter={formatDateShort} />
        <Bar dataKey="net" radius={[4, 4, 4, 4]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.net >= 0 ? '#16A34A' : '#DC2626'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
