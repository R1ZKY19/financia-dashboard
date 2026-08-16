import { formatRupiah, formatPercent } from '../utils/format';

export default function SavingProgress({ name, current, target, compact }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div className={compact ? '' : 'space-y-1.5'}>
      {!compact && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-ink dark:text-white">{name}</span>
          <span className="text-ink-soft text-xs">{formatPercent(pct)}</span>
        </div>
      )}
      <div className="h-2.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {!compact && (
        <div className="flex items-center justify-between text-xs text-ink-soft">
          <span>{formatRupiah(current)}</span>
          <span>{formatRupiah(target)}</span>
        </div>
      )}
    </div>
  );
}
