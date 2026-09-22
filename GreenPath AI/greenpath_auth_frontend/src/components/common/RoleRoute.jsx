import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RoleRoute = ({ requiredRoles = [], children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will be handled by ProtectedRoute wrapper
  }

  const userRoles = (user?.roles || []).map((r) => r.toLowerCase());
  const allowedRoles = requiredRoles.map((r) => r.toLowerCase());
  const isAuthorized = allowedRoles.some((role) => userRoles.includes(role));

  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/50">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Access Denied (403)</h1>
            <p className="text-sm text-slate-400">
              Your assigned role <span className="text-emerald-400 font-semibold">[{user?.roles?.join(', ')}]</span> does not have sufficient RBAC permissions to access this dashboard.
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-left text-xs space-y-1">
            <div className="text-slate-400 font-semibold">Required Role(s):</div>
            <div className="text-slate-200">{requiredRoles.join(' or ')}</div>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center space-x-2 btn-secondary w-full justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to User Profile</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
};
