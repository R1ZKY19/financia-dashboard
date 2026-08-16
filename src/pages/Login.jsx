import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Wallet2, Loader2, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { APP_NAME } from '../utils/constants';

export default function Login() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(api.demoMode ? 'demo@financia.app' : '');
  const [password, setPassword] = useState(api.demoMode ? 'demo1234' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password, remember);
      const to = location.state?.from && location.state.from !== '/login' ? location.state.from : '/dashboard';
      navigate(to, { replace: true });
    } catch (err) {
      setError(err.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />
        <div className="relative flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
            <Wallet2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">{APP_NAME}</span>
        </div>
        <div className="relative">
          <p className="text-white text-3xl font-bold leading-tight tracking-tight">
            Kelola keuangan pribadi Anda<br />dengan lebih percaya diri.
          </p>
          <p className="text-white/60 text-sm mt-4 max-w-md">
            Pantau pemasukan, pengeluaran, tabungan, dan budget dalam satu dashboard yang rapi dan aman.
          </p>
        </div>
        <p className="relative text-white/40 text-xs">© {new Date().getFullYear()} {APP_NAME}. Seluruh hak dilindungi.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="h-9 w-9 rounded-lg bg-navy flex items-center justify-center">
              <Wallet2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-ink tracking-tight">{APP_NAME}</span>
          </div>

          <h2 className="text-xl font-bold text-ink">Masuk ke akun Anda</h2>
          <p className="text-sm text-ink-soft mt-1">Masukkan email dan password untuk melanjutkan.</p>

          {api.demoMode && (
            <div className="mt-4 flex items-start gap-2 bg-accent/5 border border-accent/20 rounded-xl px-3.5 py-3 text-xs text-navy">
              <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <span>
                Mode demo aktif. Gunakan <strong>demo@financia.app</strong> / <strong>demo1234</strong> (sudah terisi otomatis).
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-expense bg-expense/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-soft cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-black/20 text-accent focus:ring-accent/40"
                />
                Ingat saya
              </label>
            </div>

            <button type="submit" className="btn-primary w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
