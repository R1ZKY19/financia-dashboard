const VARIANTS = {
  success: 'bg-income/10 text-income',
  danger: 'bg-expense/10 text-expense',
  warning: 'bg-warn/10 text-warn',
  neutral: 'bg-black/5 dark:bg-white/10 text-ink-soft dark:text-gray-300',
  accent: 'bg-accent/10 text-accent',
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  );
}
