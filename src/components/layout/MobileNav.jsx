import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, Plus, X, LogOut, User } from 'lucide-react';
import { MOBILE_NAV_ITEMS, NAV_ITEMS } from './navConfig';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../utils/constants';

export default function MobileNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface dark:bg-navy-light border-t border-black/5 dark:border-white/10 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 items-center h-16">
          {MOBILE_NAV_ITEMS.map((item, idx) => {
            if (!item) {
              return (
                <div key="add" className="flex items-center justify-center">
                  <button
                    onClick={() => navigate('/pengeluaran?add=1')}
                    className="h-12 w-12 -mt-6 rounded-full bg-navy text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    aria-label="Tambah Transaksi"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              );
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 text-[10px] font-medium ${
                    isActive ? 'text-accent' : 'text-ink-soft'
                  }`
                }
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Top bar with hamburger for mobile */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-surface/90 dark:bg-navy-light/90 backdrop-blur border-b border-black/5 dark:border-white/10">
        <button onClick={() => setDrawerOpen(true)} className="p-2 -ml-2 text-ink dark:text-white">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-bold text-ink dark:text-white text-sm">{APP_NAME}</span>
        <NavLink to="/profile" className="p-2 -mr-2 text-ink dark:text-white">
          <User className="h-5 w-5" />
        </NavLink>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-navy-dark/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-navy text-white flex flex-col animate-[slideUp_.2s_ease]">
            <div className="flex items-center justify-between h-14 px-4 border-b border-white/10">
              <span className="font-bold text-sm">{APP_NAME}</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                      isActive ? 'bg-white/10 text-white' : 'text-white/60'
                    }`
                  }
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-white/10 p-3">
              <p className="px-3 text-xs text-white/40 mb-1">{user?.email}</p>
              <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60">
                <LogOut className="h-[18px] w-[18px]" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
