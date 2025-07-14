import { AISummarizer } from './AISummarizer';
import { AIModelService } from './services/AIModelService';
import { MessageQueueService } from './services/MessageQueueService';
import { ApiService } from './services/ApiService';
import { ContextProvider } from './providers/ContextProvider';
import { config } from './config';
import { logger } from './utils/logger';
import { SummaryRequest, SummaryType, ParsedActivity } from './types';

class AISummarizerService {
  private summarizer: AISummarizer;
  private aiService: AIModelService;
  private messageQueue: MessageQueueService;
  private apiService: ApiService;
  private contextProvider: ContextProvider;
  private isRunning: boolean = false;
  private activityBuffer: Map<string, ParsedActivity[]> = new Map();

  constructor() {
    this.aiService = new AIModelService(config.ai);
    this.contextProvider = new ContextProvider();
    this.summarizer = new AISummarizer(this.aiService, this.contextProvider);
    this.messageQueue = new MessageQueueService(config.rabbitmq);
    this.apiService = new ApiService(config.api);
  }

  async start(): Promise<void> {
    try {
      logger.info('Starting AI Summarizer Service...');

      // Test AI model connection
      const modelValid = await this.aiService.validateModel();
      if (!modelValid.valid) {
        logger.warn(`AI model validation failed: ${modelValid.error}`);
      }

      // Register with service discovery
      await this.apiService.registerService();

      // Connect to message queue
      await this.messageQueue.connect();

      // Set up message handlers
      this.setupMessageHandlers();

      // Start consuming messages
      await this.messageQueue.startConsuming();

      // Set up automatic summary generation
      if (config.processing.enableAutomaticSummaries) {
        this.setupAutomaticSummaries();
      }

      this.isRunning = true;
      logger.info('AI Summarizer Service started successfully');

      // Set up graceful shutdown
      this.setupShutdownHandlers();

    } catch (error) {
      logger.error('Failed to start service:', error);
      await this.stop();
      process.exit(1);
    }
  }

