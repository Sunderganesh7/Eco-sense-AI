import React from "react";
import { Link } from "react-router-dom";
import { Shield, Satellite, AlertTriangle, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden bg-slate-900"
      style={{
        backgroundImage: "url('/geoguardian_landing_bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Subtle overlay to ensure text readability against the complex background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-900/80"></div>

      {/* Very faint purposeful geospatial accents */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Faint orbit curve */}
          <path d="M -100 800 Q 800 200 1800 600" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="4 8" />
          {/* Subtle geographic contour rings */}
          <circle cx="50%" cy="50%" r="400" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          <circle cx="50%" cy="50%" r="600" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          <circle cx="50%" cy="50%" r="800" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4 max-w-5xl w-full">
        {/* Logo and title */}
        <div className="mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900/50 border border-slate-700/50 backdrop-blur-md rounded-2xl shadow-2xl mb-6">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-5 drop-shadow-lg">
            Geo<span className="text-emerald-400">Guardian</span>
          </h1>
          
          <div className="flex items-center justify-center gap-3 text-slate-300 text-lg md:text-xl font-medium tracking-wide">
            <Satellite className="w-5 h-5 opacity-70" />
            <p>Environmental Change Detection & Alert Intelligence</p>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-5 rounded-xl shadow-lg transition-all duration-300 hover:bg-slate-800/60 hover:border-emerald-500/40">
            <Satellite className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-200 tracking-wide uppercase">Satellite Imagery</p>
          </div>
          
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-5 rounded-xl shadow-lg transition-all duration-300 hover:bg-slate-800/60 hover:border-amber-500/40">
            <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-200 tracking-wide uppercase">Real-time Alerts</p>
          </div>
          
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-5 rounded-xl shadow-lg transition-all duration-300 hover:bg-slate-800/60 hover:border-teal-500/40">
            <TrendingUp className="w-6 h-6 text-teal-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-200 tracking-wide uppercase">Change Tracking</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-5">
          <Link
            to="/dashboard"
            className="group relative px-10 py-4 bg-emerald-600 text-white rounded-lg font-semibold text-lg shadow-xl hover:shadow-emerald-900/50 hover:bg-emerald-500 transition-all duration-200"
          >
            Go to Dashboard
          </Link>
          
          {/* Tagline */}
          <p className="mt-2 text-slate-400/90 text-sm font-medium tracking-wide">
            Monitor environmental changes with Sentinel-2 satellite data.
          </p>
        </div>
      </div>
    </div>
  );
}