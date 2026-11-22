import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { checkHealth, getDashboardStats } from '../services/api';

export const MainLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLang, setLang] = useState('All');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const health = await checkHealth();
        if (health.status === 'healthy') {
          setIsConnected(true);
        }
        const s = await getDashboardStats();
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
    <div className="min-h-screen bg-[#0D1527] text-[#F4EDE0] flex font-sans selection:bg-[#FF6B58]/30 selection:text-[#F4EDE0]">
      {/* Background radial atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full glow-navy-subtle opacity-70 blur-3xl"></div>
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] rounded-full glow-coral-subtle opacity-20 blur-3xl"></div>
      </div>

      {/* Main Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        pendingReviewCount={stats?.pending_reviews || 0}
        isConnected={isConnected}
      />

      {/* Primary Content Container */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 relative z-10 ${
        isCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        <Topbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentLang={currentLang}
          setLang={setLang}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
