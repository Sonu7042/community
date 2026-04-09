import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';

function AppShell() {
  return (
    <div className="min-h-screen bg-noise">
      <TopBar />
      <Outlet />
    </div>
  );
}

export default AppShell;
