import { formatRupiah } from '../../utils/format';

const TONE = {
  navy: 'bg-navy text-white',
  income: 'bg-income/10 text-income',
  expense: 'bg-expense/10 text-expense',
  accent: 'bg-accent/10 text-accent',
  warn: 'bg-warn/10 text-warn',
};

export default function StatCard({ label, value, icon: Icon, tone = 'accent', sub, highlight }) {
  return (
    <div className={`card p-5 ${highlight ? 'bg-navy text-white' : ''}`}>
      <div className="flex items-start justify-between">
        <p className={`text-xs font-medium ${highlight ? 'text-white/70' : 'text-ink-soft dark:text-gray-400'}`}>{label}</p>
        {Icon && (
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${highlight ? 'bg-white/10' : TONE[tone]}`}>
            <Icon className={`h-4 w-4 ${highlight ? 'text-white' : ''}`} strokeWidth={2} />
          </div>
        )}
      </div>
      <p className={`text-xl sm:text-2xl font-bold mt-2 tracking-tight ${highlight ? 'text-white' : 'text-ink dark:text-white'}`}>
        {formatRupiah(value)}
      </p>
      {sub && <p className={`text-xs mt-1.5 ${highlight ? 'text-white/60' : 'text-ink-soft'}`}>{sub}</p>}
    </div>
  );
}
