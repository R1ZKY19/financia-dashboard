import { useState } from 'react';
import { Moon, Sun, KeyRound, Trash2, ShieldCheck } from 'lucide-react';
import Card from '../components/ui/Card';
import ConfirmModal from '../components/ui/ConfirmModal';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { resetDemoData } from '../services/localStore';
import { APP_NAME } from '../utils/constants';

export default function Pengaturan() {
  const { theme, toggleTheme, showToast } = useApp();
  const { user, logout } = useAuth();

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPassword.length < 8) { setPwError('Password baru minimal 8 karakter.'); return; }
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('Konfirmasi password tidak sesuai.'); return; }
    setPwSaving(true);
    try {
      await api.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      showToast('Password berhasil diperbarui.');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPwError(err.message || 'Gagal mengubah password.');
    } finally {
      setPwSaving(false);
    }
  }

  function handleResetDemo() {
    resetDemoData();
    showToast('Data demo direset. Anda akan diarahkan ke login.');
    setResetConfirmOpen(false);
    setTimeout(() => logout(), 800);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Card>
        <h3 className="font-semibold text-sm text-ink dark:text-white mb-4">General</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink dark:text-white">Nama Pengguna</p>
              <p className="text-xs text-ink-soft">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink dark:text-white">Mata Uang</p>
              <p className="text-xs text-ink-soft">Rupiah Indonesia (IDR / Rp)</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/10">
            <div>
              <p className="text-sm text-ink dark:text-white">Dark Mode</p>
              <p className="text-xs text-ink-soft">Tampilan gelap untuk kenyamanan mata</p>
            </div>
            <button
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full flex items-center justify-center border border-black/10 dark:border-white/10 text-ink dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-sm text-ink dark:text-white">Keamanan — Ubah Password</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="label">Password Saat Ini</label>
            <input type="password" className="input" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Password Baru</label>
              <input type="password" className="input" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
            </div>
            <div>
              <label className="label">Konfirmasi Password Baru</label>
              <input type="password" className="input" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
            </div>
          </div>
          {pwError && <p className="text-xs text-expense">{pwError}</p>}
          <button type="submit" className="btn-primary" disabled={pwSaving}>{pwSaving ? 'Menyimpan...' : 'Simpan Password'}</button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-sm text-ink dark:text-white">Sesi</h3>
        </div>
        <p className="text-xs text-ink-soft mb-3">Sesi login memiliki masa berlaku otomatis. Keluar dari semua perangkat jika Anda mencurigai adanya akses tidak sah.</p>
        <button onClick={logout} className="btn-secondary">Logout dari perangkat ini</button>
      </Card>

      {api.demoMode && (
        <Card className="border-warn/30">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="h-4 w-4 text-warn" />
            <h3 className="font-semibold text-sm text-ink dark:text-white">Mode Demo</h3>
          </div>
          <p className="text-xs text-ink-soft mb-3">
            Aplikasi berjalan dalam mode demo (data tersimpan lokal di browser). Anda dapat mereset seluruh data demo kapan saja.
          </p>
          <button onClick={() => setResetConfirmOpen(true)} className="btn-danger">Reset Data Demo</button>
        </Card>
      )}

      <ConfirmModal
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleResetDemo}
        title="Reset Data Demo"
        confirmLabel="Reset"
        message={`Seluruh data demo ${APP_NAME} di browser ini akan dihapus dan dibuat ulang. Lanjutkan?`}
      />
    </div>
  );
}
