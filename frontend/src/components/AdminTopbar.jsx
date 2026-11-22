import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  User, 
  LogOut, 
  Check, 
  ChevronDown,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAdminNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
import { Link } from 'react-router-dom';

export const AdminTopbar = ({ searchQuery = '', setSearchQuery }) => {
  const { user, logout } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotificationMenu(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowNotificationMenu(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => clearInterval(timer);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getAdminNotifications();
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  };

  const handleMarkAsRead = async (notifId, e) => {
    e.stopPropagation();
    try {
      await markNotificationRead(notifId);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#14213D]/90 backdrop-blur-xl border-b border-white/10 px-6 flex items-center justify-between">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Municipal Operations Desk
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3.5 relative">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotificationMenu(!showNotificationMenu);
              setShowUserMenu(false);
            }}
            title="Notifications"
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF6B58] rounded-full shadow-[0_0_6px_#FF6B58]" />
            )}
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 glass-panel-elevated rounded-xl border border-white/15 shadow-2xl overflow-hidden z-50 text-xs">
              <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/20">
                <span className="font-semibold text-white">Operational Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#FF6B58] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    No active notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.notification_id}
                      className={`p-3 space-y-1 transition-colors ${
                        n.is_read ? 'opacity-60 hover:opacity-100' : 'bg-[#FF6B58]/10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-white">
                        <span>{n.title}</span>
                        {!n.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.notification_id, e)}
                            className="text-[#FF6B58] hover:text-[#FF8575] text-[10px] font-normal"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">{n.message}</p>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Desk Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotificationMenu(false);
            }}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#1B2A4A] to-[#FF6B58]/50 border border-white/20 flex items-center justify-center text-white text-xs font-serif font-bold">
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-white leading-tight">
                {user?.name || 'Operations Lead'}
              </span>
              <span className="text-[10px] text-[#FF6B58] uppercase font-mono tracking-wider -mt-0.5">
                {user?.role || 'Admin'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 glass-panel-elevated rounded-xl border border-white/15 shadow-2xl py-1 z-50 text-xs">
              <div className="px-3 py-2 border-b border-white/10">
                <div className="font-semibold text-white truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
              </div>

              <Link
                to="/admin/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </Link>

              <button
                onClick={logout}
                className="w-full flex items-center gap-2 text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-white/10"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
