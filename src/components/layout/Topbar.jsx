import { Moon, Sun, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

export default function Topbar({ title, subtitle }) {
  const { theme, toggleTheme } = useApp();

  return (
    <div>
      {api.demoMode && (
        <div className="hidden lg:flex items-center gap-2 bg-warn/10 text-warn text-xs font-medium px-4 py-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Mode demo — data disimpan lokal di browser ini. Hubungkan Google Apps Script di file .env untuk data sungguhan.
        </div>
      )}
      <header className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-black/5 dark:border-white/10 bg-surface/70 dark:bg-navy-light/70 backdrop-blur sticky top-0 z-20">
        <div>
          <h1 className="text-lg font-bold text-ink dark:text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-ink-soft">{subtitle}</p>}
        </div>
        <button
          onClick={toggleTheme}
          className="h-9 w-9 rounded-full flex items-center justify-center border border-black/10 dark:border-white/10 text-ink dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>
    </div>
  );
}
