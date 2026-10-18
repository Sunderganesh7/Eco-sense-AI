import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Shield, Image, Film,
  Activity, History, ArrowLeft, Globe
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();

  const isGeoActive = (path) => {
    if (path === '/geoguardian' && location.pathname === '/') return true;
    return location.pathname === path;
  };

  const NavItem = ({ to, icon: Icon, label }) => {
    const active = isGeoActive(to);
    return (
      <Link
        to={to}
        className={`flex items-center gap-3.5 px-4 py-3 rounded-[10px] transition-all duration-200 text-[14px] font-medium group relative overflow-hidden ${
          active
            ? 'bg-gradient-to-r from-teal-600/90 to-emerald-600/90 text-white shadow-[0_4px_16px_rgba(20,184,166,0.3)] border border-teal-500/40 backdrop-blur-sm'
            : 'text-slate-300 hover:bg-slate-800/40 hover:text-white border border-transparent backdrop-blur-sm'
        }`}
      >
        <Icon 
          className={`w-[18px] h-[18px] transition-colors duration-200 flex-shrink-0 relative z-10 ${
            active ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'
          }`} 
          strokeWidth={active ? 2.5 : 2} 
        />
        <span className="tracking-wide relative z-10">{label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-[280px] bg-[#060e11] text-white flex flex-col h-screen fixed left-0 top-0 overflow-hidden border-r border-[#152a2e] shadow-2xl z-40">
      
      {/* Environmental Background Image with Gradient Fade */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Background Image Layer */}
        <div 
          className="absolute inset-x-0 bottom-0 h-[60%] opacity-50"
          style={{
            backgroundImage: "url('/geoguardian_sidebar_bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 50%, black 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 50%, black 100%)",
          }}
        ></div>
        
        {/* Subtle Atmospheric Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060e11] via-[#060e11]/80 to-[#091b1e]/60"></div>
        
        {/* Extremely Subtle SVG contour lines */}
        <svg className="absolute bottom-0 left-0 w-full h-[50%] opacity-[0.04]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M-10 40 Q 30 20 60 70 T 110 50" fill="none" stroke="#10b981" strokeWidth="0.4"/>
          <path d="M-10 60 Q 40 40 70 80 T 110 70" fill="none" stroke="#10b981" strokeWidth="0.4"/>
          <path d="M-10 80 Q 50 60 80 90 T 110 90" fill="none" stroke="#10b981" strokeWidth="0.4"/>
        </svg>
      </div>

      <div className="px-5 py-8 flex flex-col h-full relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3.5 mb-10 pl-1">
          <div className="bg-[#0b1c21] p-2 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-[#1b3439] flex-shrink-0 flex items-center justify-center w-[40px] h-[40px] backdrop-blur-md">
            <Globe className="w-5 h-5 text-teal-400" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center mt-0.5">
            <h2 className="text-[20px] font-extrabold tracking-tight text-white leading-none mb-1.5">
              Geo<span className="text-teal-400">Guardian</span>
            </h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[1.5px] leading-[1.3] flex flex-col">
              <span>Environmental</span>
              <span>Intelligence</span>
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 flex-1 relative z-20">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          
          <div className="h-4"></div> {/* Separation for hierarchy */}
          
          <NavItem to="/geoguardian" icon={Shield} label="GeoGuardian" />
          <NavItem to="/compare" icon={Image} label="Compare" />
          <NavItem to="/timelapse" icon={Film} label="Timelapse" />
          <NavItem to="/monitoring" icon={Activity} label="Monitoring" />
          <NavItem to="/analysis-history" icon={History} label="History" />
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-5 border-t border-[#1b3439] relative z-20 pb-1">
          <a
            href="http://localhost:8000"
            className="flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-[13px] font-medium text-slate-400 hover:text-white group border border-transparent backdrop-blur-sm hover:bg-slate-800/30"
          >
            <ArrowLeft className="w-[16px] h-[16px] group-hover:text-teal-400 transition-transform duration-200 group-hover:-translate-x-1 flex-shrink-0" strokeWidth={2} />
            <span className="tracking-wide">Back to EcoSense AI</span>
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
