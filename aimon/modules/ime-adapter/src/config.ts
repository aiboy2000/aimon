import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  service: {
    name: 'ime-adapter',
    id: process.env.SERVICE_ID || 'ime-adapter-001',
    port: parseInt(process.env.PORT || '8082', 10)
  },
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://aimon:aimon123@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'activity_events',
    queue: process.env.RABBITMQ_QUEUE || 'ime_adapter_queue',
    routingKey: process.env.RABBITMQ_ROUTING_KEY || 'input.keys'
  },
  
  api: {
    activityDbUrl: process.env.ACTIVITY_DB_URL || 'http://localhost:8080',
    apiKey: process.env.API_KEY || 'dev-key',
    consulUrl: process.env.CONSUL_URL || 'http://localhost:8500',
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10)
  },
  
  processing: {
    enableClipboardMonitoring: process.env.ENABLE_CLIPBOARD === 'true',
    enableMLPrediction: process.env.ENABLE_ML === 'true',
    maxAlternatives: parseInt(process.env.MAX_ALTERNATIVES || '3', 10),
    contextWindowSize: parseInt(process.env.CONTEXT_WINDOW || '50', 10),
    confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.7')
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};