import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, User as UserIcon, LogOut, Activity, History, Leaf } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'researcher':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'officer':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-white bg-clip-text text-transparent">
            GreenPath AI
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold">
            SECURE
          </span>
        </Link>

        {isAuthenticated && (
          <nav className="flex items-center space-x-4">
            {isAdmin && (
              <>
                <Link
                  to="/admin/dashboard"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-900/60 transition-colors"
                >
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Admin Hub</span>
                </Link>
                <Link
                  to="/admin/logs/activity"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-900/60 transition-colors"
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Activity Logs</span>
                </Link>
                <Link
                  to="/admin/logs/logins"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-900/60 transition-colors"
                >
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>Login History</span>
                </Link>
              </>
            )}

            <div className="h-5 w-px bg-slate-800 mx-2" />

            <Link
              to="/profile"
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all group"
            >
              {user?.profile?.profile_photo_url ? (
                <img
                  src={user.profile.profile_photo_url}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover border border-emerald-500/50"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-950 flex items-center justify-center border border-emerald-800">
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200 leading-tight">
                  {user?.profile?.full_name || user?.email}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded border uppercase font-bold inline-block w-fit mt-0.5 ${getRoleBadgeColor(
                    user?.roles?.[0]
                  )}`}
                >
                  {user?.roles?.[0] || 'User'}
                </span>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};
