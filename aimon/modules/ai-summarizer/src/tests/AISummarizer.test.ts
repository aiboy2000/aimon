import { AISummarizer } from '../AISummarizer';
import { AIModelService } from '../services/AIModelService';
import { ContextProvider } from '../providers/ContextProvider';
import { 
  ParsedActivity, 
  SummaryRequest, 
  SummaryType, 
  ActivityType, 
  ActivityCategory 
} from '../types';

// Mock the AI service
jest.mock('../services/AIModelService');
jest.mock('../providers/ContextProvider');

describe('AISummarizer', () => {
  let summarizer: AISummarizer;
  let mockAIService: jest.Mocked<AIModelService>;
  let mockContextProvider: jest.Mocked<ContextProvider>;

  beforeEach(() => {
    mockAIService = new AIModelService({
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000,
      timeout: 30000
    }) as jest.Mocked<AIModelService>;

    mockContextProvider = new ContextProvider() as jest.Mocked<ContextProvider>;

    // Mock AI service methods
    mockAIService.generateSummary = jest.fn().mockResolvedValue(
      'This was a productive coding session focused on implementing new features.'
    );
    mockAIService.getUsageStats = jest.fn().mockReturnValue({
      totalRequests: 5,
      totalTokens: 1000,
      averageResponseTime: 2000
    });

    // Mock context provider methods
    mockContextProvider.getContext = jest.fn().mockResolvedValue({
      recent_summaries: [],
      user_goals: [],
      user_preferences: {
        summary_frequency: 'daily',
        preferred_length: 'medium',
        focus_areas: ['coding', 'productivity'],
        exclude_categories: [],
        notification_settings: {
          email_summaries: false,
          push_notifications: false,
          summary_times: ['17:00'],
          productivity_alerts: true
        }
      }
    });

    summarizer = new AISummarizer(mockAIService, mockContextProvider);
  });

  describe('generateSummary', () => {
    it('should generate a summary for coding activities', async () => {
      const activities: ParsedActivity[] = [
        {
          id: 'activity-1',
          timestamp: new Date('2024-01-01T09:00:00Z'),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.CODING,
          duration: 1800000, // 30 minutes
          category: ActivityCategory.PRODUCTIVE,
          application: 'vscode',
          window_title: 'main.ts - Visual Studio Code',
          content: {
            text: 'function calculateSum(a: number, b: number): number { return a + b; }',
            language: 'typescript',
            keywords: ['function', 'typescript', 'calculation']
          },
          metadata: {
            confidence: 0.95,
            parser_version: '1.0',
            rules_applied: ['code-detection'],
            tags: ['development']
          },
          quality_score: 0.95
        },
        {
          id: 'activity-2',
          timestamp: new Date('2024-01-01T09:30:00Z'),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.DOCUMENTING,
          duration: 900000, // 15 minutes
          category: ActivityCategory.PRODUCTIVE,
          application: 'notion',
          window_title: 'Project Documentation',
          content: {
            text: '# API Documentation\n\nThis endpoint handles user authentication...',
            language: 'en',
            keywords: ['documentation', 'api', 'authentication']
          },
          metadata: {
            confidence: 0.90,
            parser_version: '1.0',
            rules_applied: ['documentation-detection'],
            tags: ['documentation']
          },
          quality_score: 0.90
        }
      ];

      const request: SummaryRequest = {
        session_id: 'session-1',
        time_period: {
          start: new Date('2024-01-01T09:00:00Z'),
          end: new Date('2024-01-01T10:00:00Z'),
          duration: 3600000
        },
        summary_type: SummaryType.SESSION,
        include_insights: true,
        include_recommendations: true
      };

      const summary = await summarizer.generateSummary(activities, request);

      expect(summary).toBeDefined();
      expect(summary.summary_type).toBe(SummaryType.SESSION);
      expect(summary.session_id).toBe('session-1');
      expect(summary.metrics.total_activities).toBe(2);
      expect(summary.metrics.active_time).toBe(2700000); // 45 minutes
      expect(summary.metrics.productivity_score).toBeGreaterThan(80);
      expect(summary.content.key_activities).toContain('coding: function calculateSum(a: number, b: number): number { return a + b; }...');
      expect(summary.content.focus_areas).toContain('vscode');
      expect(summary.insights.productive_patterns.length).toBeGreaterThan(0);
    });

    it('should generate daily summary with mixed activities', async () => {
      const activities: ParsedActivity[] = [
        {
          id: 'activity-1',
          timestamp: new Date('2024-01-01T09:00:00Z'),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.CODING,
          duration: 3600000, // 1 hour
          category: ActivityCategory.PRODUCTIVE,
          application: 'vscode',
          window_title: 'project.ts',
          content: { keywords: ['typescript', 'coding'] },
          metadata: {
            confidence: 0.95,
            parser_version: '1.0',
            rules_applied: [],
            tags: []
          },
          quality_score: 0.95
        },
        {
          id: 'activity-2',
          timestamp: new Date('2024-01-01T11:00:00Z'),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.BROWSING,
          duration: 1800000, // 30 minutes
          category: ActivityCategory.DISTRACTING,
          application: 'chrome',
          window_title: 'YouTube',
          content: { keywords: ['video', 'entertainment'] },
          metadata: {
            confidence: 0.80,
            parser_version: '1.0',
            rules_applied: [],
            tags: []
          },
          quality_score: 0.80
        },
        {
          id: 'activity-3',
          timestamp: new Date('2024-01-01T14:00:00Z'),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.COMMUNICATING,
          duration: 900000, // 15 minutes
          category: ActivityCategory.COMMUNICATION,
          application: 'slack',
          window_title: 'Team Chat',
          content: { keywords: ['team', 'communication'] },
          metadata: {
            confidence: 0.85,
            parser_version: '1.0',
            rules_applied: [],
            tags: []
          },
          quality_score: 0.85
        }
      ];

      const request: SummaryRequest = {
        time_period: {
          start: new Date('2024-01-01T00:00:00Z'),
          end: new Date('2024-01-01T23:59:59Z'),
          duration: 86400000
        },
        summary_type: SummaryType.DAILY,
        include_insights: true,
        include_recommendations: true
      };

      const summary = await summarizer.generateSummary(activities, request);

      expect(summary.summary_type).toBe(SummaryType.DAILY);
      expect(summary.metrics.total_activities).toBe(3);
      expect(summary.metrics.distraction_ratio).toBeGreaterThan(0);
      expect(summary.content.distractions).toContain('chrome (30m)');
      expect(summary.insights.time_wasters.length).toBeGreaterThan(0);
      expect(summary.insights.efficiency_tips.length).toBeGreaterThan(0);
    });

    it('should handle empty activity list', async () => {
      const activities: ParsedActivity[] = [];
      const request: SummaryRequest = {
        time_period: {
          start: new Date('2024-01-01T09:00:00Z'),
          end: new Date('2024-01-01T10:00:00Z'),
          duration: 3600000
        },
        summary_type: SummaryType.HOURLY,
        include_insights: false,
        include_recommendations: false
      };

      const summary = await summarizer.generateSummary(activities, request);

      expect(summary.metrics.total_activities).toBe(0);
      expect(summary.metrics.productivity_score).toBe(0);
      expect(summary.content.key_activities).toEqual([]);
    });

    it('should calculate correct productivity score', async () => {
      const activities: ParsedActivity[] = [
        {
          id: 'productive-1',
          timestamp: new Date(),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.CODING,
          duration: 3600000, // 1 hour productive
          category: ActivityCategory.PRODUCTIVE,
          application: 'vscode',
          window_title: 'code.ts',
          content: {},
          metadata: {
            confidence: 0.95,
            parser_version: '1.0',
            rules_applied: [],
            tags: []
          },
          quality_score: 0.95
        },
        {
          id: 'distracting-1',
          timestamp: new Date(),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.BROWSING,
          duration: 1800000, // 30 minutes distracting
          category: ActivityCategory.DISTRACTING,
          application: 'chrome',
          window_title: 'Social Media',
          content: {},
          metadata: {
            confidence: 0.80,
            parser_version: '1.0',
            rules_applied: [],
            tags: []
          },
          quality_score: 0.80
        }
      ];

      const request: SummaryRequest = {
        time_period: {
          start: new Date(),
          end: new Date(),
          duration: 5400000 // 1.5 hours total
        },
        summary_type: SummaryType.SESSION,
        include_insights: true,
        include_recommendations: true
      };

      const summary = await summarizer.generateSummary(activities, request);

      // Should be around 66.7% productive (1 hour productive / 1.5 hours total)
      expect(summary.metrics.productivity_score).toBeCloseTo(66.7, 1);
      expect(summary.metrics.distraction_ratio).toBeCloseTo(0.33, 2);
    });
  });

  describe('getSummaryHistory', () => {
    it('should return empty array for new sessions', async () => {
      const history = await summarizer.getSummaryHistory('new-session');
      expect(history).toEqual([]);
    });
  });

  describe('getMetrics', () => {
    it('should return service metrics', () => {
      const metrics = summarizer.getMetrics();
      
      expect(metrics).toHaveProperty('summariesGenerated');
      expect(metrics).toHaveProperty('averageGenerationTime');
      expect(metrics).toHaveProperty('modelUsage');
      expect(metrics.modelUsage).toEqual({
        totalRequests: 5,
        totalTokens: 1000,
        averageResponseTime: 2000
      });
    });
  });
});