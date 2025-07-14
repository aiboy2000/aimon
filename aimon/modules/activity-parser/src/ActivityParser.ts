import { 
  RawActivity, 
  ParsedActivity, 
  ActivityType, 
  ActivityCategory,
  ParserConfig
} from './types';
import { RuleEngine } from './engines/RuleEngine';
import { ContentExtractor } from './extractors/ContentExtractor';
import { ActivityCategorizer } from './categorizers/ActivityCategorizer';
import { QualityAnalyzer } from './analyzers/QualityAnalyzer';
import { SessionManager } from './managers/SessionManager';
import { logger } from './utils/logger';

export class ActivityParser {
  private ruleEngine: RuleEngine;
  private contentExtractor: ContentExtractor;
  private categorizer: ActivityCategorizer;
  private qualityAnalyzer: QualityAnalyzer;
  private sessionManager: SessionManager;
  private config: ParserConfig;

  constructor(config: ParserConfig) {
    this.config = config;
    this.ruleEngine = new RuleEngine(config.rules);
    this.contentExtractor = new ContentExtractor(config.content_extraction);
    this.categorizer = new ActivityCategorizer(config.categorization);
    this.qualityAnalyzer = new QualityAnalyzer(config.quality_thresholds);
    this.sessionManager = new SessionManager();
  }

  async parseActivity(raw: RawActivity): Promise<ParsedActivity | null> {
    try {
      logger.debug(`Parsing activity ${raw.id}`);

      // Step 1: Quality check
      const qualityScore = this.qualityAnalyzer.analyze(raw);
      if (qualityScore < this.config.quality_thresholds.min_confidence) {
        logger.warn(`Activity ${raw.id} below quality threshold: ${qualityScore}`);
        return null;
      }

      // Step 2: Determine activity type
      const activityType = this.determineActivityType(raw);

      // Step 3: Extract content
      const content = await this.contentExtractor.extract(raw);

      // Step 4: Categorize activity
      const category = this.categorizer.categorize(raw, activityType);

      // Step 5: Apply parsing rules
      const ruleResults = await this.ruleEngine.apply(raw);

      // Step 6: Build parsed activity
      const parsed: ParsedActivity = {
        id: raw.id,
        timestamp: new Date(raw.timestamp),
        device_id: raw.device_id,
        session_id: raw.session_id,
        type: (ruleResults.type as ActivityType) || activityType,
        category: (ruleResults.category as ActivityCategory) || category,
        application: raw.context?.application || 'Unknown',
        window_title: raw.context?.window_title || '',
        content: {
          ...content,
          ...ruleResults.content
        },
        metadata: {
          confidence: qualityScore,
          parser_version: '0.1.0',
          rules_applied: ruleResults.applied_rules,
          tags: ruleResults.tags
        },
        quality_score: qualityScore
      };

      // Step 7: Calculate duration if possible
      const duration = await this.sessionManager.calculateDuration(parsed);
      if (duration) {
        parsed.duration = duration;
      }

      // Step 8: Update session
      await this.sessionManager.addActivity(parsed);

      logger.info(`Successfully parsed activity ${raw.id} as ${parsed.type}`);
      return parsed;

    } catch (error) {
      logger.error(`Failed to parse activity ${raw.id}:`, error);
      return null;
    }
  }

  private determineActivityType(raw: RawActivity): ActivityType {
    // Basic activity type determination
    switch (raw.type) {
      case 'keyboard':
        if (raw.processed_text && raw.processed_text.length > 10) {
          // Check if it's code
          if (this.looksLikeCode(raw.processed_text)) {
            return ActivityType.CODING;
          }
          // Check if it's documentation
          if (this.looksLikeDocumentation(raw.processed_text)) {
            return ActivityType.DOCUMENTING;
          }
          return ActivityType.TYPING;
        }
        return ActivityType.TYPING;

      case 'mouse':
        const mouseData = raw.data;
        if (mouseData.action === 'click') {
          return ActivityType.CLICKING;
        } else if (mouseData.action === 'scroll') {
          return ActivityType.SCROLLING;
        }
        return ActivityType.READING;

      case 'window':
      case 'application':
        // Check if it's a browser
        if (this.isBrowser(raw.context?.application)) {
          return ActivityType.BROWSING;
        }
        // Check if it's communication app
        if (this.isCommunicationApp(raw.context?.application)) {
          return ActivityType.COMMUNICATING;
        }
        return ActivityType.READING;

      default:
        return ActivityType.IDLE;
    }
  }

  private looksLikeCode(text: string): boolean {
    // Simple heuristics for code detection
    const codeIndicators = [
      /function\s+\w+\s*\(/,
      /class\s+\w+/,
      /import\s+.+from/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /if\s*\(.+\)\s*{/,
      /for\s*\(.+\)\s*{/,
      /\w+\s*:\s*\w+\s*[,;]/,  // Type annotations
      /\w+\(\s*\)\s*{/,         // Function calls
      /[{}[\];]/               // Code punctuation
    ];

    return codeIndicators.some(pattern => pattern.test(text));
  }

  private looksLikeDocumentation(text: string): boolean {
    // Check for markdown or documentation patterns
    const docIndicators = [
      /^#{1,6}\s+/m,           // Markdown headers
      /^\*\s+/m,               // Bullet points
      /^\d+\.\s+/m,            // Numbered lists
      /\[.+\]\(.+\)/,          // Markdown links
      /```[\s\S]*```/,         // Code blocks
      /@\w+/,                  // Mentions/tags
    ];

    return docIndicators.some(pattern => pattern.test(text));
  }

  private isBrowser(app?: string): boolean {
    if (!app) return false;
    const browsers = ['chrome', 'firefox', 'safari', 'edge', 'opera', 'brave'];
    return browsers.some(browser => app.toLowerCase().includes(browser));
  }

  private isCommunicationApp(app?: string): boolean {
    if (!app) return false;
    const commApps = ['slack', 'teams', 'discord', 'telegram', 'whatsapp', 'skype', 'zoom'];
    return commApps.some(commApp => app.toLowerCase().includes(commApp));
  }

  async batchParse(activities: RawActivity[]): Promise<ParsedActivity[]> {
    logger.info(`Batch parsing ${activities.length} activities`);
    
    const results = await Promise.all(
      activities.map(activity => this.parseActivity(activity))
    );

    return results.filter((parsed): parsed is ParsedActivity => parsed !== null);
  }

  async getSessionSummary(sessionId: string) {
    return this.sessionManager.getSessionSummary(sessionId);
  }

  updateConfig(config: Partial<ParserConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.rules) {
      this.ruleEngine.updateRules(config.rules);
    }
    if (config.categorization) {
      this.categorizer.updateConfig(config.categorization);
    }
    if (config.quality_thresholds) {
      this.qualityAnalyzer.updateThresholds(config.quality_thresholds);
    }
  }

  getStatistics() {
    return {
      totalParsed: this.sessionManager.getTotalActivities(),
      sessionCount: this.sessionManager.getSessionCount(),
      averageQuality: this.qualityAnalyzer.getAverageQuality(),
      ruleHitRate: this.ruleEngine.getHitRate()
    };
  }
}