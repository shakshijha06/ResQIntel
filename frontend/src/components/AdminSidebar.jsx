import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
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
  ExternalLink,
  X
} from 'lucide-react';
import { LogoMark } from './LogoMark';
import { useAuth } from '../contexts/AuthContext';

export const AdminSidebar = ({
  pendingReviewCount = 0,
  isConnected = true,
  isCollapsed = false,
  toggleCollapse,
  mobileDrawerOpen = false,
  closeMobileDrawer
}) => {
  const { isAdmin } = useAuth();
  const location = useLocation();

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
      className={`fixed top-0 left-0 h-screen z-50 bg-[#14213D] lg:bg-[#14213D]/95 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between transition-transform lg:transition-all duration-300 ${
        /* On desktop: show collapsed (w-16) or expanded (w-64) */
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      } ${
        /* On mobile/tablet (< lg): off-canvas drawer controlled by mobileDrawerOpen */
        mobileDrawerOpen
          ? 'translate-x-0 w-72 max-w-[85vw] shadow-2xl'
          : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="absolute inset-0 pointer-events-none fluted-glass-subtle opacity-40 z-0" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <Link
            to="/admin/dashboard"
            onClick={closeMobileDrawer}
            className="flex items-center gap-3 overflow-hidden"
          >
            <LogoMark size={28} />
            {(!isCollapsed || mobileDrawerOpen) && (
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

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
            aria-label="Toggle sidebar collapse"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={closeMobileDrawer}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Close sidebar drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isColl = isCollapsed && !mobileDrawerOpen;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileDrawer}
                title={isColl ? item.name : undefined}
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
                      } ${!isColl ? 'mr-3' : 'mx-auto'}`}
                    />

                    {!isColl && (
                      <span className="truncate flex-1 tracking-wide">{item.name}</span>
                    )}

                    {!isColl && item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-[#FF6B58]/20 text-[#FF6B58] border border-[#FF6B58]/35 rounded-full shrink-0">
                        {item.badge}
                      </span>
                    )}

                    {isColl && item.badge && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B58] rounded-full shadow-[0_0_6px_#FF6B58]" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className={`p-3 border-t border-white/10 ${isCollapsed && !mobileDrawerOpen ? 'flex justify-center' : ''}`}>
          {!isCollapsed || mobileDrawerOpen ? (
            <div className="space-y-2">
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-xs text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2 truncate">
                  <ExternalLink className="w-3.5 h-3.5 text-[#FF6B58] shrink-0" />
                  <span className="truncate">Public Portal</span>
                </span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
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
