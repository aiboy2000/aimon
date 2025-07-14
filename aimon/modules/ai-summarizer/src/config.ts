import dotenv from 'dotenv';
import { AIModelConfig } from './types';

// Load environment variables
dotenv.config();

export const config = {
  service: {
    name: 'ai-summarizer',
    id: process.env.SERVICE_ID || 'ai-summarizer-001',
    port: parseInt(process.env.PORT || '8084', 10)
  },
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://aimon:aimon123@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'activity_events',
    queue: process.env.RABBITMQ_QUEUE || 'summarizer_queue',
    inputRoutingKey: process.env.INPUT_ROUTING_KEY || 'parsed.activity',
    outputRoutingKey: process.env.OUTPUT_ROUTING_KEY || 'summary.generated'
  },
  
  api: {
    activityDbUrl: process.env.ACTIVITY_DB_URL || 'http://localhost:8080',
    apiKey: process.env.API_KEY || 'dev-key',
    consulUrl: process.env.CONSUL_URL || 'http://localhost:8500',
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10)
  },
  
  ai: {
    provider: (process.env.AI_PROVIDER || 'openai') as 'openai' | 'anthropic' | 'local',
    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
    apiKey: process.env.OPENAI_API_KEY || process.env.AI_API_KEY,
    baseUrl: process.env.AI_BASE_URL,
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1000', 10),
    timeout: parseInt(process.env.AI_TIMEOUT || '30000', 10)
  } as AIModelConfig,
  
  processing: {
    batchSize: parseInt(process.env.BATCH_SIZE || '50', 10),
    maxSummaryAge: parseInt(process.env.MAX_SUMMARY_AGE || '86400000', 10), // 24 hours
    enableAutomaticSummaries: process.env.ENABLE_AUTO_SUMMARIES === 'true',
    summaryTriggerInterval: parseInt(process.env.SUMMARY_TRIGGER_INTERVAL || '3600000', 10) // 1 hour
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};