export interface RawActivity {
  id: string;
  timestamp: number;
  device_id: string;
  session_id: string;
  type: 'keyboard' | 'mouse' | 'window' | 'application';
  data: any;
  processed_text?: string;
  context?: ApplicationContext;
}

export interface ApplicationContext {
  application: string;
  window_title: string;
  process_name?: string;
  url?: string;
}

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

export interface ParsingRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than';
  value: any;
}

export interface RuleAction {
  type: 'set_type' | 'set_category' | 'add_tag' | 'extract_content' | 'calculate_duration';
  params: Record<string, any>;
}

export interface SessionData {
  session_id: string;
  device_id: string;
  start_time: Date;
  end_time?: Date;
  activities: ParsedActivity[];
  summary?: SessionSummary;
}

export interface SessionSummary {
  total_duration: number;
  active_duration: number;
  idle_duration: number;
  activity_breakdown: Record<ActivityType, number>;
  category_breakdown: Record<ActivityCategory, number>;
  top_applications: ApplicationSummary[];
  productivity_score: number;
}

export interface ApplicationSummary {
  name: string;
  duration: number;
  activity_count: number;
  category: ActivityCategory;
}

export interface ParserConfig {
  rules: ParsingRule[];
  quality_thresholds: {
    min_confidence: number;
    min_text_length: number;
    max_idle_duration: number;
  };
  categorization: {
    productive_apps: string[];
    distracting_apps: string[];
    communication_apps: string[];
    learning_apps: string[];
  };
  content_extraction: {
    enable_keyword_extraction: boolean;
    enable_language_detection: boolean;
    max_keywords: number;
  };
}