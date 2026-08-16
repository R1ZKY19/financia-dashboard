import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Topbar from './Topbar';

const PAGE_INFO = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Ringkasan keuangan Anda',
  },
  '/pemasukan': {
    title: 'Pemasukan',
    subtitle: 'Kelola seluruh pemasukan',
  },
  '/pengeluaran': {
    title: 'Pengeluaran',
    subtitle: 'Kelola seluruh pengeluaran',
  },
  '/transaksi': {
    title: 'Transaksi',
    subtitle: 'Riwayat seluruh transaksi',
  },
  '/rekening': {
    title: 'Rekening',
    subtitle: 'Kelola rekening dan saldo',
  },
  '/transfer': {
    title: 'Transfer',
    subtitle: 'Kelola transfer antar rekening',
  },
  '/tabungan': {
    title: 'Tabungan',
    subtitle: 'Pantau target dan tabungan',
  },
  '/budget': {
    title: 'Budget',
    subtitle: 'Kelola anggaran keuangan',
  },
  '/laporan': {
    title: 'Laporan',
    subtitle: 'Lihat laporan keuangan',
  },
  '/analitik': {
    title: 'Analitik',
    subtitle: 'Analisis kondisi keuangan',
  },
  '/kategori': {
    title: 'Kategori',
    subtitle: 'Kelola kategori transaksi',
  },
  '/pengaturan': {
    title: 'Pengaturan',
    subtitle: 'Pengaturan aplikasi',
  },
  '/profile': {
    title: 'Profile',
    subtitle: 'Kelola profile Anda',
  },
};

export default function AppLayout() {
  const location = useLocation();

  const currentPath = location.pathname || '/dashboard';

  const page = PAGE_INFO[currentPath] || {
    title: 'Dashboard',
    subtitle: 'Ringkasan keuangan Anda',
  };

  return (
    <div className="min-h-screen flex bg-bg dark:bg-navy-dark">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          title={page.title}
          subtitle={page.subtitle}
        />

        <MobileNav />

        <main className="flex-1 min-w-0 p-4 lg:p-6 pb-24 lg:pb-6 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}