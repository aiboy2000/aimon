import { RuleEngine } from '../engines/RuleEngine';
import { ParsingRule, RawActivity } from '../types';

describe('RuleEngine', () => {
  let engine: RuleEngine;

  beforeEach(() => {
    const rules: ParsingRule[] = [
      {
        id: 'test-rule-1',
        name: 'Test Rule 1',
        description: 'Test rule for IDE detection',
        priority: 100,
        enabled: true,
        conditions: [
          {
            field: 'context.application',
            operator: 'contains',
            value: 'code'
          }
        ],
        actions: [
          { type: 'set_type', params: { value: 'coding' } },
          { type: 'add_tag', params: { value: 'development' } }
        ]
      },
      {
        id: 'test-rule-2',
        name: 'Test Rule 2',
        description: 'Test rule for URL pattern',
        priority: 90,
        enabled: true,
        conditions: [
          {
            field: 'context.url',
            operator: 'matches',
            value: 'github\\.com'
          }
        ],
        actions: [
          { type: 'set_category', params: { value: 'productive' } },
          { type: 'add_tag', params: { value: 'github' } }
        ]
      }
    ];

    engine = new RuleEngine(rules);
  });

  describe('apply', () => {
    it('should apply matching rules', async () => {
      const activity: RawActivity = {
        id: 'test-1',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'window',
        data: {},
        context: {
          application: 'vscode',
          window_title: 'index.js'
        }
      };

      const result = await engine.apply(activity);

      expect(result.type).toBe('coding');
      expect(result.tags).toContain('development');
      expect(result.applied_rules).toContain('test-rule-1');
    });

    it('should apply multiple rules when applicable', async () => {
      const activity: RawActivity = {
        id: 'test-2',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'window',
        data: {},
        context: {
          application: 'chrome',
          window_title: 'GitHub',
          url: 'https://github.com/user/repo'
        }
      };

      const result = await engine.apply(activity);

      expect(result.category).toBe('productive');
      expect(result.tags).toContain('github');
      expect(result.applied_rules).toContain('test-rule-2');
    });

    it('should respect rule priority', async () => {
      const highPriorityRule: ParsingRule = {
        id: 'high-priority',
        name: 'High Priority Rule',
        description: 'Should execute first',
        priority: 200,
        enabled: true,
        conditions: [
          { field: 'type', operator: 'equals', value: 'keyboard' }
        ],
        actions: [
          { type: 'set_type', params: { value: 'high-priority-type' } }
        ]
      };

      engine.updateRules([highPriorityRule, ...engine['rules']]);

      const activity: RawActivity = {
        id: 'test-3',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'keyboard',
        data: {},
        context: {
          application: 'vscode',
          window_title: 'test.js'
        }
      };

      const result = await engine.apply(activity);

      expect(result.type).toBe('high-priority-type');
      expect(result.applied_rules[0]).toBe('high-priority');
    });

    it('should handle disabled rules', async () => {
      engine.updateRules([
        {
          id: 'disabled-rule',
          name: 'Disabled Rule',
          description: 'Should not execute',
          priority: 300,
          enabled: false,
          conditions: [
            { field: 'type', operator: 'equals', value: 'keyboard' }
          ],
          actions: [
            { type: 'set_type', params: { value: 'should-not-apply' } }
          ]
        }
      ]);

      const activity: RawActivity = {
        id: 'test-4',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'keyboard',
        data: {}
      };

      const result = await engine.apply(activity);

      expect(result.type).toBeUndefined();
      expect(result.applied_rules).not.toContain('disabled-rule');
    });
  });

  describe('condition evaluation', () => {
    it('should evaluate equals operator', async () => {
      const rule: ParsingRule = {
        id: 'equals-test',
        name: 'Equals Test',
        description: 'Test equals operator',
        priority: 100,
        enabled: true,
        conditions: [
          { field: 'type', operator: 'equals', value: 'keyboard' }
        ],
        actions: [
          { type: 'add_tag', params: { value: 'equals-matched' } }
        ]
      };

      engine.updateRules([rule]);

      const activity: RawActivity = {
        id: 'test-5',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'keyboard',
        data: {}
      };

      const result = await engine.apply(activity);
      expect(result.tags).toContain('equals-matched');
    });

    it('should evaluate contains operator', async () => {
      const rule: ParsingRule = {
        id: 'contains-test',
        name: 'Contains Test',
        description: 'Test contains operator',
        priority: 100,
        enabled: true,
        conditions: [
          { field: 'processed_text', operator: 'contains', value: 'hello' }
        ],
        actions: [
          { type: 'add_tag', params: { value: 'contains-matched' } }
        ]
      };

      engine.updateRules([rule]);

      const activity: RawActivity = {
        id: 'test-6',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'keyboard',
        data: {},
        processed_text: 'Hello World!'
      };

      const result = await engine.apply(activity);
      expect(result.tags).toContain('contains-matched');
    });

    it('should evaluate regex matches operator', async () => {
      const rule: ParsingRule = {
        id: 'regex-test',
        name: 'Regex Test',
        description: 'Test regex operator',
        priority: 100,
        enabled: true,
        conditions: [
          { field: 'processed_text', operator: 'matches', value: '^function\\s+\\w+' }
        ],
        actions: [
          { type: 'add_tag', params: { value: 'regex-matched' } }
        ]
      };

      engine.updateRules([rule]);

      const activity: RawActivity = {
        id: 'test-7',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'keyboard',
        data: {},
        processed_text: 'function calculateSum(a, b) { return a + b; }'
      };

      const result = await engine.apply(activity);
      expect(result.tags).toContain('regex-matched');
    });

    it('should evaluate numeric comparisons', async () => {
      const rule: ParsingRule = {
        id: 'numeric-test',
        name: 'Numeric Test',
        description: 'Test numeric operators',
        priority: 100,
        enabled: true,
        conditions: [
          { field: 'data.idle_time', operator: 'greater_than', value: 60000 }
        ],
        actions: [
          { type: 'set_type', params: { value: 'idle' } }
        ]
      };

      engine.updateRules([rule]);

      const activity: RawActivity = {
        id: 'test-8',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'window',
        data: { idle_time: 120000 }
      };

      const result = await engine.apply(activity);
      expect(result.type).toBe('idle');
    });
  });

  describe('content extraction', () => {
    it('should extract content using regex', async () => {
      const rule: ParsingRule = {
        id: 'extract-test',
        name: 'Extract Test',
        description: 'Test content extraction',
        priority: 100,
        enabled: true,
        conditions: [
          { field: 'context.window_title', operator: 'contains', value: '.js' }
        ],
        actions: [
          { 
            type: 'extract_content', 
            params: { 
              field: 'context.window_title',
              pattern: '([^/\\\\]+)\\.js',
              target: 'filename'
            }
          }
        ]
      };

      engine.updateRules([rule]);

      const activity: RawActivity = {
        id: 'test-9',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'window',
        data: {},
        context: {
          application: 'vscode',
          window_title: 'src/components/Button.js - Visual Studio Code'
        }
      };

      const result = await engine.apply(activity);
      expect(result.content?.filename).toBe('Button');
    });
  });

  describe('getHitRate', () => {
    it('should track rule hits', async () => {
      const activity: RawActivity = {
        id: 'test-10',
        timestamp: Date.now(),
        device_id: 'device-1',
        session_id: 'session-1',
        type: 'window',
        data: {},
        context: {
          application: 'vscode',
          window_title: 'test.js'
        }
      };

      // Apply the same activity multiple times
      await engine.apply(activity);
      await engine.apply(activity);
      await engine.apply(activity);

      const hitRate = engine.getHitRate();
      expect(hitRate['test-rule-1']).toBe(3);
    });
  });
});