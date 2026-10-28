import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Code,
  Search,
  X,
  Plus,
  Database,
  Globe,
  Sparkles,
  ExternalLink,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Project, ProjectStatus } from '../types/project';
import { projectService } from '../services/projectService';
import { ProjectCard } from '../components/ProjectCard';
import { AddProjectSheet } from '../components/AddProjectSheet';
import { ProjectSchemaModal } from '../components/projects/ProjectSchemaModal';
import { Button } from '../components/ui';

export const CareerPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest_user';

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | ProjectStatus>('all');

  // Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded project ID (for inline card expand)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Load projects
  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await projectService.fetchProjects(userId);
      setProjects(data);
    } catch {
      showToast('Error loading projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [userId]);

  // Derived counts for Summary Strip
  const summary = useMemo(() => {
    const total = projects.length;
    const live = projects.filter((p) => p.status === 'live').length;
    const wip = projects.filter((p) => p.status === 'wip').length;
    const idea = projects.filter((p) => p.status === 'idea').length;
    return { total, live, wip, idea };
  }, [projects]);

  // Filtered & Searched Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((item) => {
      // Tab filter
      if (activeTab !== 'all' && item.status !== activeTab) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesTech = item.tech_stack.some((tech) =>
          tech.toLowerCase().includes(q)
        );
        const matchesSummary = item.summary?.toLowerCase().includes(q) || false;
        return matchesName || matchesTech || matchesSummary;
      }

      return true;
    });
  }, [projects, activeTab, searchQuery]);

  // Handlers
  const handleAddProject = async (data: {
    name: string;
    tech_stack: string[];
    live_link?: string | null;
    repo_link?: string | null;
    summary?: string | null;
    status: ProjectStatus;
  }) => {
    const created = await projectService.addProject(userId, data);
    setProjects((prev) => [created, ...prev]);
    showToast(`Added "${created.name}" ✨`);
  };

  const handleUpdateProject = async (id: string, updates: Partial<Project>) => {
    const updated = await projectService.updateProject(userId, id, updates);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleDeleteProject = async (id: string) => {
    await projectService.deleteProject(userId, id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="min-h-full pb-24 text-[#111827] dark:text-[#f1f5f9] transition-colors duration-200">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-[#e5e7eb] dark:border-[#334155] px-4 py-3 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold tracking-tight text-[#111827] dark:text-[#f1f5f9]">
                  Career &amp; Projects
                </h1>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 dark:text-indigo-400 px-1.5 py-0.2 rounded-full border border-indigo-200 dark:border-indigo-800/60">
                  Portfolio
                </span>
              </div>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Personal project showcases, live demos &amp; tech stacks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Search Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearchQuery('');
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                isSearchOpen || searchQuery
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold'
                  : 'text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
              title="Search projects or tech stack"
              aria-label="Search projects"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* SQL Schema Button */}
            <button
              type="button"
              onClick={() => setIsSchemaModalOpen(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="View SQL Schema & Database Setup"
              aria-label="View SQL Schema"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STICKY SEARCH BAR (Collapsible) */}
        {isSearchOpen && (
          <div className="mt-2.5 pt-2 border-t border-[#e5e7eb] dark:border-[#334155] animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-[#6b7280] dark:text-[#94a3b8]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects or tech stack (e.g. React, Three.js)..."
                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-gray-50 dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-[10px] text-[#6b7280] dark:text-[#94a3b8] mt-1 px-1">
                Found {filteredProjects.length}{' '}
                {filteredProjects.length === 1 ? 'match' : 'matches'} for "{searchQuery}"
              </p>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 space-y-3.5">
        {/* SUMMARY STRIP (Top) */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] rounded-2xl shadow-xs transition-colors">
          {/* Total Projects */}
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-center">
            <span className="text-[10px] font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider">
              Total
            </span>
            <span className="text-base font-extrabold text-[#111827] dark:text-[#f1f5f9] mt-0.5">
              {summary.total}
            </span>
            <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">Projects</span>
          </div>

          {/* Live Projects */}
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 text-center">
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {summary.live}
            </span>
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">Deployed</span>
          </div>

          {/* WIP Projects */}
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/40 text-center">
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              WIP
            </span>
            <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {summary.wip}
            </span>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">Building</span>
          </div>
        </div>

        {/* FILTER TABS: [ All ] [ Live ] [ WIP ] [ Ideas ] */}
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-800 text-[#111827] dark:text-[#f1f5f9] shadow-xs'
                : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9]'
            }`}
          >
            All ({summary.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'live'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            Live ({summary.live})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wip')}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'wip'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-amber-600 dark:hover:text-amber-400'
            }`}
          >
            WIP ({summary.wip})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('idea')}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'idea'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs'
                : 'text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-[#f1f5f9]'
            }`}
          >
            Ideas ({summary.idea})
          </button>
        </div>

        {/* PROJECT LIST */}
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-[#6b7280] dark:text-[#94a3b8]">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* EMPTY STATE */
          <div className="p-8 text-center bg-white dark:bg-[#1e293b] border border-dashed border-[#e5e7eb] dark:border-[#334155] rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111827] dark:text-[#f1f5f9]">
                {searchQuery
                  ? 'No matching projects'
                  : activeTab !== 'all'
                  ? `No ${activeTab.toUpperCase()} projects yet`
                  : 'Add your first project'}
              </h3>
              <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-1 max-w-[280px] mx-auto leading-relaxed">
                {searchQuery
                  ? 'Try searching for another tech keyword like React, TypeScript, or Go.'
                  : 'Track your personal developer portfolio, live web deployments, and ideas.'}
              </p>
            </div>
            <div className="pt-2">
              <Button
                size="sm"
                onClick={() => {
                  if (searchQuery) setSearchQuery('');
                  else setIsAddOpen(true);
                }}
                className="gap-1.5"
              >
                {searchQuery ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Clear Search</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* CARDS LIST */
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isExpanded={expandedId === project.id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === project.id ? null : project.id)
                }
                onUpdate={handleUpdateProject}
                onDelete={handleDeleteProject}
                onToast={showToast}
              />
            ))}
          </div>
        )}
      </div>

      {/* FLOATING ACTION BUTTON (FAB: [+ Add Project], bottom-right, above bottom nav) */}
      <div className="fixed bottom-20 right-4 z-40 max-w-[480px]">
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-95 transition-all cursor-pointer"
          title="Add a new project"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Project</span>
        </button>
      </div>

      {/* ADD PROJECT MODAL SHEET */}
      <AddProjectSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddProject}
        onToast={showToast}
      />

      {/* SQL SCHEMA MODAL */}
      <ProjectSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />
    </div>
  );
};
