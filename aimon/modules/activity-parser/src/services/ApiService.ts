import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { ParsedActivity, SessionSummary } from '../types';

export class ApiService {
  private activityDbClient: AxiosInstance;
  private consulClient: AxiosInstance;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private healthServer: any = null;

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
        ID: 'activity-parser',
        Name: 'activity-parser',
        Tags: ['parser', 'data-processing', 'analytics'],
        Address: 'localhost',
        Port: this.config.port || 8083,
        Check: {
          HTTP: `http://localhost:${this.config.port || 8083}/health`,
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
      await this.consulClient.put('/agent/service/deregister/activity-parser');
      logger.info('Service deregistered from Consul');

      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      if (this.healthServer) {
        this.healthServer.close();
      }

    } catch (error) {
      logger.error('Failed to deregister service:', error);
    }
  }

  async storeActivity(activity: ParsedActivity): Promise<void> {
    try {
      await this.activityDbClient.post('/parsed-activities', activity);
      logger.debug(`Stored parsed activity ${activity.id}`);

    } catch (error) {
      logger.error(`Failed to store activity ${activity.id}:`, error);
      throw error;
    }
  }

  async storeSessionSummary(sessionId: string, summary: SessionSummary): Promise<void> {
    try {
      await this.activityDbClient.put(`/sessions/${sessionId}/summary`, summary);
      logger.debug(`Stored session summary for ${sessionId}`);

    } catch (error) {
      logger.error(`Failed to store session summary ${sessionId}:`, error);
      throw error;
    }
  }

  async getRawActivity(activityId: string): Promise<any> {
    try {
      const response = await this.activityDbClient.get(`/activities/${activityId}`);
      return response.data;

    } catch (error) {
      logger.error(`Failed to get activity ${activityId}:`, error);
      throw error;
    }
  }

  async getRawActivities(filters: any): Promise<any[]> {
    try {
      const response = await this.activityDbClient.get('/activities', { params: filters });
      return response.data;

    } catch (error) {
      logger.error('Failed to get activities:', error);
      throw error;
    }
  }

  private startHealthCheck(): void {
    const http = require('http');
    
    this.healthServer = http.createServer((req: any, res: any) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          service: 'activity-parser',
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    this.healthServer.listen(this.config.port || 8083, () => {
      logger.info(`Health check endpoint started on port ${this.config.port || 8083}`);
    });
  }
}