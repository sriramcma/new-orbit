import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Github,
  ChevronDown,
  ChevronUp,
  Trash2,
  Check,
  Code,
  Globe,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Project, ProjectStatus } from '../types/project';
import { isValidUrl, ensureHttpPrefix, parseTechStack } from '../utils/projectUtils';
import { Button } from './ui';

interface ProjectCardProps {
  project: Project;
  isExpanded?: boolean;
  onToggleExpand: () => void;
  onUpdate: (id: string, updates: Partial<Project>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToast: (msg: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isExpanded = false,
  onToggleExpand,
  onUpdate,
  onDelete,
  onToast,
}) => {
  // Local edit states for inline expand
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [techStackText, setTechStackText] = useState(project.tech_stack.join(', '));
  const [liveLink, setLiveLink] = useState(project.live_link || '');
  const [repoLink, setRepoLink] = useState(project.repo_link || '');
  const [summary, setSummary] = useState(project.summary || '');

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [liveLinkError, setLiveLinkError] = useState<string | null>(null);
  const [repoLinkError, setRepoLinkError] = useState<string | null>(null);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

  // Sync state if project prop updates
  useEffect(() => {
    setName(project.name);
    setStatus(project.status);
    setTechStackText(project.tech_stack.join(', '));
    setLiveLink(project.live_link || '');
    setRepoLink(project.repo_link || '');
    setSummary(project.summary || '');
    setConfirmDelete(false);
  }, [project]);

  // Derived parsed tech stack chips for live preview
  const liveChips = parseTechStack(techStackText);

  // Save handler
  const handleSave = async () => {
    // Validate
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Project name is required');
      onToast('Project name cannot be empty');
      return;
    }
    setNameError(null);

    // Validate URLs
    let formattedLive = liveLink.trim();
    if (formattedLive) {
      formattedLive = ensureHttpPrefix(formattedLive);
      if (!isValidUrl(formattedLive)) {
        setLiveLinkError('Must be a valid URL (e.g. https://myproject.com)');
        onToast('Invalid Live Link URL');
        return;
      }
    }
    setLiveLinkError(null);

    let formattedRepo = repoLink.trim();
    if (formattedRepo) {
      formattedRepo = ensureHttpPrefix(formattedRepo);
      if (!isValidUrl(formattedRepo)) {
        setRepoLinkError('Must be a valid URL (e.g. https://github.com/user/repo)');
        onToast('Invalid Repo Link URL');
        return;
      }
    }
    setRepoLinkError(null);

    setIsSaving(true);
    try {
      const parsedStack = parseTechStack(techStackText);
      await onUpdate(project.id, {
        name: trimmedName,
        status,
        tech_stack: parsedStack,
        live_link: formattedLive || null,
        repo_link: formattedRepo || null,
        summary: summary.trim() || null,
      });

      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 2000);
      onToast('Project updated ✨');
    } catch {
      onToast('Failed to save project changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await onDelete(project.id);
      onToast(`Deleted "${project.name}"`);
    } catch {
      onToast('Failed to delete project');
    }
  };

