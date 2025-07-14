import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export class ApiService {
  private activityDbClient: AxiosInstance;
  private consulClient: AxiosInstance;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(private config: any) {
    // Activity DB client
    this.activityDbClient = axios.create({
      baseURL: this.config.activityDbUrl + '/api/v1',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    // Consul client
    this.consulClient = axios.create({
      baseURL: this.config.consulUrl + '/v1',
      timeout: 5000
    });
  }

  async registerService(): Promise<void> {
    try {
      const serviceDefinition = {
        ID: 'ime-adapter',
        Name: 'ime-adapter',
        Tags: ['ime', 'text-reconstruction', 'python'],
        Address: 'localhost',
        Port: 8082,
        Check: {
          HTTP: 'http://localhost:8082/health',
          Interval: '10s',
          Timeout: '5s'
        }
      };

      await this.consulClient.put('/agent/service/register', serviceDefinition);
      logger.info('Service registered with Consul');

      // Start health check endpoint
      this.startHealthCheck();

    } catch (error) {
      logger.error('Failed to register service:', error);
      // Continue anyway - service discovery is optional
    }
  }

  async deregisterService(): Promise<void> {
    try {
      await this.consulClient.put('/agent/service/deregister/ime-adapter');
      logger.info('Service deregistered from Consul');

      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

    } catch (error) {
      logger.error('Failed to deregister service:', error);
    }
  }

  async updateEventText(eventId: string, text: string): Promise<void> {
    try {
      await this.activityDbClient.put(`/events/${eventId}`, {
        processed_text: text
      });

      logger.debug(`Updated event ${eventId} with reconstructed text`);

    } catch (error) {
      logger.error(`Failed to update event ${eventId}:`, error);
      throw error;
    }
  }

  async getEvent(eventId: string): Promise<any> {
    try {
      const response = await this.activityDbClient.get(`/events/${eventId}`);
      return response.data;

    } catch (error) {
      logger.error(`Failed to get event ${eventId}:`, error);
      throw error;
    }
  }

  private startHealthCheck(): void {
    // Simple HTTP server for health checks
    const http = require('http');
    
    const server = http.createServer((req: any, res: any) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          service: 'ime-adapter',
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(this.config.port || 8082, () => {
      logger.info(`Health check endpoint started on port ${this.config.port || 8082}`);
    });
  }
}