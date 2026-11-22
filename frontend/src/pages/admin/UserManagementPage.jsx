import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, CheckCircle2, XCircle, 
  RefreshCw, Lock, Mail, User, ShieldCheck 
} from 'lucide-react';
import { getAdminUsers, createReviewerUser, toggleUserStatus } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New user form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('reviewer');
  const [creating, setCreating] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [actionErr, setActionErr] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionMsg(null);
    setActionErr(null);

    if (!email || !name || !password) {
      setActionErr("All fields are required.");
      return;
    }

    try {
      setCreating(true);
      await createReviewerUser({ email, name, password, role, is_active: true });
      setActionMsg(`Account for ${name} (${email}) created successfully as ${role}.`);
      setEmail('');
      setName('');
      setPassword('');
      setRole('reviewer');
      await loadUsers();
    } catch (err) {
      setActionErr(err.response?.data?.detail || err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await toggleUserStatus(userId, !currentStatus);
      await loadUsers();
    } catch (err) {
      alert("Error changing status: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#F4EDE0]/10">
        <div>
          <h1 className="font-serif text-3xl text-[#F4EDE0] font-normal">Team & Access Governance</h1>
          <p className="text-xs text-[#F4EDE0]/60 mt-1">
            Authorised teammate provisioning and role-based operational permissions.
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4EDE0]/5 hover:bg-[#F4EDE0]/10 text-xs text-[#F4EDE0]/70 border border-[#F4EDE0]/10"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Security notice */}
      <div className="p-4 rounded-xl bg-[#0D1527] border border-[#F4EDE0]/10 text-xs text-[#F4EDE0]/70 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-[#FF6B58] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Strict Access Control:</strong> Public registration is prohibited. Only authenticated administrators may invite teammates.
          Role assignments (Admin / Reviewer) govern permissions across incidents, datasets, and publication state.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Provision Form */}
        <div className="glass-panel p-6 rounded-2xl border border-[#F4EDE0]/10 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F4EDE0]/10">
            <UserPlus className="w-4 h-4 text-[#FF6B58]" />
            <h2 className="font-serif text-lg text-[#F4EDE0]">Provision New Teammate</h2>
          </div>

          {actionMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionMsg}</span>
            </div>
          )}

          {actionErr && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{actionErr}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
            <div>
              <label className="text-[#F4EDE0]/60 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Ananya Roy"
                className="w-full bg-[#0D1527] border border-[#F4EDE0]/15 rounded-xl px-3 py-2 text-[#F4EDE0] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#F4EDE0]/60 block mb-1">Official Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ananya.roy@resqintel.org"
                className="w-full bg-[#0D1527] border border-[#F4EDE0]/15 rounded-xl px-3 py-2 text-[#F4EDE0] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#F4EDE0]/60 block mb-1">Initial Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0D1527] border border-[#F4EDE0]/15 rounded-xl px-3 py-2 text-[#F4EDE0] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#F4EDE0]/60 block mb-1">Operational Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#0D1527] border border-[#F4EDE0]/15 rounded-xl px-3 py-2 text-[#F4EDE0] focus:outline-none"
              >
                <option value="reviewer">Reviewer (Inspect & Reconcile Reports)</option>
                <option value="admin">Administrator (Full System & User Control)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#FF6B58] hover:bg-[#FF8575] text-[#14213D] font-semibold text-xs transition-all disabled:opacity-50"
            >
              {creating ? 'Creating Account...' : 'Create Teammate Account'}
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-[#F4EDE0]/10 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#F4EDE0]/10">
            <h2 className="font-serif text-lg text-[#F4EDE0]">Active Personnel Directory</h2>
            <span className="text-[11px] font-mono text-[#F4EDE0]/40">{users.length} accounts</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#F4EDE0]/40 font-mono">Loading personnel...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F4EDE0]/10 text-[#F4EDE0]/40 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Name & Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4EDE0]/5">
                  {users.map((u) => (
                    <tr key={u.user_id} className="hover:bg-[#F4EDE0]/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#F4EDE0]">{u.name}</div>
                        <div className="text-[11px] text-[#F4EDE0]/50 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                          u.role === 'admin'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] ${
                          u.is_active ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            u.is_active ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}></span>
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#F4EDE0]/40 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {u.email !== currentUser?.email ? (
                          <button
                            onClick={() => handleToggleActive(u.user_id, u.is_active)}
                            className={`text-[11px] font-medium hover:underline ${
                              u.is_active ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {u.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#F4EDE0]/30 font-mono">Current User</span>
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
    </div>
  );
};
