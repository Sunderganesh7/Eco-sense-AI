// frontend/src/components/NavBar.jsx
import React from "react";
import { Search, Bell } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 w-[450px]">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search features, data, or insights..."
          className="bg-transparent border-none outline-none flex-1 text-base text-slate-700 placeholder-slate-400"
        />
        <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">Ctrl + K</div>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-slate-400 hover:text-slate-600 transition relative">
          <Bell className="w-6 h-6" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
