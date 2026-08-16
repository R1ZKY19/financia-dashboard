export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Financia';

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Rumah',
  'Hiburan', 'Kesehatan', 'Pendidikan', 'Internet', 'Pulsa',
  'Investasi', 'Lainnya',
];

export const DEFAULT_INCOME_CATEGORIES = [
  'Gaji', 'Bonus', 'Freelance', 'Investasi', 'Hadiah', 'Lainnya',
];

export const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank' },
  { value: 'cash', label: 'Cash' },
  { value: 'ewallet', label: 'E-Wallet' },
  { value: 'other', label: 'Lainnya' },
];

export const CATEGORY_COLORS = [
  '#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#7C3AED',
  '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#4F46E5',
  '#0D9488', '#6B7280',
];

export const DATE_FILTER_OPTIONS = [
  { value: 'today', label: 'Hari ini' },
  { value: 'week', label: 'Minggu ini' },
  { value: 'month', label: 'Bulan ini' },
  { value: 'lastMonth', label: 'Bulan sebelumnya' },
  { value: 'year', label: 'Tahun ini' },
  { value: 'custom', label: 'Custom' },
];

export const PAGE_SIZE_OPTIONS = [25, 50, 100];

export const SAVING_STATUS = ['Aktif', 'Tercapai', 'Dibatalkan'];
