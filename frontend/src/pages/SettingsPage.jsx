import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Lock, 
  ShieldCheck, 
  Globe, 
  Check, 
  AlertCircle, 
  UserPlus, 
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  changeUserPassword, 
  getAdminUsers, 
  createReviewerUser, 
  toggleUserStatus 
} from '../services/api';

export const SettingsPage = () => {
  const { user, isAdmin } = useAuth();
  const { currentLang, setLanguage } = useLanguage();

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMessage, setPwMessage] = useState(null);
  const [pwError, setPwError] = useState(null);
  const [changingPw, setChangingPw] = useState(false);

  // User management state (for admins)
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('reviewer');
  const [userActionMsg, setUserActionMsg] = useState(null);
  const [userActionErr, setUserActionErr] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await getAdminUsers();
      setUsersList(data);
    } catch (err) {
      console.warn('Failed to load users:', err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }

    try {
      setChangingPw(true);
      setPwError(null);
      await changeUserPassword({ old_password: oldPassword, new_password: newPassword });
      setPwMessage('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwMessage(null), 3000);
    } catch (err) {
      setPwError(err.response?.data?.detail || 'Current password incorrect.');
    } finally {
      setChangingPw(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setUserActionErr(null);
      await createReviewerUser({
        email: newUserEmail.trim(),
        name: newUserName.trim(),
        password: newUserPassword.trim(),
        role: newUserRole
      });
      setUserActionMsg(`User account created for ${newUserEmail}`);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      loadUsers();
      setTimeout(() => setUserActionMsg(null), 3000);
    } catch (err) {
      setUserActionErr(err.response?.data?.detail || 'Failed to create user account.');
    }
  };

  const handleToggleActive = async (targetId, currentActive) => {
    try {
      await toggleUserStatus(targetId, !currentActive);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update user status.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="pb-2 border-b border-[#F4EDE0]/10">
        <h1 className="font-serif text-3xl text-[#F4EDE0]">Workspace Settings</h1>
        <p className="text-xs text-[#F4EDE0]/60 mt-1">
          Operational account security, interface language, and reviewer team access.
        </p>
      </div>

      {/* 1. Account Profile Summary */}
      <div className="glass-panel p-6 rounded-2xl border border-[#F4EDE0]/10 space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-[#FF6B58] font-semibold">
          1. Operational Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#0D1527]/50 border border-[#F4EDE0]/10">
            <span className="text-[10px] text-[#F4EDE0]/40">Staff Name</span>
            <div className="font-medium text-[#F4EDE0] mt-0.5">{user?.name || 'Operations Lead'}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0D1527]/50 border border-[#F4EDE0]/10">
            <span className="text-[10px] text-[#F4EDE0]/40">Email Address</span>
            <div className="font-medium text-[#F4EDE0] mt-0.5">{user?.email || 'admin@resqintel.org'}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0D1527]/50 border border-[#F4EDE0]/10">
            <span className="text-[10px] text-[#F4EDE0]/40">Security Role</span>
            <div className="font-medium text-[#FF6B58] uppercase text-[11px] font-mono mt-0.5">
              {user?.role || 'admin'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Change Password */}
      <div className="glass-panel p-6 rounded-2xl border border-[#F4EDE0]/10 space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-[#FF6B58] font-semibold">
          2. Account Password Security
        </h2>

        {pwMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{pwMessage}</span>
          </div>
        )}

        {pwError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{pwError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-3 max-w-md text-xs">
          <div>
            <label className="block text-[11px] text-[#F4EDE0]/70 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-[#0D1527]/60 border border-[#F4EDE0]/15 rounded-xl p-2 text-xs text-[#F4EDE0] focus:outline-none focus:border-[#FF6B58]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#F4EDE0]/70 mb-1">New Password (Min. 8 chars)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#0D1527]/60 border border-[#F4EDE0]/15 rounded-xl p-2 text-xs text-[#F4EDE0] focus:outline-none focus:border-[#FF6B58]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#F4EDE0]/70 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#0D1527]/60 border border-[#F4EDE0]/15 rounded-xl p-2 text-xs text-[#F4EDE0] focus:outline-none focus:border-[#FF6B58]"
            />
          </div>

          <button
            type="submit"
            disabled={changingPw}
            className="px-4 py-2 rounded-xl bg-[#FF6B58] hover:bg-[#FF8575] disabled:opacity-50 text-[#14213D] font-semibold text-xs transition-all shadow-[0_4px_16px_rgba(255,107,88,0.25)]"
          >
            {changingPw ? 'Updating password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* 3. Interface Language Preference */}
      <div className="glass-panel p-6 rounded-2xl border border-[#F4EDE0]/10 space-y-4">
        <h2 className="text-xs uppercase tracking-wider text-[#FF6B58] font-semibold">
          3. Interface Language
        </h2>
        <p className="text-xs text-[#F4EDE0]/60">
          Select preferred navigation and labeling language for this terminal session.
        </p>

        <div className="flex items-center space-x-3">
          {['en', 'hi', 'bn'].map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                currentLang === lang
                  ? 'bg-[#FF6B58] text-[#14213D] border-[#FF6B58] font-bold'
                  : 'bg-[#0D1527]/50 text-[#F4EDE0]/80 border-[#F4EDE0]/15 hover:bg-[#F4EDE0]/5'
              }`}
            >
              {lang === 'en' ? 'English (EN)' : lang === 'hi' ? 'हिन्दी (HI)' : 'বাংলা (BN)'}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Administrator Only: User Management */}
      {isAdmin && (
        <div className="glass-panel p-6 rounded-2xl border border-[#F4EDE0]/10 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#F4EDE0]/10">
            <div>
              <h2 className="text-xs uppercase tracking-wider text-[#FF6B58] font-semibold">
                4. Authorized Operational Team
              </h2>
              <p className="text-xs text-[#F4EDE0]/60 mt-0.5">
                Manage internal analyst and reviewer accounts with access to the review queue.
              </p>
            </div>
          </div>

          {userActionMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              {userActionMsg}
            </div>
          )}

          {userActionErr && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {userActionErr}
            </div>
          )}

          {/* Create User Form */}
          <form onSubmit={handleCreateUser} className="p-4 rounded-xl bg-[#0D1527]/60 border border-[#F4EDE0]/10 space-y-3 text-xs">
            <span className="font-semibold text-[#F4EDE0] block">Provision New Reviewer / Analyst</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                required
                placeholder="Staff Name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="bg-[#14213D] border border-[#F4EDE0]/15 rounded-lg p-2 text-xs text-[#F4EDE0]"
              />
              <input
                type="email"
                required
                placeholder="staff@resqintel.org"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="bg-[#14213D] border border-[#F4EDE0]/15 rounded-lg p-2 text-xs text-[#F4EDE0]"
              />
              <input
                type="password"
                required
                placeholder="Initial Password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="bg-[#14213D] border border-[#F4EDE0]/15 rounded-lg p-2 text-xs text-[#F4EDE0]"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-[#FF6B58] hover:bg-[#FF8575] text-[#14213D] font-semibold text-xs transition-colors"
              >
                Add Account
              </button>
            </div>
          </form>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#F4EDE0]/10 text-[#F4EDE0]/50 text-[10px] uppercase">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EDE0]/5">
                {usersList.map((u) => (
                  <tr key={u.user_id}>
                    <td className="py-2.5 px-3 font-medium text-[#F4EDE0]">{u.name}</td>
                    <td className="py-2.5 px-3 text-[#F4EDE0]/70 font-mono text-[11px]">{u.email}</td>
                    <td className="py-2.5 px-3 font-mono uppercase text-[10px] text-[#FF6B58]">{u.role}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                        u.is_active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                      }`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {u.user_id !== user?.user_id && (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u.user_id, u.is_active)}
                          className="text-[11px] text-[#F4EDE0]/60 hover:text-[#F4EDE0] underline"
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
