import { useEffect, useState } from 'react';
import { User, Mail, ShieldCheck, Clock, LogOut } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { formatDateFull } from '../utils/format';

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-xl space-y-5">
      <Card>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-navy text-white flex items-center justify-center text-xl font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-ink dark:text-white truncate">{user?.name}</p>
            <p className="text-sm text-ink-soft truncate">{user?.email}</p>
            <Badge variant="success" className="mt-1.5">Akun Aktif</Badge>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-sm text-ink dark:text-white mb-4">Informasi Akun</h3>
        <div className="space-y-3">
          <Row icon={User} label="Nama" value={user?.name} />
          <Row icon={Mail} label="Email" value={user?.email} />
          <Row icon={ShieldCheck} label="Status" value="Aktif" />
          <Row icon={Clock} label="Login Terakhir" value={user?.last_login ? formatDateFull(user.last_login) : '-'} />
        </div>
      </Card>

      <button onClick={logout} className="btn-danger w-full">
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-black/5 dark:border-white/5 last:border-0">
      <Icon className="h-4 w-4 text-ink-soft shrink-0" />
      <span className="text-xs text-ink-soft w-28 shrink-0">{label}</span>
      <span className="text-sm text-ink dark:text-white truncate">{value || '-'}</span>
    </div>
  );
}
