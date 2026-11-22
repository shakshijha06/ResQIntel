import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1527] flex items-center justify-center text-xs text-[#F4EDE0]/50 font-mono">
        Authenticating session security credentials...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (requiredRole === 'admin' && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0D1527] flex items-center justify-center p-6 text-center">
        <div className="glass-panel p-8 rounded-2xl max-w-md border border-rose-500/30 text-rose-300 space-y-3">
          <div className="text-base font-serif font-bold text-[#F4EDE0]">Access Restricted</div>
          <p className="text-xs text-[#F4EDE0]/70">
            Administrative privileges required to access this resource. Your current operational role is "{user.role}".
          </p>
        </div>
      </div>
    );
  }

  return children;
};
