import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LocationProvider, useLocation as useDetectedLocation } from './contexts/LocationContext'
import LanguageSwitcher from './components/LanguageSwitcher'
import AzureTranslate from './components/AzureTranslate'
import Dashboard from './pages/Dashboard'
import Recommend from './pages/Recommend'
import Fields from './pages/Fields'
import Market from './pages/Market'
import Planner from './pages/Planner'
import Profile from './pages/Profile'
import YieldPredict from './pages/YieldPredict'
// DiseaseDetection merged into FieldScanner
import PestAlerts from './pages/PestAlerts'
import Fertilizer from './pages/Fertilizer'
import Community from './pages/Community'
import Feedback from './pages/Feedback'
import Login from './pages/Login'
import Landing from './pages/Landing'
import WhatIfSimulator from './pages/WhatIfSimulator'
import SmartAlerts from './pages/SmartAlerts'
import ProfitPlanner from './pages/ProfitPlanner'
import FieldScanner from './pages/FieldScanner'

const MAIN_PORTAL_URL = import.meta.env.VITE_MAIN_PORTAL_URL || 'https://eco-sense-ai-one.vercel.app';
import Weather from './pages/Weather'
import Schemes from './pages/Schemes'
import Loans from './pages/Loans'

/* ─── Navigation Config ─────────────────────────────── */
const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Dashboard', path: '/', end: true },
  { icon: 'cloud', label: 'Weather', path: '/weather' },
  { icon: 'psychology', label: 'Crop Advisory', path: '/recommend' },
  { icon: 'document_scanner', label: 'Disease Scanner', path: '/disease' },
  { icon: 'map', label: 'My Fields', path: '/fields' },
  { icon: 'agriculture', label: 'Rotation Planner', path: '/planner' },
  { icon: 'trending_up', label: 'Market Prices', path: '/market' },
  { icon: 'query_stats', label: 'Yield Prediction', path: '/yield' },
  { icon: 'warning', label: 'Pest Alerts', path: '/pests' },
  { icon: 'water_drop', label: 'Fertilizer', path: '/fertilizer' },
  { icon: 'tune', label: 'What-If Simulator', path: '/simulator' },
  // ── MORE TOOLS
  { section: 'MORE TOOLS' },
  { icon: 'payments', label: 'Profit Planner', path: '/profit-planner' },
  { icon: 'account_balance', label: 'Schemes', path: '/schemes' },
  { icon: 'groups', label: 'Community', path: '/community' },
  { icon: 'forum', label: 'Feedback', path: '/feedback' },
]

const BOTTOM_NAV_ITEMS = [
  { icon: 'dashboard', label: 'Home', path: '/', end: true },
  { icon: 'psychology', label: 'Advisory', path: '/recommend' },
  { icon: 'map', label: 'Fields', path: '/fields' },
  { icon: 'trending_up', label: 'Market', path: '/market' },
]

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/recommend': 'Crop Advisory',
  '/disease': 'Disease Scanner',
  '/pests': 'Pest Alerts',
  '/fields': 'My Fields',
  '/planner': 'Rotation Planner',
  '/fertilizer': 'Fertilizer & Remedies',
  '/market': 'Market Prices',
  '/yield': 'Yield Prediction',
  '/community': 'Community Hub',
  '/feedback': 'Feedback',
  '/profile': 'Profile',
  '/weather': 'Weather',
  '/simulator': 'What-If Simulator',
  '/smart-alerts': 'Smart Alerts',
  '/profit-planner': 'Profit Planner',
  '/field-scanner': 'Disease Scanner',
  '/schemes': 'Government Schemes',
  '/loans': 'Farmer Loans',
}

