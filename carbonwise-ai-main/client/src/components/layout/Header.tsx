import { useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();

  // Basic breadcrumb generation
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPage = pathParts.length > 0
    ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1)
    : 'Dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 flex h-16 items-center justify-between px-6 lg:px-10">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[14px] font-semibold">
        <span className="text-[#059669] flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"></path></svg>
          CarbonWise
        </span>
        <span className="text-slate-400">/</span>
        <span className="text-slate-600">{currentPage}</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-[300px]">
          <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input
            type="text"
            placeholder="Search data, insights or features..."
            className="bg-transparent border-none outline-none text-[13px] text-slate-600 w-full placeholder:text-slate-400"
          />
          <div className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded ml-2">Ctrl + K</div>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1 w-[52px]">
            <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 ml-auto">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            </div>
          </div>

          {/* Notifications */}
          <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span className="absolute 0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4 ml-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-bold shadow-md">
              DG
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-[13px] font-bold text-slate-800 leading-none mb-1">Dr. Sunder Ganesh</span>
              <span className="text-[11px] text-slate-500 font-medium leading-none">Admin</span>
            </div>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>
    </header>
  );
}