  // Status badge config
  const getStatusBadge = (st: ProjectStatus) => {
    switch (st) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        );
      case 'wip':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            WIP
          </span>
        );
      case 'idea':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Idea
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
        isExpanded
          ? 'bg-white dark:bg-[#1e293b] border-indigo-300 dark:border-indigo-500/50 ring-1 ring-indigo-200 dark:ring-indigo-900/40'
          : 'bg-white dark:bg-[#1e293b] border-[#e5e7eb] dark:border-[#334155] hover:border-indigo-200 dark:hover:border-slate-600'
      }`}
    >
      {/* CARD MAIN HEADER (Clickable to toggle expand) */}
      <div
        onClick={onToggleExpand}
        className="p-4 cursor-pointer select-none space-y-2.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {getStatusBadge(project.status)}
            <span className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] font-medium">
              {project.tech_stack.length} {project.tech_stack.length === 1 ? 'tech' : 'techs'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {project.repo_link && !isExpanded && (
              <a
                href={project.repo_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="View GitHub Repository"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b7280] dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Project Name */}
        <div>
          <h3 className="text-base font-bold text-[#111827] dark:text-[#f1f5f9] tracking-tight leading-snug">
            {project.name}
          </h3>
          {project.summary && !isExpanded && (
            <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] line-clamp-2 mt-1 leading-relaxed">
              {project.summary}
            </p>
          )}
        </div>

        {/* Tech Stack Chips (Gray chips) */}
        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {project.tech_stack.map((tech, idx) => (
              <span
                key={`${project.id}-chip-${idx}`}
                className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Action Row for Unexpanded State: Prominent Open Live Link Button */}
        {!isExpanded && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-1">
            <div className="flex items-center gap-2">
              {project.live_link ? (
                <a
                  href={project.live_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <span>Open Live Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-[11px] text-[#9ca3af] dark:text-slate-500 italic">
                  No live deployment URL
                </span>
              )}

              {project.repo_link && (
                <a
                  href={project.repo_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/80 dark:border-slate-700/80 active:scale-95 transition-all"
                >
                  <Github className="w-3 h-3" />
                  <span>Repo</span>
                </a>
              )}
            </div>

            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              Tap to edit
            </span>
          </div>
        )}
      </div>

      {/* INLINE EXPANDED EDITING VIEW */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-3.5 animate-in fade-in duration-150">
          {/* Editable Name */}
          <div>
            <label className="block text-[11px] font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. ORBIT — Life OS"
              className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                nameError
                  ? 'border-rose-400 ring-1 ring-rose-300 dark:border-rose-600'
                  : 'border-[#e5e7eb] dark:border-[#334155]'
              }`}
            />
            {nameError && (
              <p className="text-[10px] text-rose-500 mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {nameError}
              </p>
            )}
          </div>

          {/* Status Toggle */}
          <div>
            <label className="block text-[11px] font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider mb-1">
              Project Status
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStatus('idea')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  status === 'idea'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                ⚪ Idea
              </button>
              <button
                type="button"
                onClick={() => setStatus('wip')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  status === 'wip'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                🟡 WIP
              </button>
              <button
                type="button"
                onClick={() => setStatus('live')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  status === 'live'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                🟢 Live
              </button>
            </div>
          </div>

          {/* Tech Stack Input (Comma-separated) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider">
                Tech Stack
              </label>
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                Comma-separated
              </span>
            </div>
            <input
              type="text"
              value={techStackText}
              onChange={(e) => setTechStackText(e.target.value)}
              placeholder="e.g. React 19, TypeScript, Tailwind, Supabase"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {liveChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 pt-1">
                {liveChips.map((chip, i) => (
                  <span
                    key={`live-preview-${i}`}
                    className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Live Link */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3 text-indigo-500" />
                Live Demo Link
              </label>
              {liveLink && (
                <a
                  href={ensureHttpPrefix(liveLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Test URL</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <input
              type="url"
              value={liveLink}
              onChange={(e) => {
                setLiveLink(e.target.value);
                if (liveLinkError) setLiveLinkError(null);
              }}
              placeholder="https://myproject.com"
              className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                liveLinkError
                  ? 'border-rose-400 ring-1 ring-rose-300 dark:border-rose-600'
                  : 'border-[#e5e7eb] dark:border-[#334155]'
              }`}
            />
            {liveLinkError && (
              <p className="text-[10px] text-rose-500 mt-0.5">{liveLinkError}</p>
            )}
          </div>

          {/* Repo Link */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider flex items-center gap-1">
                <Github className="w-3 h-3" />
                Repository Link (Optional)
              </label>
              {repoLink && (
                <a
                  href={ensureHttpPrefix(repoLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Test Repo</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <input
              type="url"
              value={repoLink}
              onChange={(e) => {
                setRepoLink(e.target.value);
                if (repoLinkError) setRepoLinkError(null);
              }}
              placeholder="https://github.com/username/project"
              className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                repoLinkError
                  ? 'border-rose-400 ring-1 ring-rose-300 dark:border-rose-600'
                  : 'border-[#e5e7eb] dark:border-[#334155]'
              }`}
            />
            {repoLinkError && (
              <p className="text-[10px] text-rose-500 mt-0.5">{repoLinkError}</p>
            )}
          </div>

          {/* Summary / Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-[#6b7280] dark:text-[#94a3b8] uppercase tracking-wider mb-1">
              Project Summary &amp; Highlights
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What problem does it solve? Architecture, performance stats, or personal brag notes..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
          </div>

          {/* Expanded Bottom Action Bar */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
            {/* Delete button with confirm state */}
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Confirm Delete?</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            {/* Right: Close & Save */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleExpand}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs gap-1.5"
              >
                {savedIndicator ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