  private setupMessageHandlers(): void {
    // Handle parsed activities
    this.messageQueue.on('activity_parsed', async (data) => {
      await this.handleParsedActivity(data);
    });

    // Handle summary requests
    this.messageQueue.on('summary_request', async (data) => {
      await this.handleSummaryRequest(data);
    });

    // Handle session completion
    this.messageQueue.on('session_complete', async (data) => {
      await this.handleSessionComplete(data);
    });

    // Handle batch processing requests
    this.messageQueue.on('batch_summary_request', async (data) => {
      await this.handleBatchSummaryRequest(data);
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

  private async handleParsedActivity(data: any): Promise<void> {
    try {
      const { sessionId, activityId } = data;
      
      // Buffer activities by session
      if (!this.activityBuffer.has(sessionId)) {
        this.activityBuffer.set(sessionId, []);
      }

      // Get the full activity data
      const activities = await this.apiService.getSessionActivities(sessionId);
      this.activityBuffer.set(sessionId, activities);

      logger.debug(`Buffered activity for session ${sessionId}, total: ${activities.length}`);

    } catch (error) {
      logger.error('Error handling parsed activity:', error);
    }
  }

  private async handleSummaryRequest(data: any): Promise<void> {
    try {
      const request: SummaryRequest = data;
      
      // Get activities for the requested time period
      const activities = await this.getActivitiesForRequest(request);
      
      if (activities.length === 0) {
        logger.warn('No activities found for summary request');
        return;
      }

      // Generate summary
      const summary = await this.summarizer.generateSummary(activities, request);
      
      // Store summary
      await this.apiService.storeSummary(summary);
      
      // Add to context
      await this.contextProvider.addSummaryToHistory(summary);

      // Publish summary generated event
      await this.messageQueue.publish('summary_generated', {
        summaryId: summary.id,
        sessionId: summary.session_id,
        summaryType: summary.summary_type,
        productivityScore: summary.metrics.productivity_score
      });

      logger.info(`Generated ${request.summary_type} summary ${summary.id}`);

    } catch (error) {
      logger.error('Error handling summary request:', error);
    }
  }

  private async handleSessionComplete(data: any): Promise<void> {
    try {
      const { sessionId } = data;
      
      // Generate session summary automatically
      const activities = this.activityBuffer.get(sessionId);
      if (!activities || activities.length === 0) {
        logger.warn(`No activities found for completed session ${sessionId}`);
        return;
      }

      const request: SummaryRequest = {
        session_id: sessionId,
        time_period: {
          start: new Date(Math.min(...activities.map(a => a.timestamp.getTime()))),
          end: new Date(Math.max(...activities.map(a => a.timestamp.getTime()))),
          duration: 0
        },
        summary_type: SummaryType.SESSION,
        include_insights: true,
        include_recommendations: true
      };

      request.time_period.duration = 
        request.time_period.end.getTime() - request.time_period.start.getTime();

      const summary = await this.summarizer.generateSummary(activities, request);
      
      await this.apiService.storeSummary(summary);
      await this.contextProvider.addSummaryToHistory(summary);

      // Clean up buffer
      this.activityBuffer.delete(sessionId);

      logger.info(`Generated session summary for completed session ${sessionId}`);

    } catch (error) {
      logger.error('Error handling session complete:', error);
    }
  }

  private async handleBatchSummaryRequest(data: any): Promise<void> {
    try {
      const { timeRanges, summaryType, deviceId } = data;
      
      for (const timeRange of timeRanges) {
        const request: SummaryRequest = {
          device_id: deviceId,
          time_period: timeRange,
          summary_type: summaryType,
          include_insights: true,
          include_recommendations: true
        };

        await this.handleSummaryRequest(request);
      }

      await this.messageQueue.publish('batch_summary_complete', {
        count: timeRanges.length,
        summaryType,
        deviceId
      });

    } catch (error) {
      logger.error('Error handling batch summary request:', error);
    }
  }

  private async getActivitiesForRequest(request: SummaryRequest): Promise<ParsedActivity[]> {
    if (request.session_id) {
      return this.apiService.getSessionActivities(request.session_id);
    } else {
      return this.apiService.getActivitiesInTimeRange(
        request.time_period.start,
        request.time_period.end,
        request.device_id
      );
    }
  }

  private setupAutomaticSummaries(): void {
    // Generate periodic summaries
    setInterval(async () => {
      try {
        await this.generatePeriodicSummaries();
      } catch (error) {
        logger.error('Error in automatic summary generation:', error);
      }
    }, config.processing.summaryTriggerInterval);

    logger.info('Automatic summary generation enabled');
  }

  private async generatePeriodicSummaries(): Promise<void> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);

    // Generate hourly summaries for active sessions
    for (const [sessionId, activities] of this.activityBuffer) {
      const recentActivities = activities.filter(a => 
        a.timestamp >= oneHourAgo
      );

      if (recentActivities.length > 0) {
        const request: SummaryRequest = {
          session_id: sessionId,
          time_period: {
            start: oneHourAgo,
            end: now,
            duration: 3600000
          },
          summary_type: SummaryType.HOURLY,
          include_insights: false,
          include_recommendations: true
        };

        await this.handleSummaryRequest(request);
      }
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
      
      // Clear activity buffer
      this.activityBuffer.clear();
      
      logger.info('AI Summarizer Service stopped');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }

  // Expose service for external use
  getSummarizer(): AISummarizer {
    return this.summarizer;
  }

  getMetrics(): any {
    return {
      ...this.summarizer.getMetrics(),
      bufferedSessions: this.activityBuffer.size,
      totalBufferedActivities: Array.from(this.activityBuffer.values())
        .reduce((total, activities) => total + activities.length, 0)
    };
  }
}

// Start the service
const service = new AISummarizerService();
service.start().catch(error => {
  logger.error('Failed to start service:', error);
  process.exit(1);
});