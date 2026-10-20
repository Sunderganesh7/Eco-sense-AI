import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Leaf, 
  ThermometerSun, 
  Trees, 
  Map as MapIcon, 
  Factory, 
  ShieldAlert, 
  Bot,
  Network
} from 'lucide-react';

export const Navigation: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <Leaf className="sidebar-icon" size={24} color="var(--color-primary)" fill="var(--color-primary)" />
          <span>EcoMind AI</span>
        </div>
        <div className="sidebar-subtitle">Data for a Greener Tomorrow</div>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink 
          to="/environment" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <MapIcon size={20} />
          Environmental Data
        </NavLink>
        
        <NavLink 
          to="/overview" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <LayoutDashboard size={20} />
          Overview
        </NavLink>
        
        <NavLink 
          to="/soil" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Leaf size={20} />
          Soil
        </NavLink>
        
        <NavLink 
          to="/climate" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ThermometerSun size={20} />
          Climate
        </NavLink>
        
        <NavLink 
          to="/biodiversity" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Trees size={20} />
          Biodiversity
        </NavLink>
        
        <NavLink 
          to="/land" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <MapIcon size={20} />
          Land
        </NavLink>
        
        <NavLink 
          to="/human-impact" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Factory size={20} />
          Human Impact
        </NavLink>

        <div className="section-divider" style={{ margin: '12px 16px', backgroundColor: 'var(--color-border)' }}></div>

        <NavLink 
          to="/risk-profile" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ShieldAlert size={20} />
          Risk Profile
        </NavLink>

        <NavLink 
          to="/ai-scientist" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Bot size={20} />
          AI Scientist
        </NavLink>

        <NavLink 
          to="/reasoning" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Network size={20} />
          Evidence & Reasoning
        </NavLink>

        {/* Extremely subtle environmental watermark in the empty space below navigation */}
        <div 
          style={{ 
            flex: 1, 
            minHeight: '120px', 
            margin: '24px -16px -12px -16px', 
            backgroundImage: "url('/ecomind_sidebar_bg.jpg')", 
            backgroundSize: 'cover', 
            backgroundPosition: 'center top', 
            opacity: 0.12, 
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 50%, black 100%)', 
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 50%, black 100%)',
            pointerEvents: 'none'
          }} 
        />
      </nav>

      <div className="sidebar-footer">
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.95rem'}}>
          <Leaf size={18} fill="var(--color-primary)"/> EcoMind AI
        </div>
        <div style={{fontSize: '0.8rem', color: 'var(--color-text-tertiary)', marginTop: '4px'}}>v1.0.0 Enterprise</div>
        <a 
          href="https://eco-sense-ai-one.vercel.app/" 
          target="_top"
          rel="noopener noreferrer"
          className="back-to-ecosense"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
              e.preventDefault();
              try {
                if (window.top && window.top !== window) {
                  window.top.location.href = "https://eco-sense-ai-one.vercel.app/";
                  return;
                }
              } catch (_) {
                // fall through
              }
              window.location.href = "https://eco-sense-ai-one.vercel.app/";
            }
          }}
        >
          <LayoutDashboard size={18} /> Back to Eco Sense
        </a>
      </div>
    </aside>
  );
};
