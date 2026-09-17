import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-8 py-7 max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}
