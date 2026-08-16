import { CheckCircle2, XCircle, X, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ICONS = {
  success: <CheckCircle2 className="h-5 w-5 text-income shrink-0" />,
  error: <XCircle className="h-5 w-5 text-expense shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-warn shrink-0" />,
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((t) => (
        <div key={t.id} className="card p-3.5 flex items-start gap-2.5 shadow-lg">
          {ICONS[t.type] || ICONS.success}
          <p className="text-sm text-ink dark:text-white flex-1">{t.message}</p>
          <button onClick={() => dismissToast(t.id)} className="text-ink-soft hover:text-ink dark:hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
