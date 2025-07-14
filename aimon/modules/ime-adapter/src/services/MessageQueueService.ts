import { EventEmitter } from 'events';
import amqp from 'amqplib';
import { logger } from '../utils/logger';

export class MessageQueueService extends EventEmitter {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private consumerTag: string | null = null;

  constructor(private config: any) {
    super();
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.config.url);
      this.channel = await this.connection.createChannel();

      // Set up exchange
      await this.channel.assertExchange(this.config.exchange, 'topic', {
        durable: true
      });

      // Set up queue
      await this.channel.assertQueue(this.config.queue, {
        durable: true
      });

      // Bind queue to exchange
      await this.channel.bindQueue(
        this.config.queue,
        this.config.exchange,
        this.config.routingKey
      );

      logger.info('Connected to RabbitMQ');

      // Handle connection events
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
        this.emit('error', err);
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.emit('close');
      });

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    try {
      // Set prefetch to control concurrency
      await this.channel.prefetch(10);

      // Start consuming
      const { consumerTag } = await this.channel.consume(
        this.config.queue,
        async (msg) => {
          if (!msg) return;

          try {
            const content = JSON.parse(msg.content.toString());
            logger.debug('Received message:', content.type);

            // Emit event based on message type
            this.emit(content.type || 'message', content.data);

            // Acknowledge message
            if (this.channel) {
              this.channel.ack(msg);
            }
          } catch (error) {
            logger.error('Error processing message:', error);
            
            // Reject and requeue
            if (this.channel) {
              this.channel.nack(msg, false, true);
            }
          }
        },
        { noAck: false }
      );

      this.consumerTag = consumerTag;
      logger.info(`Started consuming from queue: ${this.config.queue}`);

    } catch (error) {
      logger.error('Failed to start consuming:', error);
      throw error;
    }
  }

  async publish(eventType: string, data: any): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    try {
      const message = {
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
        source: 'ime-adapter'
      };

      const routingKey = `processed.${eventType}`;
      
      await this.channel.publish(
        this.config.exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      logger.debug(`Published message: ${eventType}`);

    } catch (error) {
      logger.error('Failed to publish message:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.consumerTag && this.channel) {
        await this.channel.cancel(this.consumerTag);
      }

      if (this.channel) {
        await this.channel.close();
      }

      if (this.connection) {
        await this.connection.close();
      }

      logger.info('Disconnected from RabbitMQ');

    } catch (error) {
      logger.error('Error during disconnect:', error);
    }
  }
}