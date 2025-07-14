import { ImeAdapter } from './ImeAdapter';
import { MessageQueueService } from './services/MessageQueueService';
import { ApiService } from './services/ApiService';
import { config } from './config';
import { logger } from './utils/logger';

async function main() {
  logger.info('Starting IME Adapter service...');

  try {
    // Initialize services
    const messageQueue = new MessageQueueService(config.rabbitmq);
    const apiService = new ApiService(config.api);
    const imeAdapter = new ImeAdapter();

    // Connect to message queue
    await messageQueue.connect();

    // Register with service discovery
    await apiService.registerService();

    // Set up message handlers
    messageQueue.on('keySequence', async (data) => {
      try {
        const result = await imeAdapter.processKeySequence(data);
        
        // Send reconstructed text to activity-db
        await apiService.updateEventText(data.eventId, result.text);
        
        // Publish processed event
        await messageQueue.publish('textReconstructed', {
          eventId: data.eventId,
          sessionId: data.sessionId,
          originalKeys: data.keys,
          reconstructedText: result.text,
          confidence: result.confidence,
          method: result.method
        });
      } catch (error) {
        logger.error('Error processing key sequence:', error);
      }
    });

    // Start consuming messages
    await messageQueue.startConsuming();

    logger.info('IME Adapter service started successfully');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down IME Adapter...');
      await messageQueue.disconnect();
      await apiService.deregisterService();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start IME Adapter:', error);
    process.exit(1);
  }
}

// Start the service
main();

export { ImeAdapter } from './ImeAdapter';
export { KeySequence, ReconstructedText } from './types';