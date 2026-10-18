import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
} from 'lucide-react';

export const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [activityTypes, setActivityTypes] = useState(['ALL']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getActivityLogs({
        search: search.trim() || undefined,
        activity_type: selectedType === 'ALL' ? undefined : selectedType,
        limit: 100,
      });

      if (res.success && res.data) {
        setLogs(res.data.logs || []);
        if (res.data.activity_types) {
          setActivityTypes(res.data.activity_types);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getDeviceIcon = (device) => {
    switch (device?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-3.5 h-3.5 text-cyan-400" />;
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <Activity className="w-4 h-4" />
            <span>Audit Trail & Telemetry</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            System Activity Logs
          </h1>
          <p className="text-sm text-slate-400">
            Real-time security auditing of all actions across GreenPath AI
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="btn-secondary flex items-center space-x-2 w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-card p-5">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, details, email, or name..."
              className="input-field pl-10 text-sm py-2"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field pl-10 text-sm py-2 bg-slate-950"
            >
              {activityTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      <div className="glass-card p-6">
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Loading activity audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No activity logs match the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Activity Action</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP & Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">
                        {log.full_name || 'System / Anonymous'}
                      </div>
                      <div className="text-xs text-slate-400">{log.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {log.activity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-md truncate" title={log.details}>
                      {log.details || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-400">
                      <div className="flex items-center space-x-1.5 font-mono text-slate-300">
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                        <span>{log.ip_address}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-500 mt-1">
                        {getDeviceIcon(log.device)}
                        <span>{log.browser}</span>
                      </div>
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
