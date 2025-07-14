import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { ParsedActivity, WorkSummary } from '../types';

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
      timeout: 10000
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
        ID: 'ai-summarizer',
        Name: 'ai-summarizer',
        Tags: ['ai', 'summarization', 'analytics'],
        Address: 'localhost',
        Port: this.config.port || 8084,
        Check: {
          HTTP: `http://localhost:${this.config.port || 8084}/health`,
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
      await this.consulClient.put('/agent/service/deregister/ai-summarizer');
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

  async getActivities(filters: any): Promise<ParsedActivity[]> {
    try {
      const response = await this.activityDbClient.get('/parsed-activities', { params: filters });
      return response.data;

    } catch (error) {
      logger.error('Failed to get activities:', error);
      throw error;
    }
  }

  async getSessionActivities(sessionId: string): Promise<ParsedActivity[]> {
    try {
      const response = await this.activityDbClient.get('/parsed-activities', {
        params: { session_id: sessionId }
      });
      return response.data;

    } catch (error) {
      logger.error(`Failed to get session activities ${sessionId}:`, error);
      throw error;
    }
  }

  async getActivitiesInTimeRange(
    startTime: Date, 
    endTime: Date, 
    deviceId?: string
  ): Promise<ParsedActivity[]> {
    try {
      const params: any = {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      };

      if (deviceId) {
        params.device_id = deviceId;
      }

      const response = await this.activityDbClient.get('/parsed-activities', { params });
      return response.data;

    } catch (error) {
      logger.error('Failed to get activities in time range:', error);
      throw error;
    }
  }

  async storeSummary(summary: WorkSummary): Promise<void> {
    try {
      await this.activityDbClient.post('/summaries', summary);
      logger.debug(`Stored summary ${summary.id}`);

    } catch (error) {
      logger.error(`Failed to store summary ${summary.id}:`, error);
      throw error;
    }
  }

  async getSummaryHistory(
    sessionId?: string, 
    summaryType?: string, 
    limit: number = 10
  ): Promise<WorkSummary[]> {
    try {
      const params: any = { limit };
      
      if (sessionId) params.session_id = sessionId;
      if (summaryType) params.summary_type = summaryType;

      const response = await this.activityDbClient.get('/summaries', { params });
      return response.data;

    } catch (error) {
      logger.error('Failed to get summary history:', error);
      throw error;
    }
  }

  async updateSummary(summaryId: string, updates: Partial<WorkSummary>): Promise<void> {
    try {
      await this.activityDbClient.put(`/summaries/${summaryId}`, updates);
      logger.debug(`Updated summary ${summaryId}`);

    } catch (error) {
      logger.error(`Failed to update summary ${summaryId}:`, error);
      throw error;
    }
  }

  async deleteSummary(summaryId: string): Promise<void> {
    try {
      await this.activityDbClient.delete(`/summaries/${summaryId}`);
      logger.debug(`Deleted summary ${summaryId}`);

    } catch (error) {
      logger.error(`Failed to delete summary ${summaryId}:`, error);
      throw error;
    }
  }

  async getUserGoals(deviceId?: string): Promise<any[]> {
    try {
      const params = deviceId ? { device_id: deviceId } : {};
      const response = await this.activityDbClient.get('/goals', { params });
      return response.data;

    } catch (error) {
      logger.error('Failed to get user goals:', error);
      return []; // Return empty array on error
    }
  }

  async updateGoalProgress(goalId: string, progress: number): Promise<void> {
    try {
      await this.activityDbClient.put(`/goals/${goalId}/progress`, { 
        current_value: progress 
      });
      logger.debug(`Updated goal ${goalId} progress to ${progress}`);

    } catch (error) {
      logger.error(`Failed to update goal ${goalId} progress:`, error);
    }
  }

  async getUserPreferences(deviceId?: string): Promise<any> {
    try {
      const params = deviceId ? { device_id: deviceId } : {};
      const response = await this.activityDbClient.get('/user-preferences', { params });
      return response.data;

    } catch (error) {
      logger.error('Failed to get user preferences:', error);
      return null;
    }
  }

  private startHealthCheck(): void {
    const http = require('http');
    
    this.healthServer = http.createServer((req: any, res: any) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          service: 'ai-summarizer',
          timestamp: new Date().toISOString()
        }));
      } else if (req.url === '/metrics') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.getMetrics()));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    this.healthServer.listen(this.config.port || 8084, () => {
      logger.info(`Health check endpoint started on port ${this.config.port || 8084}`);
    });
  }

  private getMetrics(): any {
    return {
      service: 'ai-summarizer',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}