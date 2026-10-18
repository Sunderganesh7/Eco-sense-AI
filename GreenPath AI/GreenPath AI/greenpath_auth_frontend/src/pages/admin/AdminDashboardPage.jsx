import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  UserCog,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Search,
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [uRes, rRes] = await Promise.all([api.getUsers(), api.getRoles()]);
      if (uRes.success) setUsers(uRes.data.users || []);
      if (rRes.success) setRoles(rRes.data.roles || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId, newRoleName) => {
    try {
      const res = await api.assignRole(userId, newRoleName);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, roles: [newRoleName] } : u))
        );
      }
    } catch (err) {
      alert(err.message || 'Could not change user role.');
    }
  };

  const handleDeactivateUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to deactivate user account for ${userEmail}? All active sessions will be revoked.`)) {
      return;
    }
    try {
      const res = await api.deleteUser(userId);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_active: false } : u))
        );
      }
    } catch (err) {
      alert(err.message || 'Could not deactivate user.');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.profile?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter((u) => (u.roles || []).includes('Admin')).length,
    researchers: users.filter((u) => (u.roles || []).includes('Researcher')).length,
    officers: users.filter((u) => (u.roles || []).includes('Officer')).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <Shield className="w-4 h-4" />
            <span>Admin Control Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            User & RBAC Management
          </h1>
          <p className="text-sm text-slate-400">
            Manage user accounts, assign roles, and enforce security policies
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="btn-secondary flex items-center space-x-2 w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Users</div>
          <div className="text-3xl font-extrabold text-white mt-1">{stats.total}</div>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-emerald-400">
          <div className="text-xs font-semibold text-slate-400 uppercase">Admins</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">{stats.admins}</div>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-cyan-400">
          <div className="text-xs font-semibold text-slate-400 uppercase">Researchers</div>
          <div className="text-3xl font-extrabold text-cyan-400 mt-1">{stats.researchers}</div>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-amber-400">
          <div className="text-xs font-semibold text-slate-400 uppercase">Officers</div>
          <div className="text-3xl font-extrabold text-amber-400 mt-1">{stats.officers}</div>
        </div>
      </div>

      {/* Users Management Card */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Registered Accounts</span>
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="input-field pl-10 text-sm py-2"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Loading user directory...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">
                        {u.profile?.full_name || 'No Name'}
                      </div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {u.profile?.organization || 'GreenPath AI'}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.roles?.[0] || 'Researcher'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-200 focus:border-emerald-500"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Researcher">Researcher</option>
                        <option value="Officer">Officer</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <UserCheck className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          <UserX className="w-3 h-3" />
                          <span>Deactivated</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.id !== 101 && u.is_active && (
                        <button
                          onClick={() => handleDeactivateUser(u.id, u.email)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-medium hover:underline"
                        >
                          Deactivate
                        </button>
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
