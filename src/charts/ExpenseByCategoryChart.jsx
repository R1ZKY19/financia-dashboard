import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatRupiah } from '../utils/format';
import { CATEGORY_COLORS } from '../utils/constants';
import EmptyState from '../components/ui/EmptyState';
import { PieChart as PieChartIcon } from 'lucide-react';

export default function ExpenseByCategoryChart({ data = [] }) {
  if (!data.length) {
    return <EmptyState icon={PieChartIcon} title="Belum ada pengeluaran" description="Kategori pengeluaran akan tampil di sini." />;
  }
  const sorted = [...data].sort((a, b) => b.value - a.value);
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={sorted} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip formatter={(v) => formatRupiah(v)} />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          wrapperStyle={{ fontSize: 12, lineHeight: '20px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
