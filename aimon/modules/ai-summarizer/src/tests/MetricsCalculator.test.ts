import { MetricsCalculator } from '../analyzers/MetricsCalculator';
import { 
  ParsedActivity, 
  ActivityType, 
  ActivityCategory, 
  TimePeriod 
} from '../types';

describe('MetricsCalculator', () => {
  let calculator: MetricsCalculator;

  beforeEach(() => {
    calculator = new MetricsCalculator();
  });

  describe('calculate', () => {
    it('should calculate basic metrics for productive activities', () => {
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
          window_title: 'main.ts',
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
          id: 'activity-2',
          timestamp: new Date('2024-01-01T09:30:00Z'),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.DOCUMENTING,
          duration: 1200000, // 20 minutes
          category: ActivityCategory.PRODUCTIVE,
          application: 'notion',
          window_title: 'docs',
          content: {},
          metadata: {
            confidence: 0.90,
            parser_version: '1.0',
            rules_applied: [],
            tags: []
          },
          quality_score: 0.90
        }
      ];

      const period: TimePeriod = {
        start: new Date('2024-01-01T09:00:00Z'),
        end: new Date('2024-01-01T10:00:00Z'),
        duration: 3600000
      };

      const metrics = calculator.calculate(activities, period);

      expect(metrics.total_activities).toBe(2);
      expect(metrics.active_time).toBe(3000000); // 50 minutes
      expect(metrics.productivity_score).toBe(100); // All productive
      expect(metrics.top_applications).toHaveLength(2);
      expect(metrics.top_applications[0].name).toBe('vscode');
      expect(metrics.category_breakdown[ActivityCategory.PRODUCTIVE]).toBe(3000000);
    });

    it('should calculate mixed productivity metrics', () => {
      const activities: ParsedActivity[] = [
        {
          id: 'productive',
          timestamp: new Date(),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.CODING,
          duration: 2400000, // 40 minutes productive
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
          id: 'distracting',
          timestamp: new Date(),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.BROWSING,
          duration: 1200000, // 20 minutes distracting
          category: ActivityCategory.DISTRACTING,
          application: 'chrome',
          window_title: 'youtube',
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

      const period: TimePeriod = {
        start: new Date(),
        end: new Date(),
        duration: 3600000
      };

      const metrics = calculator.calculate(activities, period);

      expect(metrics.total_activities).toBe(2);
      expect(metrics.active_time).toBe(3600000); // 60 minutes
      expect(metrics.productivity_score).toBeCloseTo(66.67, 1); // 40/60 minutes productive
      expect(metrics.distraction_ratio).toBeCloseTo(0.33, 2); // 20/60 minutes distracting
    });

    it('should handle idle time calculation', () => {
      const activities: ParsedActivity[] = [
        {
          id: 'active',
          timestamp: new Date(),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.TYPING,
          duration: 1800000, // 30 minutes active
          category: ActivityCategory.PRODUCTIVE,
          application: 'editor',
          window_title: 'document',
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
          id: 'idle',
          timestamp: new Date(),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.IDLE,
          duration: 1800000, // 30 minutes idle
          category: ActivityCategory.BREAK,
          application: 'system',
          window_title: 'idle',
          content: {},
          metadata: {
            confidence: 0.95,
            parser_version: '1.0',
            rules_applied: [],
            tags: []
          },
          quality_score: 0.95
        }
      ];

      const period: TimePeriod = {
        start: new Date(),
        end: new Date(),
        duration: 3600000 // 1 hour total
      };

      const metrics = calculator.calculate(activities, period);

      expect(metrics.active_time).toBe(1800000); // 30 minutes
      expect(metrics.idle_time).toBe(1800000); // 30 minutes
      expect(metrics.type_breakdown[ActivityType.IDLE]).toBe(1800000);
    });

    it('should rank applications by time spent', () => {
      const activities: ParsedActivity[] = [
        {
          id: 'app1-activity1',
          timestamp: new Date(),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.CODING,
          duration: 3600000, // 1 hour in vscode
          category: ActivityCategory.PRODUCTIVE,
          application: 'vscode',
          window_title: 'project.ts',
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
          id: 'app2-activity1',
          timestamp: new Date(),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.BROWSING,
          duration: 1800000, // 30 minutes in chrome
          category: ActivityCategory.NEUTRAL,
          application: 'chrome',
          window_title: 'docs',
          content: {},
          metadata: {
            confidence: 0.80,
            parser_version: '1.0',
            rules_applied: [],
            tags: []
          },
          quality_score: 0.80
        },
        {
          id: 'app1-activity2',
          timestamp: new Date(),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.DOCUMENTING,
          duration: 1200000, // 20 minutes more in vscode
          category: ActivityCategory.PRODUCTIVE,
          application: 'vscode',
          window_title: 'readme.md',
          content: {},
          metadata: {
            confidence: 0.90,
            parser_version: '1.0',
            rules_applied: [],
            tags: []
          },
          quality_score: 0.90
        }
      ];

      const period: TimePeriod = {
        start: new Date(),
        end: new Date(),
        duration: 7200000
      };

      const metrics = calculator.calculate(activities, period);

      expect(metrics.top_applications).toHaveLength(2);
      expect(metrics.top_applications[0].name).toBe('vscode');
      expect(metrics.top_applications[0].time_spent).toBe(4800000); // 1h 20m total
      expect(metrics.top_applications[0].activity_count).toBe(2);
      expect(metrics.top_applications[1].name).toBe('chrome');
      expect(metrics.top_applications[1].time_spent).toBe(1800000); // 30m
    });

    it('should handle empty activities list', () => {
      const activities: ParsedActivity[] = [];
      const period: TimePeriod = {
        start: new Date(),
        end: new Date(),
        duration: 3600000
      };

      const metrics = calculator.calculate(activities, period);

      expect(metrics.total_activities).toBe(0);
      expect(metrics.active_time).toBe(0);
      expect(metrics.idle_time).toBe(0);
      expect(metrics.productivity_score).toBe(0);
      expect(metrics.focus_score).toBe(0);
      expect(metrics.top_applications).toEqual([]);
    });

    it('should calculate communication as partially productive', () => {
      const activities: ParsedActivity[] = [
        {
          id: 'comm-activity',
          timestamp: new Date(),
          device_id: 'device-1',
          session_id: 'session-1',
          type: ActivityType.COMMUNICATING,
          duration: 1800000, // 30 minutes communication
          category: ActivityCategory.COMMUNICATION,
          application: 'slack',
          window_title: 'team-chat',
          content: {},
          metadata: {
            confidence: 0.85,
            parser_version: '1.0',
            rules_applied: [],
            tags: []
          },
          quality_score: 0.85
        }
      ];

      const period: TimePeriod = {
        start: new Date(),
        end: new Date(),
        duration: 1800000
      };

      const metrics = calculator.calculate(activities, period);

      // Communication should be weighted as 70% productive
      expect(metrics.productivity_score).toBeCloseTo(70, 1);
    });
  });

  describe('calculateProductivityTrend', () => {
    it('should calculate positive trend', () => {
      const metricsHistory = [
        { productivity_score: 60 } as any,
        { productivity_score: 65 } as any,
        { productivity_score: 70 } as any,
        { productivity_score: 75 } as any,
        { productivity_score: 80 } as any,
        { productivity_score: 85 } as any
      ];

      const trend = calculator.calculateProductivityTrend(metricsHistory);
      expect(trend).toBeGreaterThan(0); // Should be positive trend
    });

    it('should return 0 for insufficient data', () => {
      const metricsHistory = [{ productivity_score: 60 } as any];
      const trend = calculator.calculateProductivityTrend(metricsHistory);
      expect(trend).toBe(0);
    });
  });

  describe('calculateEfficiencyScore', () => {
    it('should calculate efficiency with focus bonus', () => {
      const metrics = {
        active_time: 3600000, // 1 hour
        productivity_score: 80,
        focus_score: 90,
        distraction_ratio: 0.1
      } as any;

      const efficiency = calculator.calculateEfficiencyScore(metrics);
      expect(efficiency).toBeGreaterThan(80); // Should be boosted by high focus
    });

    it('should handle zero active time', () => {
      const metrics = {
        active_time: 0,
        productivity_score: 80,
        focus_score: 90,
        distraction_ratio: 0.1
      } as any;

      const efficiency = calculator.calculateEfficiencyScore(metrics);
      expect(efficiency).toBe(0);
    });
  });
});