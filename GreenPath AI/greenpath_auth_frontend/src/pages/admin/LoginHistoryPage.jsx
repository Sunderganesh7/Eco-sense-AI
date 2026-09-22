import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  History,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Globe,
  Monitor,
  Laptop,
  LogOut,
  LogIn,
} from 'lucide-react';

export const LoginHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getLoginHistory(100);
      if (res.success && res.data) {
        setHistory(res.data.login_history || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load login history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <History className="w-4 h-4" />
            <span>Session Analytics</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Login & Session History
          </h1>
          <p className="text-sm text-slate-400">
            Audit login attempts, session timestamps, and device operating systems
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="btn-secondary flex items-center space-x-2 w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Login History Table Card */}
      <div className="glass-card p-6">
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Loading session telemetry records...
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No login history records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Login Time</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">OS & Browser</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Logout Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                      <div className="flex items-center space-x-1.5">
                        <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {item.login_time
                            ? new Date(item.login_time).toLocaleString()
                            : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">
                        {item.full_name || 'Anonymous Attempt'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.email || 'Unknown User'}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-slate-300">
                      <div className="flex items-center space-x-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.ip_address}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300">
                      <div className="font-semibold text-slate-200">
                        {item.operating_system}
                      </div>
                      <div className="text-slate-400">{item.browser}</div>
                    </td>
                    <td className="py-3 px-4">
                      {item.status && item.status.includes('SUCCESS') ? (
                        <span className="inline-flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Success</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">
                          <XCircle className="w-3 h-3" />
                          <span>{item.status || 'Failed'}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                      {item.logout_time ? (
                        <div className="flex items-center space-x-1.5 text-amber-400">
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{new Date(item.logout_time).toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Active / Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
