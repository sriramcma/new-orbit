import React, { useState } from 'react';
import { X, Code, Globe, Github, Plus, AlertCircle, Sparkles } from 'lucide-react';
import { ProjectStatus } from '../types/project';
import { isValidUrl, ensureHttpPrefix, parseTechStack } from '../utils/projectUtils';
import { Button } from './ui';

interface AddProjectSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: {
    name: string;
    tech_stack: string[];
    live_link?: string | null;
    repo_link?: string | null;
    summary?: string | null;
    status: ProjectStatus;
  }) => Promise<void>;
  onToast: (msg: string) => void;
}

export const AddProjectSheet: React.FC<AddProjectSheetProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onToast,
}) => {
  const [name, setName] = useState('');
  const [techStackText, setTechStackText] = useState('');
  const [liveLink, setLiveLink] = useState('');
  const [repoLink, setRepoLink] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('live');

  // Error states
  const [nameError, setNameError] = useState<string | null>(null);
  const [liveLinkError, setLiveLinkError] = useState<string | null>(null);
  const [repoLinkError, setRepoLinkError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick suggestion tags
  const POPULAR_TECHS = ['React', 'TypeScript', 'Next.js', 'Tailwind', 'Supabase', 'Node.js', 'PostgreSQL', 'Vite'];

  const resetForm = () => {
    setName('');
    setTechStackText('');
    setLiveLink('');
    setRepoLink('');
    setSummary('');
    setStatus('live');
    setNameError(null);
    setLiveLinkError(null);
    setRepoLinkError(null);
  };

  const handleAddQuickTag = (tag: string) => {
    const existing = parseTechStack(techStackText);
    if (!existing.includes(tag)) {
      const updated = [...existing, tag];
      setTechStackText(updated.join(', '));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Project name is required');
      onToast('Project name is required');
      return;
    }
    setNameError(null);

    let formattedLive = liveLink.trim();
    if (formattedLive) {
      formattedLive = ensureHttpPrefix(formattedLive);
      if (!isValidUrl(formattedLive)) {
        setLiveLinkError('Must be a valid web URL (e.g. https://myproject.com)');
        onToast('Invalid Live Link format');
        return;
      }
    }
    setLiveLinkError(null);

    let formattedRepo = repoLink.trim();
    if (formattedRepo) {
      formattedRepo = ensureHttpPrefix(formattedRepo);
      if (!isValidUrl(formattedRepo)) {
        setRepoLinkError('Must be a valid URL (e.g. https://github.com/user/repo)');
        onToast('Invalid Repo Link format');
        return;
      }
    }
    setRepoLinkError(null);

    setIsSubmitting(true);
    try {
      const parsedTech = parseTechStack(techStackText);
      await onSubmit({
        name: trimmedName,
        tech_stack: parsedTech,
        live_link: formattedLive || null,
        repo_link: formattedRepo || null,
        summary: summary.trim() || null,
        status,
      });

      resetForm();
      onClose();
    } catch {
      onToast('Failed to add project');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview chips
  const previewChips = parseTechStack(techStackText);

  // Hook safety: early return AFTER all hooks
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[480px] bg-white dark:bg-[#1e293b] rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-[#e5e7eb] dark:border-[#334155] max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 transition-colors">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] dark:border-[#334155] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#111827] dark:text-[#f1f5f9]">
                Add Portfolio Project
              </h3>
              <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8]">
                Showcase your creations, live deployments &amp; repos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6b7280] hover:text-[#111827] dark:text-[#94a3b8] dark:hover:text-[#f1f5f9] hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. ORBIT — Life OS"
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                nameError
                  ? 'border-rose-400 ring-1 ring-rose-300 dark:border-rose-600'
                  : 'border-[#e5e7eb] dark:border-[#334155]'
              }`}
            />
            {nameError && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {nameError}
              </p>
            )}
          </div>

          {/* Initial Status */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
              Project Status
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStatus('live')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  status === 'live'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                🟢 Live
              </button>
              <button
                type="button"
                onClick={() => setStatus('wip')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  status === 'wip'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                🟡 WIP
              </button>
              <button
                type="button"
                onClick={() => setStatus('idea')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  status === 'idea'
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                ⚪ Idea
              </button>
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9]">
                Tech Stack (Comma-separated)
              </label>
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">
                e.g. React, Node, MongoDB
              </span>
            </div>
            <input
              type="text"
              value={techStackText}
              onChange={(e) => setTechStackText(e.target.value)}
              placeholder="React, TypeScript, Tailwind, Supabase"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* Quick add popular tags */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-[#6b7280] dark:text-[#94a3b8]">Quick tags:</span>
              {POPULAR_TECHS.map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => handleAddQuickTag(tech)}
                  className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  +{tech}
                </button>
              ))}
            </div>

            {/* Live Preview Chips */}
            {previewChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                {previewChips.map((chip, idx) => (
                  <span
                    key={`preview-${idx}`}
                    className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Live Link */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
              Live Link (URL)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b7280] dark:text-[#94a3b8]">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <input
                type="text"
                value={liveLink}
                onChange={(e) => {
                  setLiveLink(e.target.value);
                  if (liveLinkError) setLiveLinkError(null);
                }}
                placeholder="https://mycoolapp.com"
                className={`w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  liveLinkError
                    ? 'border-rose-400 ring-1 ring-rose-300 dark:border-rose-600'
                    : 'border-[#e5e7eb] dark:border-[#334155]'
                }`}
              />
            </div>
            {liveLinkError && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {liveLinkError}
              </p>
            )}
          </div>

          {/* Repo Link */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
              Repository Link (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b7280] dark:text-[#94a3b8]">
                <Github className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={repoLink}
                onChange={(e) => {
                  setRepoLink(e.target.value);
                  if (repoLinkError) setRepoLinkError(null);
                }}
                placeholder="https://github.com/developer/project"
                className={`w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  repoLinkError
                    ? 'border-rose-400 ring-1 ring-rose-300 dark:border-rose-600'
                    : 'border-[#e5e7eb] dark:border-[#334155]'
                }`}
              />
            </div>
            {repoLinkError && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {repoLinkError}
              </p>
            )}
          </div>

          {/* Summary / Highlights */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-1">
              Summary / Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Key architecture decisions, problem solved, accomplishments, or metrics..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#e5e7eb] dark:border-[#334155] bg-white dark:bg-slate-900 text-[#111827] dark:text-[#f1f5f9] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 pb-6 flex items-center justify-end gap-2.5 border-t border-[#e5e7eb] dark:border-[#334155]">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Add Project'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
