import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS } from '../../utils/constants';

export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-black/5 dark:border-white/10 mt-2">
      <div className="flex items-center gap-2 text-xs text-ink-soft">
        <span>{total === 0 ? 'Tidak ada data' : `${start}–${end} dari ${total}`}</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border border-black/10 dark:border-white/10 rounded-lg text-xs px-2 py-1 bg-white dark:bg-navy dark:text-white"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} / halaman</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/10 disabled:opacity-40 hover:bg-black/5 dark:hover:bg-white/10 dark:text-white"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs text-ink-soft px-2">Hal {page} / {totalPages}</span>
        <button
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/10 disabled:opacity-40 hover:bg-black/5 dark:hover:bg-white/10 dark:text-white"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