/* ─── Sidebar (Desktop) ─────────────────────────────── */
function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth()
  const location = useLocation()

  // Close sidebar on route change (mobile)
  useEffect(() => { onClose() }, [location.pathname])

  const displayName = user?.name || user?.phone || 'Sunderganesh'
  const displayInitial = (displayName || 'S')[0].toUpperCase()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[199] md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-[200]
        w-[250px] bg-[#042F25] text-white flex flex-col justify-between
        transition-transform duration-300 ease-out overflow-hidden select-none
        border-r border-[#073D30]
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand & Navigation */}
        <div className="overflow-y-auto hide-scrollbar flex-1">
          <div className="px-5 pt-6 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo mark */}
                <div className="w-10 h-10 rounded-xl bg-[#087F5B] flex items-center justify-center text-white shadow-inner">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                </div>
                <div>
                  <h1 className="font-headline font-extrabold text-white text-[17px] tracking-tight leading-none">AgriSense AI</h1>
                  <p className="font-label text-[9px] tracking-[0.18em] text-[#78A796] uppercase font-bold mt-1">
                    <AzureTranslate text="SMART AGRICULTURE" />
                  </p>
                </div>
              </div>
              {/* Mobile close */}
              <button
                className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/70"
                onClick={onClose}
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 px-3 pb-3">
            {NAV_ITEMS.map((item, idx) => {
              if (item.section) {
                return (
                  <div key={`section-${item.section}`} className="px-3 pt-5 pb-1">
                    <span className="font-label text-[10px] font-bold text-[#5A7E70] uppercase tracking-[0.16em]">
                      <AzureTranslate text={item.section} />
                    </span>
                  </div>
                )
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    isActive
                      ? 'flex items-center gap-3 bg-[#9DEBC1] text-[#042F25] font-bold rounded-xl px-3.5 py-2.5 transition-all font-body text-[13px] shadow-sm'
                      : 'flex items-center gap-3 text-[#94A99F] hover:text-white hover:bg-white/5 rounded-xl px-3.5 py-2.5 transition-colors duration-150 font-body text-[13px] font-medium'
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`material-symbols-outlined text-[19px] ${isActive ? 'text-[#042F25]' : 'text-[#7A988C]'}`}
                        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate"><AzureTranslate text={item.label} /></span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section (Always docked at bottom of sidebar) */}
        <div className="p-3 border-t border-[#073D30] space-y-2.5 shrink-0 bg-[#042F25]">
          {/* Back to Eco Sense AI Button */}
          <a
            href={MAIN_PORTAL_URL}
            id="back-to-ecosense-btn"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-[#A8E6CF] hover:bg-[#8EE0BF] text-[#042F25] font-bold text-[13px] shadow-sm hover:shadow transition-all group cursor-pointer"
            title="Back to Eco Sense AI"
          >
            <span className="text-base leading-none font-bold transition-transform group-hover:-translate-x-1">←</span>
            <span className="font-body font-bold">Back to Eco Sense AI</span>
          </a>

          {/* User Profile Section */}
          <div className="bg-[#063B2F] border border-[#085241] rounded-2xl p-2.5 flex items-center justify-between gap-2.5">
            <NavLink to="/profile" className="flex items-center gap-2.5 min-w-0 flex-1 group">
              <div className="w-9 h-9 rounded-full bg-[#087F5B] border border-[#9DEBC1]/30 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {displayInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[12px] text-white truncate leading-tight group-hover:text-[#9DEBC1] transition-colors">
                  {displayName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-amber-300">👑</span>
                  <span className="font-label text-[10px] text-[#9DEBC1] font-semibold leading-none">
                    <AzureTranslate text="Premium Member" />
                  </span>
                </div>
              </div>
            </NavLink>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-[#7A988C] hover:text-white hover:bg-white/10 transition-colors shrink-0"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[19px]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

/* ─── TopBar ─────────────────────────────────────────── */
function TopBar({ onMenuToggle }) {
  const location = useLocation()
  const { user } = useAuth()
  let detectedLoc = null
  try { detectedLoc = useDetectedLocation() } catch (e) { }

  const title = PAGE_TITLES[location.pathname] || 'AgriSense AI'
  const displayName = user?.name || user?.phone || 'Sunderganesh'
  const displayLocation = detectedLoc?.city ? `${detectedLoc.city}, ${detectedLoc.state || 'Maharashtra'}` : 'Thane, Maharashtra'

  return (
    <header className="sticky top-0 z-40 bg-[#F4F6F4]/90 backdrop-blur-md border-b border-[#E3ECE6] w-full px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl bg-white border border-[#E3ECE6] text-[#17251F] hover:bg-slate-50 transition-colors"
            onClick={onMenuToggle}
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-lg">menu</span>
          </button>
          <div>
            <h1 className="font-headline font-extrabold text-xl text-[#17251F] tracking-tight">
              <AzureTranslate text={title} />
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Location Pin */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white border border-[#E3ECE6] rounded-full px-3.5 py-1.5 shadow-xs">
            <span className="material-symbols-outlined text-[#087F5B] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              location_on
            </span>
            <span className="font-label text-xs font-semibold text-[#17251F]">
              {displayLocation}
            </span>
          </div>

          {/* Language switcher */}
          <div className="block">
            <LanguageSwitcher />
          </div>

          {/* Search Button */}
          <button
            className="w-9 h-9 rounded-full bg-white border border-[#E3ECE6] flex items-center justify-center text-[#17251F] hover:bg-slate-50 transition-colors shadow-xs hidden sm:flex"
            title="Search"
          >
            <span className="material-symbols-outlined text-lg text-[#556960]">search</span>
          </button>

          {/* Notifications Button */}
          <button
            className="w-9 h-9 rounded-full bg-white border border-[#E3ECE6] flex items-center justify-center text-[#17251F] hover:bg-slate-50 transition-colors shadow-xs hidden sm:flex relative"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-lg text-[#556960]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C94040] rounded-full ring-2 ring-white" />
          </button>

          {/* User profile avatar dropdown */}
          <NavLink
            to="/profile"
            className="flex items-center gap-2 bg-white border border-[#E3ECE6] rounded-full pl-1.5 pr-3 py-1 shadow-xs hover:border-[#087F5B]/30 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-[#087F5B] text-white flex items-center justify-center font-bold text-xs">
              {(displayName || 'S')[0].toUpperCase()}
            </div>
            <span className="font-label text-xs font-semibold text-[#17251F] hidden md:inline truncate max-w-[120px]">
              {displayName}
            </span>
            <span className="material-symbols-outlined text-xs text-[#718078]">expand_more</span>
          </NavLink>
        </div>
      </div>
    </header>
  )
}

/* ─── Bottom Nav (Mobile) ────────────────────────────── */
function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  // Close drawer on route change
  useEffect(() => { setMoreOpen(false) }, [location.pathname])

  // Items for the "more" drawer (everything not in bottom nav)
  const moreItems = NAV_ITEMS.filter(
    item => !item.section && !BOTTOM_NAV_ITEMS.some(b => b.path === item.path)
  )

  return (
    <>
      {/* More drawer overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[140] md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More drawer */}
      <div className={`
        fixed bottom-0 left-0 right-0 z-[145] md:hidden
        bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out
        ${moreOpen ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div className="flex justify-center py-3 cursor-pointer" onClick={() => setMoreOpen(false)}>
          <div className="w-10 h-1 bg-outline-variant rounded-full" />
        </div>
        <div className="grid grid-cols-4 gap-1.5 px-4 pb-6">
          {moreItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-colors
                ${isActive ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}
              `}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label text-[10px] font-bold leading-tight"><AzureTranslate text={item.label} /></span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Bottom navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 glass-effect z-[150] bottom-safe-area">
        <div className="flex justify-around items-center py-1.5 px-2">
          {BOTTOM_NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `
                flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-2xl min-w-[56px] transition-colors
                ${isActive ? 'text-primary' : 'text-on-surface-variant/50'}
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <div className="bg-primary/10 px-4 py-1 rounded-full">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                    </div>
                  ) : (
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  )}
                  <span className="font-label text-[10px] font-bold"><AzureTranslate text={item.label} /></span>
                </>
              )}
            </NavLink>
          ))}
          {/* More button */}
          <button
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-2xl min-w-[56px] transition-colors ${moreOpen ? 'text-primary' : 'text-on-surface-variant/50'}`}
            onClick={() => setMoreOpen(prev => !prev)}
          >
            <span className="material-symbols-outlined text-xl">{moreOpen ? 'close' : 'more_horiz'}</span>
            <span className="font-label text-[10px] font-bold"><AzureTranslate text={moreOpen ? 'Close' : 'More'} /></span>
          </button>
        </div>
      </nav>
    </>
  )
}

/* ─── Auth Guard ─────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse-soft">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
        </div>
        <div className="spinner" />
        <span className="font-label text-sm text-on-surface-variant">Loading AgriSense AI...</span>
      </div>
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/landing" replace />
  return children
}

/* ─── App Layout ─────────────────────────────────────── */
function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 min-w-0 md:ml-0 relative">
        <TopBar onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        <div className="p-4 md:p-8 max-w-screen-2xl mx-auto pb-24 md:pb-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/recommend" element={<Recommend />} />
            <Route path="/disease" element={<FieldScanner />} />
            <Route path="/pests" element={<PestAlerts />} />
            <Route path="/pest" element={<PestAlerts />} />
            <Route path="/fields" element={<Fields />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/fertilizer" element={<Fertilizer />} />
            <Route path="/market" element={<Market />} />
            <Route path="/yield" element={<YieldPredict />} />
            <Route path="/community" element={<Community />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/simulator" element={<WhatIfSimulator />} />
            <Route path="/whatif" element={<WhatIfSimulator />} />
            <Route path="/smart-alerts" element={<SmartAlerts />} />
            <Route path="/profit-planner" element={<ProfitPlanner />} />
            <Route path="/field-scanner" element={<FieldScanner />} />  {/* redirect alias */}
            <Route path="/schemes" element={<Schemes />} />
            <Route path="/loans" element={<Loans />} />
          </Routes>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}

/* ─── Router ─────────────────────────────────────────── */
function AppRouter() {
  return (
    <Routes>
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

/* ─── App Entry ──────────────────────────────────────── */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <LanguageProvider>
            <AppRouter />
          </LanguageProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
