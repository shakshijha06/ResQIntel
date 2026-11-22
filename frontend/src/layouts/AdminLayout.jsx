import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminTopbar } from '../components/AdminTopbar';
import { checkHealth, getAdminDashboardStats } from '../services/api';

export const AdminLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const health = await checkHealth();
        if (health.status === 'healthy') {
          setIsConnected(true);
        }
        const s = await getAdminDashboardStats();
        setStats(s);
      } catch (err) {
        console.warn('Backend connection check failed:', err.message);
        setIsConnected(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile drawer on route change or resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#0D1527] text-[#F8FAFC] flex font-sans selection:bg-[#FF6B58]/30 selection:text-white relative overflow-x-hidden w-full">
      {/* Mobile Backdrop Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        mobileDrawerOpen={mobileDrawerOpen}
        closeMobileDrawer={() => setMobileDrawerOpen(false)}
        pendingReviewCount={stats?.reports_pending_review || 0}
        isConnected={isConnected}
      />

      {/* Main Content Area — dynamically shifts on desktop, full width on mobile/tablet */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 w-full transition-all duration-300 ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        <AdminTopbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleMobileDrawer={() => setMobileDrawerOpen(!mobileDrawerOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
