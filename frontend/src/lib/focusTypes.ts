import type { APITag } from './types';

export type FocusMode = 'pomodoro' | 'free';
export type FocusRange = 'today' | 'week' | 'month' | '7d' | '30d' | 'all';

export interface FocusSessionOut {
  id: number;
  folder_id: number | null;
  folder_name: string | null;
  name: string;
  mode: FocusMode;
  planned_seconds: number | null;
  focus_seconds: number;
  pause_count: number;
  pause_seconds: number;
  rest_seconds: number;
  started_at: string;
  ended_at: string | null;
  abandoned: boolean;
  summary: string | null;
  tags: APITag[];
  created_at: string;
  updated_at: string;
}

export interface FocusSessionCreate {
  name: string;
  mode: FocusMode;
  planned_seconds?: number | null;
  focus_seconds: number;
  pause_count?: number;
  pause_seconds?: number;
  rest_seconds?: number;
  folder_id?: number | null;
  tag_ids?: number[];
  summary?: string | null;
  started_at?: string;
  ended_at?: string | null;
  abandoned?: boolean;
}

export type FocusSessionUpdate = Partial<FocusSessionCreate>;

export interface FocusSessionListResponse {
  items: FocusSessionOut[];
  total: number;
  skip: number;
  limit: number;
}

export interface FocusSessionFilters {
  search?: string;
  mode?: FocusMode;
  abandoned?: boolean;
  folder_id?: number;
  tag_id?: number;
  started_from?: string;
  started_to?: string;
  skip?: number;
  limit?: number;
}

export interface FocusTrendItem {
  date: string;
  focus_seconds: number;
  session_count: number;
}

export interface FocusHeatmapItem {
  date: string;
  focus_seconds: number;
  level: number;
}

export interface FocusDistributionItem {
  id: number | null;
  name: string;
  focus_seconds: number;
  session_count: number;
}

export interface FocusSummaryResponse {
  range: FocusRange;
  start_date: string | null;
  end_date: string | null;
  total_focus_seconds: number;
  rest_seconds: number;
  pause_seconds: number;
  session_count: number;
  completed_count: number;
  abandoned_count: number;
  average_focus_seconds: number;
  streak_days: number;
  longest_streak_days: number;
  trend: FocusTrendItem[];
  heatmap: FocusHeatmapItem[];
  tag_distribution: FocusDistributionItem[];
  folder_distribution: FocusDistributionItem[];
  recent_sessions: FocusSessionOut[];
}
