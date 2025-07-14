// Event types from activity-db
export interface InputEvent {
  id: number;
  timestamp: string;
  session_id: string;
  device_id: string;
  event_type: string;
  event_data: Record<string, any>;
  processed_text?: string;
  application_context?: string;
  window_title?: string;
  created_at: string;
  updated_at?: string;
}

export interface Session {
  id: string;
  device_id: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  user_id?: string;
  os_info?: Record<string, any>;
  screen_resolution?: string;
  total_events: number;
  key_events: number;
  mouse_events: number;
  application_switches: number;
  created_at: string;
  updated_at?: string;
}

export interface Application {
  id: number;
  name: string;
  executable_path?: string;
  category?: string;
  version?: string;
  vendor?: string;
  description?: string;
  is_sensitive: boolean;
  track_content: boolean;
  total_usage_time: number;
  last_used?: string;
  created_at: string;
  updated_at?: string;
}

export interface ActivitySummary {
  id: number;
  date: string;
  period_type: 'hour' | 'day';
  device_id: string;
  session_id?: string;
  total_events: number;
  active_time_seconds: number;
  idle_time_seconds: number;
  keystrokes: number;
  mouse_clicks: number;
  mouse_distance_pixels: number;
  scroll_events: number;
  applications_used?: Record<string, number>;
  most_used_app?: string;
  productivity_score?: number;
  focus_time_seconds: number;
  distraction_events: number;
  created_at: string;
  updated_at?: string;
}

// Dashboard specific types
export interface DashboardStats {
  totalEvents: number;
  activeTime: number;
  keystrokes: number;
  mouseClicks: number;
  applications: number;
  productivityScore: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

// Settings
export interface Settings {
  apiUrl: string;
  apiKey: string;
  refreshInterval: number;
  theme: 'light' | 'dark';
  notifications: boolean;
}

// API Response
export interface ListResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// Electron API
declare global {
  interface Window {
    electronAPI: {
      getSettings: () => Promise<Settings>;
      saveSettings: (settings: Settings) => Promise<{ success: boolean }>;
      getAppVersion: () => Promise<string>;
      onNavigate: (callback: (route: string) => void) => void;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
    };
  }
}