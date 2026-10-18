import React from 'react';
import { Sun, Moon } from 'lucide-react';
import type { UserRole } from '../../types';

interface HeaderProps {
  currentTab: string;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  userRole,
  onChangeRole,
  darkMode,
  onToggleDarkMode
}) => {
  const getTabLabel = (id: string) => {
    switch (id) {
      case 'home': return 'Platform Overview';
      case 'dashboard': return 'Dashboard & Summary';
      case 'new-check': return 'Plantation Compliance Check';
      case 'map-explorer': return 'GIS Map & Zoning Explorer';
      case 'schemes': return 'Government Subsidies & Schemes';
      case 'species': return 'Indigenous Species Database';
      case 'monitoring': return 'NDVI & Growth Tracking';
      case 'certificates': return 'Plantation Certificates';
      case 'assistant': return 'Legal Assistant & Drafter';
      default: return 'Overview';
    }
  };

  return (
    <header className="h-14 px-6 bg-white dark:bg-[#131914] border-b border-[#e2e8e2] dark:border-[#232f25] flex items-center justify-between sticky top-0 z-20">
      {/* Title */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-forest-950 dark:text-forest-50 text-sm">
          {getTabLabel(currentTab)}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Role Selector */}
        <div className="flex items-center bg-forest-50/70 dark:bg-forest-950/50 p-0.5 rounded-lg text-xs font-medium border border-forest-200/60 dark:border-forest-800/50">
          {(['citizen', 'ngo', 'officer'] as UserRole[]).map((r) => {
            const labels: Record<UserRole, string> = {
              citizen: 'Citizen',
              ngo: 'NGO / CSR',
              officer: 'Tree Officer'
            };
            const isSelected = userRole === r;
            return (
              <button
                key={r}
                onClick={() => onChangeRole(r)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-forest-800 text-forest-900 dark:text-forest-50 shadow-xs font-semibold'
                    : 'text-[#506154] dark:text-[#97a69b] hover:text-forest-900 dark:hover:text-forest-100'
                }`}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          aria-label="Toggle theme"
          className="p-1.5 rounded-lg border border-[#e2e8e2] dark:border-[#232f25] bg-white dark:bg-[#131914] text-[#506154] dark:text-[#97a69b] hover:bg-forest-50/60 dark:hover:bg-forest-950/40 hover:text-forest-900 dark:hover:text-forest-100 transition-colors cursor-pointer"
        >
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
