import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  CheckSquare,
  Wallet,
  Brain,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Sparkles,
  Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MODULES } from '../data/modules';
import { Badge } from './ui';
import { ThemeToggle } from './ThemeToggle';

export const Layout: React.FC = () => {
  const { user, signOut, isDemoUser, isSupabaseConnected } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'O';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const bottomNavItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Budget', path: '/budget', icon: Wallet },
    { label: 'Brain', path: '/brain', icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-gray-200/80 dark:bg-slate-950 flex justify-center selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Mobile-first App Shell Frame (max-width 480px, centered on desktop) */}
      <div className="w-full max-w-[480px] min-h-screen bg-[#f9fafb] dark:bg-[#0f172a] text-[#111827] dark:text-[#f1f5f9] shadow-2xl flex flex-col relative border-x border-[#e5e7eb] dark:border-[#334155] transition-colors duration-200">
        
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-[#e5e7eb] dark:border-[#334155] px-4 py-3 flex items-center justify-between shadow-xs transition-colors duration-200">
          {/* Logo & Brand */}
          <NavLink
            to="/"
            className="flex items-center gap-2 group transition-transform active:scale-95"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6366f1] to-indigo-400 dark:from-[#818cf8] dark:to-indigo-500 flex items-center justify-center text-white dark:text-slate-950 shadow-sm shadow-indigo-300 dark:shadow-none font-bold text-sm tracking-wider">
              <span>O</span>
              <div className="absolute -inset-0.5 rounded-xl border border-indigo-300/40 dark:border-indigo-400/20 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-[#111827] dark:text-[#f1f5f9]">
                  ORBIT
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 bg-indigo-50 text-[#6366f1] dark:bg-indigo-950/80 dark:text-[#818cf8] rounded-md">
                  Life OS
                </span>
              </div>
            </div>
          </NavLink>

          {/* Right Action: Theme Toggle & Avatar Menu */}
          <div className="relative flex items-center gap-1.5">
            {/* Theme Toggle Icon Button */}
            <ThemeToggle />

            {/* User Avatar Button */}
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-[#818cf8] border border-indigo-200 dark:border-indigo-800 font-semibold text-xs transition-all hover:ring-2 hover:ring-[#6366f1] dark:hover:ring-[#818cf8] cursor-pointer focus:outline-none"
              title="User profile and settings"
              aria-label="User profile and settings"
            >
              {getInitials(user?.name)}
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 top-11 z-50 w-64 rounded-xl bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-2.5 border-b border-[#e5e7eb] dark:border-[#334155] mb-1">
                    <p className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] truncate">
                      {user?.name || 'Orbit User'}
                    </p>
                    <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] truncate">
                      {user?.email}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      {isDemoUser ? (
                        <span className="inline-flex items-center text-[10px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                          Demo Mode
                        </span>
                      ) : isSupabaseConnected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                          <Database className="w-2.5 h-2.5" /> Supabase Auth
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-medium text-gray-600 bg-gray-100 dark:bg-slate-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                          Local Session
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-0.5 py-1">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsSidebarOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#111827] dark:text-[#f1f5f9] hover:bg-gray-50 dark:hover:bg-slate-700/60 rounded-lg transition-colors duration-200 text-left"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#818cf8]" /> All 12 Modules
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#6b7280] dark:text-[#94a3b8]" />
                    </button>
                  </div>

                  <div className="border-t border-[#e5e7eb] dark:border-[#334155] mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors duration-200 text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT AREA */}
        <main className="flex-1 pb-20 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>

        {/* BOTTOM NAVIGATION (Mobile-first app style) */}
        <nav className="fixed bottom-0 z-30 w-full max-w-[480px] bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-t border-[#e5e7eb] dark:border-[#334155] px-2 py-1.5 shadow-lg transition-colors duration-200">
          <div className="grid grid-cols-5 items-center">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'text-[#6366f1] dark:text-[#818cf8] font-semibold'
                      : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9]'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-[10px] tracking-tight">{item.label}</span>
                </NavLink>
              );
            })}

            {/* More button to toggle full module drawer/sidebar */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
                isSidebarOpen
                  ? 'text-[#6366f1] dark:text-[#818cf8] font-semibold'
                  : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9]'
              }`}
            >
              <div className="relative">
                <Menu className="w-5 h-5 mb-0.5" />
                <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#6366f1] dark:bg-[#818cf8]" />
              </div>
              <span className="text-[10px] tracking-tight">More</span>
            </button>
          </div>
        </nav>

        {/* SIDEBAR / DRAWER FOR "MORE" (Lists all 12 modules) */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-[480px] h-full bg-[#f9fafb] dark:bg-[#0f172a] shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-250 transition-colors duration-200">
              
              {/* Drawer Header */}
              <div className="px-5 py-4 bg-white dark:bg-[#0f172a] border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between transition-colors duration-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#111827] dark:text-[#f1f5f9]">All Modules</span>
                    <Badge variant="secondary">12 Available</Badge>
                  </div>
                  <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-0.5">
                    Your complete Personal Life OS directory
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle size="sm" />
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] bg-gray-100 hover:bg-gray-200 dark:bg-[#1e293b] dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Module List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {MODULES.map((mod) => {
                  const Icon = mod.icon;
                  const isActive = location.pathname === mod.path;
                  return (
                    <NavLink
                      key={mod.id}
                      to={mod.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-50/90 border-[#6366f1]/40 dark:bg-indigo-950/40 dark:border-[#818cf8]/50 text-indigo-900 dark:text-[#f1f5f9]'
                          : 'bg-white border-[#e5e7eb] hover:border-gray-300 dark:bg-[#1e293b] dark:border-[#334155] dark:hover:border-slate-600 text-[#111827] dark:text-[#f1f5f9] shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${mod.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm">{mod.title}</span>
                            {mod.id === 'shopping' ? (
                              <span className="text-[10px] text-pink-600 bg-pink-50 dark:bg-pink-950/70 dark:text-pink-300 px-1.5 py-0.2 rounded-full font-semibold border border-pink-200 dark:border-pink-800/60">
                                Live
                              </span>
                            ) : mod.id === 'brain' ? (
                              <span className="text-[10px] text-purple-600 bg-purple-50 dark:bg-purple-950/70 dark:text-purple-300 px-1.5 py-0.2 rounded-full font-semibold border border-purple-200 dark:border-purple-800/60">
                                Live
                              </span>
                            ) : mod.id === 'documents' ? (
                              <span className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950/70 dark:text-blue-300 px-1.5 py-0.2 rounded-full font-semibold border border-blue-200 dark:border-blue-800/60">
                                Live
                              </span>
                            ) : mod.id === 'medicines' ? (
                              <span className="text-[10px] text-rose-600 bg-rose-50 dark:bg-rose-950/70 dark:text-rose-300 px-1.5 py-0.2 rounded-full font-semibold border border-rose-200 dark:border-rose-800/60">
                                Live
                              </span>
                            ) : mod.id === 'learning' ? (
                              <span className="text-[10px] text-cyan-600 bg-cyan-50 dark:bg-cyan-950/70 dark:text-cyan-300 px-1.5 py-0.2 rounded-full font-semibold border border-cyan-200 dark:border-cyan-800/60">
                                Live
                              </span>
                            ) : mod.id === 'style' ? (
                              <span className="text-[10px] text-violet-600 bg-violet-50 dark:bg-violet-950/70 dark:text-violet-300 px-1.5 py-0.2 rounded-full font-semibold border border-violet-200 dark:border-violet-800/60">
                                Live
                              </span>
                            ) : mod.id === 'career' ? (
                              <span className="text-[10px] text-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 dark:text-indigo-300 px-1.5 py-0.2 rounded-full font-semibold border border-indigo-200 dark:border-indigo-800/60">
                                Live
                              </span>
                            ) : mod.id === 'credentials' ? (
                              <span className="text-[10px] text-teal-600 bg-teal-50 dark:bg-teal-950/70 dark:text-teal-300 px-1.5 py-0.2 rounded-full font-semibold border border-teal-200 dark:border-teal-800/60">
                                Live
                              </span>
                            ) : mod.status === 'coming-soon' ? (
                              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] font-normal">
                                Soon
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] line-clamp-1">
                            {mod.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#6b7280] dark:text-[#94a3b8] shrink-0" />
                    </NavLink>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-white dark:bg-[#1e293b] border-t border-[#e5e7eb] dark:border-[#334155] text-center transition-colors duration-200">
                <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] font-medium">
                  ORBIT Personal Life OS • v1.0.0
                </p>
                <p className="text-[11px] text-[#6b7280]/80 dark:text-[#94a3b8]/80 mt-0.5">
                  Connected to Supabase Cloud Auth
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
