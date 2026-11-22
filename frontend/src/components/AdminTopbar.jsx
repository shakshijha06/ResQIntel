import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  User, 
  LogOut, 
  Check, 
  ChevronDown,
  Settings,
  Menu,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAdminNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
import { Link } from 'react-router-dom';

export const AdminTopbar = ({ searchQuery = '', setSearchQuery, onToggleMobileDrawer }) => {
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
    <header className="sticky top-0 z-30 h-16 bg-[#14213D]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 flex items-center justify-between min-w-0 w-full">
      {/* Left: Mobile Drawer Button + Page Header */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileDrawer}
          className="lg:hidden p-2 -ml-1 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 truncate">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block truncate">
            Municipal Operations Desk
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5 relative shrink-0">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotificationMenu(!showNotificationMenu);
              setShowUserMenu(false);
            }}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B58] rounded-full shadow-[0_0_6px_#FF6B58]" />
            )}
          </button>

          {/* Notifications Dropdown Panel (Responsive) */}
          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[#14213D] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#FF6B58] hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.notification_id}
                      onClick={(e) => !n.is_read && handleMarkAsRead(n.notification_id, e)}
                      className={`p-3 text-xs hover:bg-white/5 cursor-pointer transition-colors ${
                        !n.is_read ? 'bg-[#1B2A4A]/50' : 'opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-white line-clamp-1">{n.title}</span>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B58] shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[9px] text-slate-400 mt-1 block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotificationMenu(false);
            }}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-colors text-xs"
          >
            <div className="w-6 h-6 rounded-lg bg-[#FF6B58]/20 text-[#FF6B58] flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.name?.[0] || 'A'}
            </div>
            <span className="font-medium text-slate-200 hidden md:inline truncate max-w-[120px]">
              {user?.name || 'Administrator'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-[#14213D] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in text-xs space-y-1">
              <div className="px-3 py-2 border-b border-white/10">
                <div className="font-semibold text-white truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</div>
                <div className="text-[9px] uppercase tracking-wider text-[#FF6B58] font-bold mt-0.5">
                  Role: {user?.role || 'admin'}
                </div>
              </div>

              <Link
                to="/admin/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Account Settings</span>
              </Link>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-500/15 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
