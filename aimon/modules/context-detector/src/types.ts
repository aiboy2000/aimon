export interface WindowInfo {
  id: number;
  title: string;
  application: string;
  process_name: string;
  pid: number;
  bounds: WindowBounds;
  is_active: boolean;
  url?: string;
  document_title?: string;
  screenshot_path?: string;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ApplicationInfo {
  name: string;
  process_name: string;
  executable_path: string;
  version?: string;
  category: ApplicationCategory;
  productivity_score: number;
  window_count: number;
  total_focus_time: number;
  last_active: Date;
}

export enum ApplicationCategory {
  DEVELOPMENT = 'development',
  PRODUCTIVITY = 'productivity',
  COMMUNICATION = 'communication',
  BROWSER = 'browser',
  ENTERTAINMENT = 'entertainment',
  SYSTEM = 'system',
  UTILITY = 'utility',
  UNKNOWN = 'unknown'
}

export interface ContextEvent {
  id: string;
  timestamp: Date;
  device_id: string;
  session_id: string;
  event_type: ContextEventType;
  window_info: WindowInfo;
  application_info: ApplicationInfo;
  focus_duration?: number;
  metadata: ContextMetadata;
}

export enum ContextEventType {
  WINDOW_FOCUS = 'window_focus',
  WINDOW_BLUR = 'window_blur',
  WINDOW_OPEN = 'window_open',
  WINDOW_CLOSE = 'window_close',
  WINDOW_MOVE = 'window_move',
  WINDOW_RESIZE = 'window_resize',
  APPLICATION_START = 'application_start',
  APPLICATION_EXIT = 'application_exit',
  SCREEN_CHANGE = 'screen_change',
  URL_CHANGE = 'url_change'
}

export interface ContextMetadata {
  screen_count: number;
  active_screen: number;
  system_info: SystemInfo;
  workspace?: string;
  project_context?: ProjectContext;
}

export interface SystemInfo {
  os: string;
  os_version: string;
  screen_resolution: string;
  cpu_usage?: number;
  memory_usage?: number;
  battery_level?: number;
}

export interface ProjectContext {
  project_name?: string;
  git_branch?: string;
  git_repo?: string;
  working_directory?: string;
  related_files?: string[];
}

export interface FocusSession {
  id: string;
  application: string;
  window_title: string;
  start_time: Date;
  end_time?: Date;
  duration: number;
  activity_score: number;
  interruption_count: number;
  productivity_rating: number;
}

export interface ApplicationUsageStats {
  application: string;
  category: ApplicationCategory;
  total_time: number;
  session_count: number;
  average_session_duration: number;
  productivity_score: number;
  most_used_features: string[];
  peak_usage_hours: number[];
}

export interface ScreenMonitorConfig {
  enable_screenshots: boolean;
  screenshot_interval: number;
  screenshot_quality: number;
  blur_sensitive_content: boolean;
  privacy_mode: boolean;
}

export interface WindowPattern {
  id: string;
  name: string;
  description: string;
  conditions: PatternCondition[];
  actions: PatternAction[];
  enabled: boolean;
  priority: number;
}

export interface PatternCondition {
  field: 'title' | 'application' | 'url' | 'process_name' | 'window_class';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'not_contains';
  value: string;
  case_sensitive: boolean;
}

export interface PatternAction {
  type: 'categorize' | 'tag' | 'track_project' | 'set_productivity' | 'notify' | 'screenshot';
  params: Record<string, any>;
}

export interface ContextDetectorConfig {
  polling_interval: number;
  enable_url_detection: boolean;
  enable_screenshot_capture: boolean;
  enable_window_tracking: boolean;
  enable_application_monitoring: boolean;
  privacy_mode: boolean;
  patterns: WindowPattern[];
  screenshot_config: ScreenMonitorConfig;
}

export interface WindowHierarchy {
  parent_window?: WindowInfo;
  child_windows: WindowInfo[];
  modal_windows: WindowInfo[];
  popup_windows: WindowInfo[];
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  windows: WindowInfo[];
  applications: ApplicationInfo[];
  layout: WorkspaceLayout;
  focus_history: FocusSession[];
}

export interface WorkspaceLayout {
  screen_arrangement: ScreenInfo[];
  window_arrangement: WindowArrangement[];
}

export interface ScreenInfo {
  id: number;
  primary: boolean;
  bounds: WindowBounds;
  dpi: number;
}

export interface WindowArrangement {
  window_id: number;
  screen_id: number;
  position: WindowBounds;
  z_order: number;
}

export interface BrowserContext {
  browser: string;
  url: string;
  domain: string;
  page_title: string;
  tab_count: number;
  is_incognito: boolean;
  bookmark_folders?: string[];
  session_restore_data?: any;
}

export interface ProjectDetectionResult {
  project_name: string;
  confidence: number;
  indicators: ProjectIndicator[];
  suggested_category: ApplicationCategory;
  related_windows: WindowInfo[];
}

export interface ProjectIndicator {
  type: 'git_repo' | 'file_pattern' | 'window_title' | 'directory_structure' | 'package_json';
  value: string;
  confidence: number;
}

export interface ContextAnalytics {
  daily_app_usage: Record<string, number>;
  weekly_patterns: Record<string, number[]>;
  productivity_trends: ProductivityTrend[];
  focus_patterns: FocusPattern[];
  distraction_sources: DistractionSource[];
}

export interface ProductivityTrend {
  date: Date;
  productivity_score: number;
  focus_time: number;
  distraction_time: number;
  top_productive_apps: string[];
}

export interface FocusPattern {
  hour_of_day: number;
  day_of_week: number;
  average_focus_duration: number;
  interruption_frequency: number;
  productivity_score: number;
}

export interface DistractionSource {
  application: string;
  frequency: number;
  average_duration: number;
  productivity_impact: number;
  common_triggers: string[];
}