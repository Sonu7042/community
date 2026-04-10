import { Outlet } from 'react-router-dom';
import { ads, navItems, resourceItems } from '../data/mockData';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import TopBar from './TopBar';

function AppShell() {
  return (
    <div className="min-h-screen bg-noise">
      <TopBar />
      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-5 px-3 py-5 sm:px-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-6 xl:grid-cols-[260px_minmax(0,1fr)_260px] xl:gap-8">
        <div className="order-2 xl:order-1">
          <LeftSidebar navItems={navItems} resourceItems={resourceItems} />
        </div>

        <section className="order-1 min-w-0 xl:order-2">
          <Outlet />
        </section>

        <div className="order-3">
          <RightSidebar ads={ads} />
        </div>
      </main>
    </div>
  );
}

export default AppShell;
