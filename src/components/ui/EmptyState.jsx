import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Belum ada data', description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-accent" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-semibold text-ink dark:text-white">{title}</p>
      {description && <p className="text-sm text-ink-soft mt-1 max-w-xs">{description}</p>}
      {actionLabel && (
        <button onClick={onAction} className="btn-primary mt-4">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
