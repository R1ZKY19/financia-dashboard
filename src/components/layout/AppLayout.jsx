import { Outlet, useMatches } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Topbar from './Topbar';

export default function AppLayout() {
  const matches = useMatches();
  const current = [...matches].reverse().find((m) => m.handle?.title);
  const title = current?.handle?.title || 'Dashboard';
  const subtitle = current?.handle?.subtitle;

  return (
    <div className="min-h-screen flex bg-bg dark:bg-navy-dark">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={title} subtitle={subtitle} />
        <MobileNav />
        <main className="flex-1 min-w-0 p-4 lg:p-6 pb-24 lg:pb-6 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
