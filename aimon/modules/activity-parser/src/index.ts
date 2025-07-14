import { ActivityParser } from './ActivityParser';
import { MessageQueueService } from './services/MessageQueueService';
import { ApiService } from './services/ApiService';
import { config, defaultParserConfig } from './config';
import { logger } from './utils/logger';
import { RawActivity } from './types';

class ActivityParserService {
  private parser: ActivityParser;
  private messageQueue: MessageQueueService;
  private apiService: ApiService;
  private isRunning: boolean = false;

  constructor() {
    this.parser = new ActivityParser(defaultParserConfig);
    this.messageQueue = new MessageQueueService(config.rabbitmq);
    this.apiService = new ApiService(config.api);
  }

  async start(): Promise<void> {
    try {
      logger.info('Starting Activity Parser Service...');

      // Register with service discovery
      await this.apiService.registerService();

      // Connect to message queue
      await this.messageQueue.connect();

      // Set up message handlers
      this.setupMessageHandlers();

      // Start consuming messages
      await this.messageQueue.startConsuming();

      this.isRunning = true;
      logger.info('Activity Parser Service started successfully');

      // Set up graceful shutdown
      this.setupShutdownHandlers();

    } catch (error) {
      logger.error('Failed to start service:', error);
      await this.stop();
      process.exit(1);
    }
  }

  private setupMessageHandlers(): void {
    // Handle incoming activities
    this.messageQueue.on('text_reconstructed', async (data) => {
      await this.handleActivity(data);
    });

    // Handle batch processing requests
    this.messageQueue.on('batch_parse_request', async (data) => {
      await this.handleBatchRequest(data);
    });

    // Handle errors
    this.messageQueue.on('error', (error) => {
      logger.error('Message queue error:', error);
    });

    this.messageQueue.on('close', async () => {
      logger.warn('Message queue connection closed, attempting reconnect...');
      setTimeout(() => this.reconnect(), 5000);
    });
  }

  private async handleActivity(data: any): Promise<void> {
    try {
      // Get full activity data from database
      const rawActivity = await this.apiService.getRawActivity(data.eventId);
      
      // Parse the activity
      const parsed = await this.parser.parseActivity(rawActivity);
      
      if (parsed) {
        // Store parsed activity
        await this.apiService.storeActivity(parsed);

        // Publish parsed activity event
        await this.messageQueue.publish('activity_parsed', {
          activityId: parsed.id,
          sessionId: parsed.session_id,
          type: parsed.type,
          category: parsed.category
        });

        // Check if we should generate session summary
        const shouldSummarize = await this.shouldGenerateSummary(parsed.session_id);
        if (shouldSummarize) {
          await this.generateSessionSummary(parsed.session_id);
        }
      }

    } catch (error) {
      logger.error('Error handling activity:', error);
    }
  }

  private async handleBatchRequest(data: any): Promise<void> {
    try {
      const { filters, sessionId } = data;
      
      // Get raw activities
      const rawActivities = await this.apiService.getRawActivities(filters);
      
      // Batch parse
      const parsedActivities = await this.parser.batchParse(rawActivities);
      
      // Store all parsed activities
      await Promise.all(
        parsedActivities.map(activity => 
          this.apiService.storeActivity(activity)
        )
      );

      // Generate session summary if requested
      if (sessionId) {
        await this.generateSessionSummary(sessionId);
      }

      // Publish completion event
      await this.messageQueue.publish('batch_parse_complete', {
        count: parsedActivities.length,
        sessionId
      });

    } catch (error) {
      logger.error('Error handling batch request:', error);
    }
  }

  private async shouldGenerateSummary(sessionId: string): Promise<boolean> {
    // Generate summary every 100 activities or every 30 minutes
    const stats = this.parser.getStatistics();
    return stats.totalParsed % 100 === 0;
  }

  private async generateSessionSummary(sessionId: string): Promise<void> {
    try {
      const summary = await this.parser.getSessionSummary(sessionId);
      
      if (summary) {
        // Store summary
        await this.apiService.storeSessionSummary(sessionId, summary);

        // Publish summary event
        await this.messageQueue.publish('session_summary_generated', {
          sessionId,
          productivityScore: summary.productivity_score
        });
      }

    } catch (error) {
      logger.error(`Error generating session summary for ${sessionId}:`, error);
    }
  }

  private async reconnect(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.messageQueue.connect();
      await this.messageQueue.startConsuming();
      logger.info('Successfully reconnected to message queue');
    } catch (error) {
      logger.error('Reconnection failed:', error);
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  private setupShutdownHandlers(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  async stop(): Promise<void> {
    this.isRunning = false;

    try {
      await this.messageQueue.disconnect();
      await this.apiService.deregisterService();
      logger.info('Activity Parser Service stopped');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
}

// Start the service
const service = new ActivityParserService();
service.start().catch(error => {
  logger.error('Failed to start service:', error);
  process.exit(1);
});