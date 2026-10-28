import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Project, ProjectStatus, ProjectSummary } from '../types/project';

const LS_PROJECTS_KEY = 'orbit_projects_cache_';

export const PROJECT_SQL_SCHEMA = `-- ============================================
-- ORBIT — Career & Projects (Portfolio Tracker)
-- ============================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  tech_stack TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  live_link TEXT,
  repo_link TEXT,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'wip', 'idea')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
`;

const INITIAL_SEED_PROJECTS: Omit<Project, 'user_id'>[] = [
  {
    id: 'proj_seed_1',
    name: 'ORBIT — Personal Life OS',
    tech_stack: ['React 19', 'TypeScript', 'Tailwind CSS', 'Vite', 'Supabase'],
    live_link: 'https://orbit-life-os.app',
    repo_link: 'https://github.com/developer/orbit-life-os',
    summary: 'All-in-one personal dashboard with 12 modular micro-apps, cashflow planning, task backlog, and local-first offline syncing.',
    status: 'live',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'proj_seed_2',
    name: 'DevPulse — API Health Monitor',
    tech_stack: ['Next.js', 'Go', 'PostgreSQL', 'Redis', 'Docker'],
    live_link: 'https://devpulse.io',
    repo_link: 'https://github.com/developer/devpulse-core',
    summary: 'Real-time synthetic API latency checks with edge probes, incident alert webhooks, and public status pages.',
    status: 'live',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'proj_seed_3',
    name: 'AlgoViz — 3D Pathfinding Simulator',
    tech_stack: ['Three.js', 'TypeScript', 'Web Workers', 'Canvas'],
    live_link: 'https://algoviz.dev',
    repo_link: 'https://github.com/developer/algo-visualizer',
    summary: 'Interactive 3D graph traversal, spatial A* pathfinding, and memory heap layout visualizer with step debugging.',
    status: 'wip',
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'proj_seed_4',
    name: 'GitVoice — Semantic PR Generator',
    tech_stack: ['Rust', 'Tauri', 'LLM API', 'SQLite'],
    live_link: null,
    repo_link: 'https://github.com/developer/git-voice-cli',
    summary: 'Lightweight desktop tray app analyzing staged git diffs to generate semantic commit messages and PR release notes.',
    status: 'idea',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
];

class ProjectService {
  private getLocalCache(userId: string): Project[] {
    try {
      const data = localStorage.getItem(`${LS_PROJECTS_KEY}${userId}`);
      if (!data) {
        const seeded = INITIAL_SEED_PROJECTS.map((p) => ({
          ...p,
          user_id: userId,
        }));
        this.setLocalCache(userId, seeded);
        return seeded;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SEED_PROJECTS.map((p) => ({
        ...p,
        user_id: userId,
      }));
    }
  }

  private setLocalCache(userId: string, items: Project[]): void {
    try {
      localStorage.setItem(`${LS_PROJECTS_KEY}${userId}`, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to write to localStorage for projects:', err);
    }
  }

  /**
   * Fetch all projects for the current user
   */
  async fetchProjects(userId: string): Promise<Project[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          // Normalise tech_stack if needed
          const normalized: Project[] = data.map((item: any) => ({
            ...item,
            tech_stack: Array.isArray(item.tech_stack)
              ? item.tech_stack
              : typeof item.tech_stack === 'string'
              ? item.tech_stack.split(',').map((s: string) => s.trim()).filter(Boolean)
              : [],
          }));
          this.setLocalCache(userId, normalized);
          return normalized;
        }

        console.warn('Supabase projects fetch error, falling back to local cache:', error);
      } catch (err) {
        console.warn('Supabase connection error on projects fetch:', err);
      }
    }

    return this.getLocalCache(userId);
  }

  /**
   * Add a new project
   */
  async addProject(
    userId: string,
    item: {
      name: string;
      tech_stack: string[];
      live_link?: string | null;
      repo_link?: string | null;
      summary?: string | null;
      status: ProjectStatus;
    }
  ): Promise<Project> {
    const newProject: Project = {
      id: crypto.randomUUID ? crypto.randomUUID() : `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      name: item.name.trim(),
      tech_stack: item.tech_stack.map((t) => t.trim()).filter(Boolean),
      live_link: item.live_link ? item.live_link.trim() : null,
      repo_link: item.repo_link ? item.repo_link.trim() : null,
      summary: item.summary ? item.summary.trim() : null,
      status: item.status,
      created_at: new Date().toISOString(),
    };

    // Update local cache immediately
    const current = this.getLocalCache(userId);
    const updated = [newProject, ...current];
    this.setLocalCache(userId, updated);

    // Sync to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            id: newProject.id,
            user_id: userId,
            name: newProject.name,
            tech_stack: newProject.tech_stack,
            live_link: newProject.live_link,
            repo_link: newProject.repo_link,
            summary: newProject.summary,
            status: newProject.status,
            created_at: newProject.created_at,
          })
          .select()
          .single();

        if (error) {
          console.warn('Supabase insert failed, item preserved locally:', error);
        } else if (data) {
          return {
            ...data,
            tech_stack: Array.isArray(data.tech_stack) ? data.tech_stack : newProject.tech_stack,
          };
        }
      } catch (err) {
        console.warn('Supabase connection error during addProject:', err);
      }
    }

    return newProject;
  }

  /**
   * Update an existing project
   */
  async updateProject(
    userId: string,
    id: string,
    updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>
  ): Promise<Project> {
    const current = this.getLocalCache(userId);
    const existingIndex = current.findIndex((p) => p.id === id);

    let updatedItem: Project;
    if (existingIndex >= 0) {
      updatedItem = {
        ...current[existingIndex],
        ...updates,
        tech_stack: updates.tech_stack
          ? updates.tech_stack.map((t) => t.trim()).filter(Boolean)
          : current[existingIndex].tech_stack,
      };
      current[existingIndex] = updatedItem;
      this.setLocalCache(userId, [...current]);
    } else {
      throw new Error('Project not found');
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const payload: any = { ...updates };
        if (updates.tech_stack) {
          payload.tech_stack = updates.tech_stack.map((t) => t.trim()).filter(Boolean);
        }

        const { error } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.warn('Supabase update failed, changes kept locally:', error);
        }
      } catch (err) {
        console.warn('Supabase connection error during updateProject:', err);
      }
    }

    return updatedItem;
  }

  /**
   * Delete a project
   */
  async deleteProject(userId: string, id: string): Promise<void> {
    const current = this.getLocalCache(userId);
    const filtered = current.filter((p) => p.id !== id);
    this.setLocalCache(userId, filtered);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.warn('Supabase delete failed, removed locally:', error);
        }
      } catch (err) {
        console.warn('Supabase connection error during deleteProject:', err);
      }
    }
  }

  /**
   * Get summary statistics (total, live, wip, idea)
   */
  async getProjectsSummary(userId: string): Promise<ProjectSummary> {
    const projects = await this.fetchProjects(userId);
    return {
      total: projects.length,
      live: projects.filter((p) => p.status === 'live').length,
      wip: projects.filter((p) => p.status === 'wip').length,
      idea: projects.filter((p) => p.status === 'idea').length,
    };
  }
}

export const projectService = new ProjectService();
