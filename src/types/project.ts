export type ProjectStatus = 'live' | 'wip' | 'idea';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  tech_stack: string[];
  live_link?: string | null;
  repo_link?: string | null;
  summary?: string | null;
  status: ProjectStatus;
  created_at: string;
}

export interface ProjectSummary {
  total: number;
  live: number;
  wip: number;
  idea: number;
}
