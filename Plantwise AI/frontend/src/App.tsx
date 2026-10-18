import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { NewCheckPage } from './pages/NewCheckPage';
import { MapExplorerPage } from './pages/MapExplorerPage';
import { SchemesPage } from './pages/SchemesPage';
import { SpeciesPage } from './pages/SpeciesPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { AssistantPage } from './pages/AssistantPage';
import type { UserRole } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [userRole, setUserRole] = useState<UserRole>('citizen');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Default to dark mode unless 'light' is explicitly saved
    const savedTheme = localStorage.getItem('plantwise-theme');
    return savedTheme !== 'light';
  });
  const [navigationPayload, setNavigationPayload] = useState<any>(null);

  // Sync dark mode class on html root element and persist to localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('plantwise-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('plantwise-theme', 'light');
    }
  }, [darkMode]);

  const handleNavigate = (tab: string, payload?: any) => {
    setCurrentTab(tab);
    setNavigationPayload(payload || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'new-check':
        return (
          <NewCheckPage
            initialCoordinates={navigationPayload}
            onNavigate={handleNavigate}
          />
        );
      case 'map-explorer':
        return <MapExplorerPage onNavigate={handleNavigate} />;
      case 'schemes':
        return <SchemesPage />;
      case 'species':
        return <SpeciesPage />;
      case 'monitoring':
        return <MonitoringPage />;
      case 'certificates':
        return <CertificatesPage initialData={navigationPayload} />;
      case 'assistant':
        return <AssistantPage initialContext={navigationPayload} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => handleNavigate(tab)}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header
          currentTab={currentTab}
          userRole={userRole}
          onChangeRole={(role) => setUserRole(role)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        <main className="flex-1 pb-16">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
