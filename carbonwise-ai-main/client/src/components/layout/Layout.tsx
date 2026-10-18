import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f4fbf7]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
