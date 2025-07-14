import dotenv from 'dotenv';
import { ParserConfig } from './types';
import { RuleEngine } from './engines/RuleEngine';

// Load environment variables
dotenv.config();

export const config = {
  service: {
    name: 'activity-parser',
    id: process.env.SERVICE_ID || 'activity-parser-001',
    port: parseInt(process.env.PORT || '8083', 10)
  },
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://aimon:aimon123@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'activity_events',
    queue: process.env.RABBITMQ_QUEUE || 'parser_queue',
    inputRoutingKey: process.env.INPUT_ROUTING_KEY || 'processed.text_reconstructed',
    outputRoutingKey: process.env.OUTPUT_ROUTING_KEY || 'parsed.activity'
  },
  
  api: {
    activityDbUrl: process.env.ACTIVITY_DB_URL || 'http://localhost:8080',
    apiKey: process.env.API_KEY || 'dev-key',
    consulUrl: process.env.CONSUL_URL || 'http://localhost:8500',
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10)
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

export const defaultParserConfig: ParserConfig = {
  rules: RuleEngine.getDefaultRules(),
  
  quality_thresholds: {
    min_confidence: 0.5,
    min_text_length: 3,
    max_idle_duration: 300000 // 5 minutes
  },
  
  categorization: {
    productive_apps: [
      'vscode', 'visual studio', 'intellij', 'sublime', 'atom', 'vim', 'emacs',
      'excel', 'word', 'powerpoint', 'notion', 'obsidian', 'figma', 'sketch',
      'photoshop', 'illustrator', 'terminal', 'iterm', 'powershell'
    ],
    
    distracting_apps: [
      'facebook', 'twitter', 'instagram', 'tiktok', 'reddit',
      'youtube', 'netflix', 'twitch', 'steam', 'epic games'
    ],
    
    communication_apps: [
      'slack', 'teams', 'discord', 'telegram', 'whatsapp', 'skype',
      'zoom', 'meet', 'outlook', 'gmail', 'mail', 'messages'
    ],
    
    learning_apps: [
      'coursera', 'udemy', 'khan academy', 'duolingo', 'anki',
      'kindle', 'books', 'reader', 'calibre'
    ]
  },
  
  content_extraction: {
    enable_keyword_extraction: true,
    enable_language_detection: true,
    max_keywords: 10
  }
};