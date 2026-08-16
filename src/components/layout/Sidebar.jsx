import { NavLink } from 'react-router-dom';
import { ChevronsLeft, LogOut, User, Wallet2 } from 'lucide-react';
import { NAV_ITEMS } from './navConfig';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../utils/constants';

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useApp();
  const { user, logout } = useAuth();

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 bg-navy text-white transition-all duration-200 ${
        sidebarCollapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/10 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Wallet2 className="h-4.5 w-4.5 text-white" size={18} />
        </div>
        {!sidebarCollapsed && <span className="font-bold text-[15px] tracking-tight">{APP_NAME}</span>}
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            {!sidebarCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-0.5 shrink-0">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <User className="h-[18px] w-[18px] shrink-0" />
          {!sidebarCollapsed && <span className="truncate">{user?.name || 'Profile'}</span>}
        </NavLink>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setSidebarCollapsed((c) => !c)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <ChevronsLeft className={`h-4 w-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          {!sidebarCollapsed && <span>Ciutkan</span>}
        </button>
      </div>
    </aside>
  );
}
