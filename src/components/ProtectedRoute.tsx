import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] dark:bg-[#0f172a] text-[#111827] dark:text-[#f1f5f9] flex flex-col items-center justify-center p-4 transition-colors duration-200">
        <div className="relative w-12 h-12 rounded-2xl bg-[#6366f1] dark:bg-[#818cf8] flex items-center justify-center text-white dark:text-slate-900 shadow-xl shadow-indigo-500/20 mb-4 animate-bounce font-bold text-lg">
          <span>O</span>
        </div>
        <p className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9]">
          Loading ORBIT Life OS...
        </p>
        <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
          Verifying session
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] dark:bg-[#0f172a] flex items-center justify-center transition-colors duration-200">
        <div className="w-8 h-8 rounded-xl bg-[#6366f1] dark:bg-[#818cf8] animate-pulse" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
