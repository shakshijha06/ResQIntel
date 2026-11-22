import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  FileText, 
  MapPin, 
  GitMerge, 
  Settings,
  ShieldCheck,
  ChevronRight,
  Database
} from 'lucide-react';
import { LogoMark } from './LogoMark';

export const Sidebar = ({ pendingReviewCount = 4, isConnected = true, isCollapsed = false, toggleCollapse }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Incidents', path: '/incidents', icon: AlertTriangle },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Map Explorer', path: '/map', icon: MapPin },
    { 
      name: 'Review Centre', 
      path: '/reviews', 
      icon: GitMerge,
      badge: pendingReviewCount > 0 ? pendingReviewCount : null
    },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen z-40 bg-[#14213D]/80 backdrop-blur-xl border-r border-[#F4EDE0]/10 flex flex-col justify-between transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Fluted glass subtle background overlay */}
      <div className="absolute inset-0 pointer-events-none fluted-glass-subtle opacity-50 z-0"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#F4EDE0]/10 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <LogoMark size={32} />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold tracking-tight text-[#F4EDE0]">
                  ResQ<span className="text-[#FF6B58]">Intel</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#F4EDE0]/50 font-medium -mt-1">
                  Intelligence Core
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-[#F4EDE0]/10 text-[#F4EDE0] shadow-[inset_0_1px_0_0_rgba(244,237,224,0.15)] border border-[#F4EDE0]/15'
                      : 'text-[#F4EDE0]/60 hover:text-[#F4EDE0] hover:bg-[#F4EDE0]/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Accent Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#FF6B58] rounded-r-full shadow-[0_0_8px_#FF6B58]"></span>
                    )}

                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-[#FF6B58]' : 'text-[#F4EDE0]/50 group-hover:text-[#F4EDE0]/80'
                      } ${!isCollapsed ? 'mr-3' : 'mx-auto'}`}
                    />

                    {!isCollapsed && (
                      <span className="truncate flex-1 tracking-wide">{item.name}</span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold bg-[#FF6B58]/20 text-[#FF6B58] border border-[#FF6B58]/30 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* System & Connection Status Footer */}
        <div className="p-4 m-3 rounded-xl bg-[#0D1527]/60 border border-[#F4EDE0]/10">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F4EDE0]/50 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#F4EDE0]/40" /> Backend
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
                  {isConnected ? 'Online' : 'Reconnecting'}
                </span>
              </div>
              <div className="text-[10px] text-[#F4EDE0]/40 font-mono">
                Storage: Local JSON / Atlas Ready
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
