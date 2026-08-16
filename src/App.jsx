import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ToastContainer from './components/ui/Toast';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pemasukan from './pages/Pemasukan';
import Pengeluaran from './pages/Pengeluaran';
import Transaksi from './pages/Transaksi';
import Rekening from './pages/Rekening';
import Transfer from './pages/Transfer';
import Tabungan from './pages/Tabungan';
import Budget from './pages/Budget';
import Laporan from './pages/Laporan';
import Analitik from './pages/Analitik';
import Kategori from './pages/Kategori';
import Pengaturan from './pages/Pengaturan';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <HashRouter>
          <ToastContainer />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} handle={{ title: 'Dashboard' }} />
              <Route path="/pemasukan" element={<Pemasukan />} handle={{ title: 'Pemasukan' }} />
              <Route path="/pengeluaran" element={<Pengeluaran />} handle={{ title: 'Pengeluaran' }} />
              <Route path="/transaksi" element={<Transaksi />} handle={{ title: 'Transaksi' }} />
              <Route path="/rekening" element={<Rekening />} handle={{ title: 'Rekening' }} />
              <Route path="/transfer" element={<Transfer />} handle={{ title: 'Transfer' }} />
              <Route path="/tabungan" element={<Tabungan />} handle={{ title: 'Tabungan' }} />
              <Route path="/budget" element={<Budget />} handle={{ title: 'Budget' }} />
              <Route path="/laporan" element={<Laporan />} handle={{ title: 'Laporan' }} />
              <Route path="/analitik" element={<Analitik />} handle={{ title: 'Analitik' }} />
              <Route path="/kategori" element={<Kategori />} handle={{ title: 'Kategori' }} />
              <Route path="/pengaturan" element={<Pengaturan />} handle={{ title: 'Pengaturan' }} />
              <Route path="/profile" element={<Profile />} handle={{ title: 'Profile' }} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </AppProvider>
  );
}
