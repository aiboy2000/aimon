import { ActivityParser } from '../ActivityParser';
import { RawActivity, ActivityType, ActivityCategory } from '../types';
import { defaultParserConfig } from '../config';

describe('ActivityParser', () => {
  let parser: ActivityParser;

  beforeEach(() => {
    parser = new ActivityParser(defaultParserConfig);
  });

  describe('parseActivity', () => {
    it('should parse keyboard activity with text', async () => {
      const raw: RawActivity = {
        id: 'test-1',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'keyboard',
        data: { keys_per_second: 3 },
        processed_text: 'Hello world, this is a test',
        context: {
          application: 'notepad',
          window_title: 'Untitled - Notepad'
        }
      };

      const parsed = await parser.parseActivity(raw);

      expect(parsed).toBeDefined();
      expect(parsed?.type).toBe(ActivityType.TYPING);
      expect(parsed?.content.text).toBe('Hello world, this is a test');
      expect(parsed?.content.keywords).toContain('hello');
      expect(parsed?.content.keywords).toContain('world');
      expect(parsed?.quality_score).toBeGreaterThan(0.5);
    });

    it('should detect coding activity', async () => {
      const raw: RawActivity = {
        id: 'test-2',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'keyboard',
        data: {},
        processed_text: 'function calculateSum(a, b) { return a + b; }',
        context: {
          application: 'vscode',
          window_title: 'index.js - Visual Studio Code'
        }
      };

      const parsed = await parser.parseActivity(raw);

      expect(parsed?.type).toBe(ActivityType.CODING);
      expect(parsed?.category).toBe(ActivityCategory.PRODUCTIVE);
      expect(parsed?.content.keywords).toContain('function');
      expect(parsed?.content.keywords).toContain('calculatesum');
    });

    it('should detect documentation activity', async () => {
      const raw: RawActivity = {
        id: 'test-3',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'keyboard',
        data: {},
        processed_text: '# Project Documentation\n\n## Overview\n\nThis is a test project.',
        context: {
          application: 'obsidian',
          window_title: 'README.md - Obsidian'
        }
      };

      const parsed = await parser.parseActivity(raw);

      expect(parsed?.type).toBe(ActivityType.DOCUMENTING);
      expect(parsed?.category).toBe(ActivityCategory.PRODUCTIVE);
    });

    it('should categorize browser activity', async () => {
      const raw: RawActivity = {
        id: 'test-4',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'window',
        data: {},
        context: {
          application: 'chrome',
          window_title: 'GitHub - Google Chrome',
          url: 'https://github.com/user/repo'
        }
      };

      const parsed = await parser.parseActivity(raw);

      expect(parsed?.type).toBe(ActivityType.BROWSING);
      expect(parsed?.category).toBe(ActivityCategory.PRODUCTIVE);
      expect(parsed?.content.urls).toContain('https://github.com/user/repo');
    });

    it('should detect entertainment activity', async () => {
      const raw: RawActivity = {
        id: 'test-5',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'window',
        data: {},
        context: {
          application: 'chrome',
          window_title: 'YouTube - Google Chrome',
          url: 'https://youtube.com/watch?v=xyz'
        }
      };

      const parsed = await parser.parseActivity(raw);

      expect(parsed?.type).toBe(ActivityType.BROWSING);
      expect(parsed?.category).toBe(ActivityCategory.ENTERTAINMENT);
    });

    it('should reject low quality activities', async () => {
      const raw: RawActivity = {
        id: 'test-6',
        timestamp: Date.now() + 1000000, // Future timestamp
        device_id: '',
        session_id: '',
        type: 'keyboard',
        data: {}
      };

      const parsed = await parser.parseActivity(raw);

      expect(parsed).toBeNull();
    });

    it('should extract Chinese language', async () => {
      const raw: RawActivity = {
        id: 'test-7',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'keyboard',
        data: {},
        processed_text: '你好世界',
        context: {
          application: 'wechat',
          window_title: 'WeChat'
        }
      };

      const parsed = await parser.parseActivity(raw);

      expect(parsed?.content.language).toBe('zh');
      expect(parsed?.category).toBe(ActivityCategory.COMMUNICATION);
    });
  });

  describe('batchParse', () => {
    it('should parse multiple activities', async () => {
      const activities: RawActivity[] = [
        {
          id: 'batch-1',
          timestamp: Date.now(),
          device_id: 'device-1',
          session_id: 'session-1',
          type: 'keyboard',
          data: {},
          processed_text: 'Test 1'
        },
        {
          id: 'batch-2',
          timestamp: Date.now() + 1000,
          device_id: 'device-1',
          session_id: 'session-1',
          type: 'mouse',
          data: { action: 'click' }
        },
        {
          id: 'batch-3',
          timestamp: Date.now() + 2000,
          device_id: 'device-1',
          session_id: 'session-1',
          type: 'keyboard',
          data: {},
          processed_text: 'Test 3'
        }
      ];

      const parsed = await parser.batchParse(activities);

      expect(parsed).toHaveLength(3);
      expect(parsed[0].type).toBe(ActivityType.TYPING);
      expect(parsed[1].type).toBe(ActivityType.CLICKING);
      expect(parsed[2].type).toBe(ActivityType.TYPING);
    });

    it('should filter out low quality activities in batch', async () => {
      const activities: RawActivity[] = [
        {
          id: 'good-1',
          timestamp: Date.now(),
          device_id: 'device-1',
          session_id: 'session-1',
          type: 'keyboard',
          data: {},
          processed_text: 'Good activity'
        },
        {
          id: 'bad-1',
          timestamp: 0, // Invalid timestamp
          device_id: '',
          session_id: '',
          type: 'unknown' as any,
          data: {}
        }
      ];

      const parsed = await parser.batchParse(activities);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('good-1');
    });
  });

  describe('getSessionSummary', () => {
    it('should generate session summary', async () => {
      const activities: RawActivity[] = [
        {
          id: 'session-1',
          timestamp: Date.now(),
          device_id: 'device-1',
          session_id: 'test-session',
          type: 'keyboard',
          data: {},
          processed_text: 'Working on project',
          context: {
            application: 'vscode',
            window_title: 'project.ts'
          }
        },
        {
          id: 'session-2',
          timestamp: Date.now() + 60000,
          device_id: 'device-1',
          session_id: 'test-session',
          type: 'window',
          data: {},
          context: {
            application: 'chrome',
            window_title: 'Stack Overflow',
            url: 'https://stackoverflow.com'
          }
        }
      ];

      await parser.batchParse(activities);
      const summary = await parser.getSessionSummary('test-session');

      expect(summary).toBeDefined();
      expect(summary?.total_duration).toBeGreaterThan(0);
      expect(summary?.top_applications).toHaveLength(2);
      expect(summary?.productivity_score).toBeGreaterThan(0);
    });
  });
});