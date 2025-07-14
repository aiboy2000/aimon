import { ParsingRule, RawActivity, RuleCondition, RuleAction } from '../types';
import { logger } from '../utils/logger';

export interface RuleResult {
  type?: string;
  category?: string;
  tags?: string[];
  content?: Record<string, any>;
  applied_rules: string[];
}

export class RuleEngine {
  private rules: ParsingRule[];
  private ruleHits: Map<string, number> = new Map();

  constructor(rules: ParsingRule[]) {
    this.rules = this.sortRulesByPriority(rules);
  }

  async apply(activity: RawActivity): Promise<RuleResult> {
    const result: RuleResult = {
      tags: [],
      content: {},
      applied_rules: []
    };

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      if (this.evaluateConditions(rule.conditions, activity)) {
        logger.debug(`Rule ${rule.id} matched for activity ${activity.id}`);
        
        // Apply actions
        for (const action of rule.actions) {
          this.applyAction(action, activity, result);
        }

        result.applied_rules.push(rule.id);
        this.recordHit(rule.id);

        // Some rules might be exclusive
        if (this.isExclusiveRule(rule)) {
          break;
        }
      }
    }

    return result;
  }

  private evaluateConditions(conditions: RuleCondition[], activity: RawActivity): boolean {
    // All conditions must be true (AND logic)
    return conditions.every(condition => 
      this.evaluateCondition(condition, activity)
    );
  }

  private evaluateCondition(condition: RuleCondition, activity: RawActivity): boolean {
    const value = this.getFieldValue(activity, condition.field);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      
      case 'contains':
        return typeof value === 'string' && 
               value.toLowerCase().includes(condition.value.toLowerCase());
      
      case 'matches':
        return typeof value === 'string' && 
               new RegExp(condition.value).test(value);
      
      case 'greater_than':
        return typeof value === 'number' && value > condition.value;
      
      case 'less_than':
        return typeof value === 'number' && value < condition.value;
      
      default:
        logger.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  private getFieldValue(activity: RawActivity, field: string): any {
    // Support nested field access (e.g., 'context.application')
    const parts = field.split('.');
    let value: any = activity;

    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) break;
    }

    return value;
  }

  private applyAction(action: RuleAction, activity: RawActivity, result: RuleResult): void {
    switch (action.type) {
      case 'set_type':
        result.type = action.params.value;
        break;

      case 'set_category':
        result.category = action.params.value;
        break;

      case 'add_tag':
        result.tags!.push(action.params.value);
        break;

      case 'extract_content':
        this.extractContent(action.params, activity, result);
        break;

      case 'calculate_duration':
        // This would be handled by SessionManager
        break;

      default:
        logger.warn(`Unknown action type: ${action.type}`);
    }
  }

  private extractContent(params: any, activity: RawActivity, result: RuleResult): void {
    const { field, pattern, target } = params;
    const value = this.getFieldValue(activity, field);

    if (typeof value === 'string' && pattern) {
      const regex = new RegExp(pattern);
      const match = value.match(regex);
      
      if (match) {
        result.content![target] = match[1] || match[0];
      }
    }
  }

  private sortRulesByPriority(rules: ParsingRule[]): ParsingRule[] {
    return [...rules].sort((a, b) => b.priority - a.priority);
  }

  private isExclusiveRule(rule: ParsingRule): boolean {
    // Rules that set type or category are typically exclusive
    return rule.actions.some(action => 
      action.type === 'set_type' || action.type === 'set_category'
    );
  }

  private recordHit(ruleId: string): void {
    const hits = this.ruleHits.get(ruleId) || 0;
    this.ruleHits.set(ruleId, hits + 1);
  }

  updateRules(rules: ParsingRule[]): void {
    this.rules = this.sortRulesByPriority(rules);
    logger.info(`Updated ${rules.length} parsing rules`);
  }

  getHitRate(): Record<string, number> {
    const hitRate: Record<string, number> = {};
    
    for (const [ruleId, hits] of this.ruleHits) {
      hitRate[ruleId] = hits;
    }

    return hitRate;
  }

  // Predefined rules for common scenarios
  static getDefaultRules(): ParsingRule[] {
    return [
      {
        id: 'code-detection',
        name: 'Code Activity Detection',
        description: 'Detects coding activities in IDEs',
        priority: 100,
        enabled: true,
        conditions: [
          {
            field: 'context.application',
            operator: 'matches',
            value: 'vscode|intellij|sublime|atom|vim|emacs'
          }
        ],
        actions: [
          { type: 'set_type', params: { value: 'coding' } },
          { type: 'set_category', params: { value: 'productive' } },
          { type: 'add_tag', params: { value: 'development' } }
        ]
      },
      {
        id: 'browser-youtube',
        name: 'YouTube Detection',
        description: 'Detects YouTube usage',
        priority: 90,
        enabled: true,
        conditions: [
          {
            field: 'context.url',
            operator: 'contains',
            value: 'youtube.com'
          }
        ],
        actions: [
          { type: 'set_type', params: { value: 'browsing' } },
          { type: 'set_category', params: { value: 'entertainment' } },
          { type: 'add_tag', params: { value: 'video' } }
        ]
      },
      {
        id: 'documentation-writing',
        name: 'Documentation Detection',
        description: 'Detects documentation writing',
        priority: 80,
        enabled: true,
        conditions: [
          {
            field: 'processed_text',
            operator: 'matches',
            value: '^#{1,6}\\s+|^\\*\\s+|^\\d+\\.\\s+'
          }
        ],
        actions: [
          { type: 'set_type', params: { value: 'documenting' } },
          { type: 'set_category', params: { value: 'productive' } }
        ]
      },
      {
        id: 'idle-detection',
        name: 'Idle Time Detection',
        description: 'Detects periods of inactivity',
        priority: 50,
        enabled: true,
        conditions: [
          {
            field: 'data.idle_time',
            operator: 'greater_than',
            value: 300000 // 5 minutes
          }
        ],
        actions: [
          { type: 'set_type', params: { value: 'idle' } },
          { type: 'set_category', params: { value: 'break' } }
        ]
      }
    ];
  }
}