import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminTopbar } from '../components/AdminTopbar';
import { checkHealth, getAdminDashboardStats } from '../services/api';

export const AdminLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  return (
    <div className="min-h-screen bg-[#0D1527] text-[#F8FAFC] flex font-sans selection:bg-[#FF6B58]/30 selection:text-white">
      <AdminSidebar
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        pendingReviewCount={stats?.reports_pending_review || 0}
        isConnected={isConnected}
      />

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        isCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <AdminTopbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
