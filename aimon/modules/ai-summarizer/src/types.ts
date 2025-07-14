export interface ParsedActivity {
  id: string;
  timestamp: Date;
  device_id: string;
  session_id: string;
  type: ActivityType;
  duration?: number;
  category: ActivityCategory;
  application: string;
  window_title: string;
  content: ActivityContent;
  metadata: ActivityMetadata;
  quality_score: number;
}

export enum ActivityType {
  TYPING = 'typing',
  CLICKING = 'clicking',
  SCROLLING = 'scrolling',
  READING = 'reading',
  CODING = 'coding',
  BROWSING = 'browsing',
  COMMUNICATING = 'communicating',
  DOCUMENTING = 'documenting',
  IDLE = 'idle'
}

export enum ActivityCategory {
  PRODUCTIVE = 'productive',
  NEUTRAL = 'neutral',
  DISTRACTING = 'distracting',
  BREAK = 'break',
  COMMUNICATION = 'communication',
  LEARNING = 'learning',
  ENTERTAINMENT = 'entertainment'
}

export interface ActivityContent {
  text?: string;
  language?: string;
  keywords?: string[];
  actions?: string[];
  files?: string[];
  urls?: string[];
}

export interface ActivityMetadata {
  confidence: number;
  parser_version: string;
  rules_applied: string[];
  anomalies?: string[];
  tags?: string[];
}

export interface WorkSummary {
  id: string;
  session_id: string;
  device_id: string;
  period: TimePeriod;
  summary_type: SummaryType;
  content: SummaryContent;
  metrics: SummaryMetrics;
  insights: SummaryInsights;
  generated_at: Date;
  version: string;
}

export interface TimePeriod {
  start: Date;
  end: Date;
  duration: number; // milliseconds
}

export enum SummaryType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  SESSION = 'session',
  PROJECT = 'project',
  CUSTOM = 'custom'
}

export interface SummaryContent {
  overview: string;
  key_activities: string[];
  achievements: string[];
  focus_areas: string[];
  distractions?: string[];
  recommendations?: string[];
}

export interface SummaryMetrics {
  total_activities: number;
  active_time: number;
  idle_time: number;
  productivity_score: number;
  focus_score: number;
  distraction_ratio: number;
  top_applications: ApplicationMetric[];
  category_breakdown: Record<ActivityCategory, number>;
  type_breakdown: Record<ActivityType, number>;
}

export interface ApplicationMetric {
  name: string;
  time_spent: number;
  activity_count: number;
  category: ActivityCategory;
  productivity_contribution: number;
}

export interface SummaryInsights {
  productive_patterns: string[];
  time_wasters: string[];
  efficiency_tips: string[];
  goal_progress?: GoalProgress[];
  mood_indicators?: string[];
}

export interface GoalProgress {
  goal_id: string;
  goal_name: string;
  target: number;
  achieved: number;
  progress_percentage: number;
  status: 'on_track' | 'behind' | 'ahead' | 'completed';
}

export interface SummaryTemplate {
  id: string;
  name: string;
  description: string;
  type: SummaryType;
  prompt_template: string;
  required_metrics: string[];
  output_format: 'narrative' | 'bullet_points' | 'structured' | 'mixed';
  max_length: number;
  target_audience: 'self' | 'manager' | 'team' | 'client';
}

export interface AIModelConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  api_key?: string;
  base_url?: string;
  temperature: number;
  max_tokens: number;
  timeout: number;
}

export interface SummaryRequest {
  session_id?: string;
  device_id?: string;
  time_period: TimePeriod;
  summary_type: SummaryType;
  template_id?: string;
  custom_prompt?: string;
  include_insights: boolean;
  include_recommendations: boolean;
  target_audience?: string;
}

export interface ContextData {
  recent_summaries: WorkSummary[];
  user_goals: Goal[];
  user_preferences: UserPreferences;
  project_context?: ProjectContext;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  target_value: number;
  current_value: number;
  metric_type: 'time' | 'count' | 'percentage';
  deadline?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface UserPreferences {
  summary_frequency: 'never' | 'hourly' | 'daily' | 'weekly';
  preferred_length: 'brief' | 'medium' | 'detailed';
  focus_areas: string[];
  exclude_categories: ActivityCategory[];
  notification_settings: NotificationSettings;
}

export interface NotificationSettings {
  email_summaries: boolean;
  push_notifications: boolean;
  summary_times: string[]; // e.g., ['09:00', '17:00']
  productivity_alerts: boolean;
}

export interface ProjectContext {
  current_projects: Project[];
  active_project?: string;
  project_goals: Record<string, Goal[]>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  start_date: Date;
  deadline?: Date;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  priority: 'low' | 'medium' | 'high';
  associated_apps: string[];
  keywords: string[];
}