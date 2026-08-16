// Helper format Rupiah & tanggal. Database selalu menyimpan angka murni (number),
// helper ini hanya untuk tampilan (presentation layer).

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format angka menjadi "Rp 1.500.000"
 * @param {number|string} value
 */
export function formatRupiah(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 'Rp 0';
  // Intl formatter gives "Rp1.500.000" (no space) in id-ID, normalize spacing
  return idrFormatter.format(num).replace('Rp', 'Rp ').replace(/\s+/g, ' ').trim();
}

/**
 * Parse input string "1.500.000" atau "1500000" menjadi number murni 1500000
 * @param {string} input
 */
export function parseRupiah(input) {
  if (typeof input === 'number') return input;
  if (!input) return 0;
  const cleaned = String(input).replace(/[^0-9-]/g, '');
  const num = parseInt(cleaned, 10);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Format angka dengan pemisah ribuan saja (tanpa "Rp"), untuk input field.
 */
export function formatNumberInput(value) {
  const num = parseRupiah(value);
  if (!num) return '';
  return num.toLocaleString('id-ID');
}

const MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

/**
 * Format tanggal ISO "2026-08-16" -> "16 Agustus 2026"
 */
export function formatDateFull(dateStr) {
  const d = toDate(dateStr);
  if (!d) return '-';
  return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format tanggal ISO "2026-08-16" -> "16 Agu 2026"
 */
export function formatDateShort(dateStr) {
  const d = toDate(dateStr);
  if (!d) return '-';
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMonthYear(dateStr) {
  const d = toDate(dateStr);
  if (!d) return '-';
  return `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

function toDate(dateStr) {
  if (!dateStr) return null;
  const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/** ISO date string of today, e.g. "2026-08-16" */
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatPercent(value, digits = 1) {
  const num = Number(value);
  if (Number.isNaN(num)) return '0%';
  return `${num.toFixed(digits).replace('.', ',')}%`;
}
