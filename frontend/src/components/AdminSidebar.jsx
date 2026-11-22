import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Layers,
  GitMerge,
  MapPin,
  Users,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { LogoMark } from './LogoMark';
import { useAuth } from '../contexts/AuthContext';

export const AdminSidebar = ({ pendingReviewCount = 0, isConnected = true, isCollapsed = false, toggleCollapse }) => {
  const { isAdmin } = useAuth();

  const navItems = [
    { name: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Reported Issues', path: '/admin/reports', icon: FileText },
    { name: 'Incidents', path: '/admin/incidents', icon: Layers },
    {
      name: 'Review Reports',
      path: '/admin/reviews',
      icon: GitMerge,
      badge: pendingReviewCount > 0 ? pendingReviewCount : null
    },
    { name: 'Operational Map', path: '/admin/map', icon: MapPin },
    ...(isAdmin ? [
      { name: 'Users & Access', path: '/admin/users', icon: Users },
      { name: 'Activity History', path: '/admin/audit-logs', icon: ScrollText },
    ] : []),
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 bg-[#14213D]/95 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="absolute inset-0 pointer-events-none fluted-glass-subtle opacity-40 z-0" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
            <LogoMark size={28} />
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-serif text-lg font-bold tracking-tight text-[#F8FAFC] leading-tight">
                  ResQ<span className="text-[#FF6B58]">Intel</span>
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold -mt-0.5">
                  Operations Desk
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={toggleCollapse}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-[#1B2A4A] text-[#F8FAFC] border border-[#FF6B58]/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#FF6B58] rounded-r-full shadow-[0_0_8px_#FF6B58]" />
                    )}

                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#FF6B58]' : 'text-slate-400 group-hover:text-slate-200'
                      } ${!isCollapsed ? 'mr-3' : 'mx-auto'}`}
                    />

                    {!isCollapsed && (
                      <span className="truncate flex-1 tracking-wide">{item.name}</span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-[#FF6B58]/20 text-[#FF6B58] border border-[#FF6B58]/35 rounded-full">
                        {item.badge}
                      </span>
                    )}

                    {isCollapsed && item.badge && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B58] rounded-full shadow-[0_0_6px_#FF6B58]" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className={`p-3 border-t border-white/10 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {!isCollapsed ? (
            <div className="space-y-2">
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-xs text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-[#FF6B58]" />
                  <span>Public Portal</span>
                </span>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              </Link>
            </div>
          ) : (
            <Link to="/" target="_blank" title="Public Portal">
              <ExternalLink className="w-4 h-4 text-slate-400 hover:text-[#FF6B58] transition-colors" />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
};
