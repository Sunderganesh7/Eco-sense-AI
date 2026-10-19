import React from 'react';
import {
  Home,
  LayoutDashboard,
  MapPin,
  Compass,
  Award,
  Trees,
  Activity,
  FileCheck,
  Bot,
  ArrowLeft
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'new-check', label: 'Plantation Check', icon: MapPin },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map-explorer', label: 'Map Explorer', icon: Compass },
    { id: 'species', label: 'Species Catalog', icon: Trees },
    { id: 'schemes', label: 'Subsidies & Schemes', icon: Award },
    { id: 'monitoring', label: 'NDVI Monitoring', icon: Activity },
    { id: 'certificates', label: 'Certificates', icon: FileCheck },
    { id: 'assistant', label: 'Regulatory Assistant', icon: Bot },
  ];

  return (
    <aside className="w-60 shrink-0 bg-white dark:bg-[#131914] border-r border-[#e2e8e2] dark:border-[#232f25] flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-[#e2e8e2] dark:border-[#232f25] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-forest-700 dark:bg-forest-600 text-white flex items-center justify-center font-bold shadow-xs p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            <path d="M12 22C12 22 4 16 4 10C4 6.5 6.5 4 10 4C11.5 4 12 5.5 12 5.5C12 5.5 12.5 4 14 4C17.5 4 20 6.5 20 10C20 16 12 22 12 22Z" />
            <circle cx="12" cy="14" r="1.5" fill="currentColor" />
            <path d="M12 22V15.5" />
            <path d="M12 12.5V8" />
            <circle cx="12" cy="6.5" r="1" fill="currentColor" />
          </svg>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm tracking-tight text-forest-950 dark:text-forest-50">
            PlantWise AI
          </span>
          <span className="text-[10px] text-forest-700/60 dark:text-forest-400 font-mono">v1.0</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[#506154] dark:text-[#97a69b]">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                isActive
                  ? 'bg-forest-50 dark:bg-forest-950/70 text-forest-900 dark:text-forest-100 font-semibold border border-forest-200/80 dark:border-forest-800/60'
                  : 'text-[#506154] dark:text-[#97a69b] hover:bg-forest-50/50 dark:hover:bg-forest-950/30 hover:text-forest-900 dark:hover:text-forest-100'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-forest-700 dark:text-forest-400' : 'text-[#728477] dark:text-[#6e7d72]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="mt-3 mb-4 border-t border-[#e2e8e2] dark:border-[#232f25]"></div>
        
        <a
          href={import.meta.env.VITE_MAIN_PORTAL_URL || "https://eco-sense-ai-one.vercel.app"}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 mb-2 rounded-[10px] text-[13px] font-semibold transition-all duration-200 cursor-pointer border bg-emerald-50 border-emerald-200 text-forest-900 hover:bg-emerald-100 hover:border-emerald-300 hover:text-forest-950 dark:bg-emerald-500/10 dark:border-emerald-500/25 dark:text-emerald-50 dark:hover:bg-emerald-500/20 dark:hover:border-emerald-500/40 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 group"
        >
          <ArrowLeft className="w-[17px] h-[17px] shrink-0 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors" />
          <span>Back to EcoSense AI</span>
        </a>
      </nav>

      {/* Footer Status */}
      <div className="p-3 border-t border-[#e2e8e2] dark:border-[#232f25] text-[11px] text-[#506154] dark:text-[#97a69b] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-forest-600"></span>
          <span>Engine Online</span>
        </div>
        <span className="text-[10px] font-medium text-forest-800 dark:text-forest-400">MH-36</span>
      </div>
    </aside>
  );
};
