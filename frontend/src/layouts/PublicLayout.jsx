import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { LogoMark } from '../components/LogoMark';
import {
  AlertCircle,
  Menu,
  X,
  FilePlus,
  Search,
  MapPin,
  Compass,
  Home,
  FileText,
  HelpCircle,
  MessageSquare,
  ChevronRight,
  Layers,
} from 'lucide-react';

const NAV_LINKS = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Report a Problem', path: '/report', icon: FilePlus, highlight: true },
  { name: 'Reported Issues', path: '/reports', icon: FileText },
  { name: 'Incidents', path: '/explore', icon: Layers },
  { name: 'Public Map', path: '/map', icon: MapPin },
  { name: 'Track My Report', path: '/track', icon: Search },
  { name: 'How It Works', path: '/how-it-works', icon: HelpCircle },
  { name: 'FAQ', path: '/faq', icon: MessageSquare },
];

export const PublicLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close on Escape key + trap focus inside drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!mobileOpen) return;
      if (e.key === 'Escape') {
        setMobileOpen(false);
        toggleBtnRef.current?.focus();
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
          'a, button, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Auto-focus drawer on open
  useEffect(() => {
    if (mobileOpen && drawerRef.current) {
      const firstFocusable = drawerRef.current.querySelector('a, button');
      firstFocusable?.focus();
    }
  }, [mobileOpen]);

  const closeDrawer = useCallback(() => {
    setMobileOpen(false);
    setTimeout(() => toggleBtnRef.current?.focus(), 50);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1527] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#FF6B58]/30 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full glow-navy-subtle opacity-50 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-1/5 w-[500px] h-[500px] rounded-full glow-coral-subtle opacity-10 blur-3xl pointer-events-none" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#14213D]/85 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Product Name */}
          <Link to="/" className="flex items-center space-x-3 group shrink-0">
            <LogoMark size={32} />
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-[#F8FAFC] group-hover:text-[#FF6B58] transition-colors leading-tight">
                ResQ<span className="text-[#FF6B58]">Intel</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium -mt-0.5">
                Civic Issue Reporting &amp; Resolution
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {NAV_LINKS.filter(l => !l.highlight).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-[#FF6B58] border border-white/15'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <NavLink
              to="/track"
              className={({ isActive }) =>
                `hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isActive
                    ? 'border-[#FF6B58]/40 bg-[#FF6B58]/10 text-[#FF6B58]'
                    : 'border-white/15 text-slate-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Track Report</span>
            </NavLink>

            <NavLink
              to="/report"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF6B58] hover:bg-[#FF8575] text-[#0D1527] transition-all shadow-[0_2px_12px_rgba(255,107,88,0.35)]"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report a Problem</span>
              <span className="sm:hidden">Report</span>
            </NavLink>

            {/* Hamburger Button — mobile only */}
            <button
              ref={toggleBtnRef}
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          aria-modal="true"
          role="dialog"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Slide-in Drawer */}
          <div
            id="mobile-nav-drawer"
            ref={drawerRef}
            className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-[#0A1120] border-l border-white/10 flex flex-col shadow-2xl"
            style={{
              animation: 'slideInFromRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 bg-[#14213D]/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <LogoMark size={24} />
                <span className="font-serif text-base font-bold">
                  ResQ<span className="text-[#FF6B58]">Intel</span>
                </span>
              </div>
              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
              <div className="mb-3 px-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                  Navigation
                </span>
              </div>

              {NAV_LINKS.map((item) => {
                const Icon = item.icon;
                const isHighlight = item.highlight;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={closeDrawer}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                        isHighlight
                          ? isActive
                            ? 'bg-[#FF6B58]/20 text-[#FF6B58] border border-[#FF6B58]/30'
                            : 'bg-[#FF6B58]/10 text-[#FF6B58] hover:bg-[#FF6B58]/20 border border-[#FF6B58]/20'
                          : isActive
                          ? 'bg-white/10 text-[#F8FAFC] border border-white/15'
                          : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </NavLink>
                );
              })}
            </nav>

            {/* Emergency Notice at Bottom */}
            <div className="p-4 border-t border-white/10 shrink-0">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-rose-300">
                      Life-threatening emergency?
                    </p>
                    <p className="text-[11px] text-rose-200/70 mt-0.5">
                      Call <span className="font-bold">112</span> immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-[#0A1120] border-t border-white/10 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Emergency Notice Banner */}
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300 text-xs sm:text-sm">
                🚨 Life-Threatening Emergency? Call <span className="font-bold underline">112</span> Immediately.
              </p>
              <p className="text-[11px] text-rose-200/75 mt-0.5 leading-relaxed">
                ResQIntel is a municipal civic issue tracking platform. It does NOT dispatch fire, police, or ambulance rescue teams.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/5 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <LogoMark size={20} />
              <span className="font-semibold text-slate-300">ResQIntel Civic Incident Intelligence</span>
              <span>— Community Issue Reporting &amp; Administration</span>
            </div>
            <div className="flex items-center space-x-5">
              <Link to="/how-it-works" className="hover:text-slate-300 transition-colors">How It Works</Link>
              <Link to="/faq" className="hover:text-slate-300 transition-colors">FAQ</Link>
              <Link to="/explore" className="hover:text-slate-300 transition-colors">Incidents</Link>
              <Link to="/map" className="hover:text-slate-300 transition-colors">Public Map</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Keyframe animation for drawer */}
      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0.5; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};
