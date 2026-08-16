import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle, ListOrdered, Wallet,
  ArrowLeftRight, PiggyBank, Target, FileBarChart, LineChart, Tags, Settings,
} from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/pemasukan', label: 'Pemasukan', icon: ArrowDownCircle },
  { to: '/pengeluaran', label: 'Pengeluaran', icon: ArrowUpCircle },
  { to: '/transaksi', label: 'Transaksi', icon: ListOrdered },
  { to: '/rekening', label: 'Rekening', icon: Wallet },
  { to: '/transfer', label: 'Transfer', icon: ArrowLeftRight },
  { to: '/tabungan', label: 'Tabungan', icon: PiggyBank },
  { to: '/budget', label: 'Budget', icon: Target },
  { to: '/laporan', label: 'Laporan', icon: FileBarChart },
  { to: '/analitik', label: 'Analitik', icon: LineChart },
  { to: '/kategori', label: 'Kategori', icon: Tags },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
];

// subset paling penting untuk bottom navigation mobile
export const MOBILE_NAV_ITEMS = [
  NAV_ITEMS[0], // Dashboard
  NAV_ITEMS[3], // Transaksi
  null, // slot tombol tambah (floating)
  NAV_ITEMS[7], // Budget
  NAV_ITEMS[9], // Analitik
];
