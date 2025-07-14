import { RawActivity, ActivityContent } from '../types';
import { logger } from '../utils/logger';

export interface ContentExtractionConfig {
  enable_keyword_extraction: boolean;
  enable_language_detection: boolean;
  max_keywords: number;
}

export class ContentExtractor {
  private config: ContentExtractionConfig;

  constructor(config: ContentExtractionConfig) {
    this.config = config;
  }

  async extract(activity: RawActivity): Promise<ActivityContent> {
    const content: ActivityContent = {};

    // Extract text content
    if (activity.processed_text) {
      content.text = activity.processed_text;

      if (this.config.enable_language_detection) {
        content.language = this.detectLanguage(activity.processed_text);
      }

      if (this.config.enable_keyword_extraction) {
        content.keywords = this.extractKeywords(activity.processed_text);
      }
    }

    // Extract URLs
    content.urls = this.extractUrls(activity);

    // Extract file paths
    content.files = this.extractFilePaths(activity);

    // Extract actions
    content.actions = this.extractActions(activity);

    return content;
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on character patterns
    if (/[\u4e00-\u9fa5]/.test(text)) {
      return 'zh'; // Chinese
    } else if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      return 'ja'; // Japanese
    } else if (/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/.test(text)) {
      return 'ko'; // Korean
    } else if (/[а-яА-Я]/.test(text)) {
      return 'ru'; // Russian
    } else {
      return 'en'; // Default to English
    }
  }

  private extractKeywords(text: string): string[] {
    // Remove common stop words
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this',
      'it', 'from', 'be', 'are', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
      'might', 'must', 'shall', 'can', 'need', 'ought', 'dare', 'used'
    ]);

    // Extract words
    const words = text.toLowerCase()
      .match(/\b[a-z]+\b/g) || [];

    // Count word frequency
    const wordFreq = new Map<string, number>();
    for (const word of words) {
      if (!stopWords.has(word) && word.length > 2) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    // Sort by frequency and return top keywords
    const sortedWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.config.max_keywords)
      .map(([word]) => word);

    // Also extract technical terms
    const technicalTerms = this.extractTechnicalTerms(text);
    
    // Combine and deduplicate
    return Array.from(new Set([...sortedWords, ...technicalTerms]))
      .slice(0, this.config.max_keywords);
  }

  private extractTechnicalTerms(text: string): string[] {
    const terms: string[] = [];

    // Programming terms
    const programmingPatterns = [
      /\b(function|class|interface|struct|enum)\s+(\w+)/gi,
      /\b(import|require|include)\s+[\w.\/]+/gi,
      /\b\w+\(\)/g, // Function calls
      /\b[A-Z][a-z]+[A-Z]\w*/g, // CamelCase
      /\b[A-Z_]+[A-Z_]+\b/g, // CONSTANTS
    ];

    for (const pattern of programmingPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        terms.push(...matches.map(m => m.toLowerCase()));
      }
    }

    return terms;
  }

  private extractUrls(activity: RawActivity): string[] {
    const urls: string[] = [];

    // From context
    if (activity.context?.url) {
      urls.push(activity.context.url);
    }

    // From text
    if (activity.processed_text) {
      const urlPattern = /https?:\/\/[^\s]+/gi;
      const matches = activity.processed_text.match(urlPattern);
      if (matches) {
        urls.push(...matches);
      }
    }

    // Clean and deduplicate
    return Array.from(new Set(
      urls.map(url => this.cleanUrl(url))
    ));
  }

  private cleanUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove tracking parameters
      const cleanParams = new URLSearchParams();
      for (const [key, value] of parsed.searchParams) {
        if (!['utm_source', 'utm_medium', 'utm_campaign', 'fbclid'].includes(key)) {
          cleanParams.set(key, value);
        }
      }
      parsed.search = cleanParams.toString();
      return parsed.toString();
    } catch {
      return url;
    }
  }

  private extractFilePaths(activity: RawActivity): string[] {
    const files: string[] = [];

    // From window title
    if (activity.context?.window_title) {
      const filePattern = /[A-Za-z]:\\[^|<>:*?"]+|\/[^|<>:*?"]+/g;
      const matches = activity.context.window_title.match(filePattern);
      if (matches) {
        files.push(...matches);
      }
    }

    // From text
    if (activity.processed_text) {
      const filePattern = /(?:^|\s)([A-Za-z]:\\[^\s]+|\/[^\s]+\.[a-z]{2,4})/gi;
      const matches = activity.processed_text.match(filePattern);
      if (matches) {
        files.push(...matches.map(m => m.trim()));
      }
    }

    return Array.from(new Set(files));
  }

  private extractActions(activity: RawActivity): string[] {
    const actions: string[] = [];

    // Mouse actions
    if (activity.type === 'mouse' && activity.data) {
      if (activity.data.action) {
        actions.push(activity.data.action);
      }
      if (activity.data.button) {
        actions.push(`${activity.data.button}_click`);
      }
    }

    // Keyboard shortcuts
    if (activity.type === 'keyboard' && activity.data) {
      const shortcuts = this.extractKeyboardShortcuts(activity.data);
      actions.push(...shortcuts);
    }

    // Application-specific actions
    if (activity.context?.application) {
      const appActions = this.extractApplicationActions(activity);
      actions.push(...appActions);
    }

    return Array.from(new Set(actions));
  }

  private extractKeyboardShortcuts(data: any): string[] {
    const shortcuts: string[] = [];

    if (data.modifiers && data.modifiers.length > 0 && data.key) {
      const shortcut = [...data.modifiers, data.key].join('+');
      shortcuts.push(shortcut.toLowerCase());
    }

    return shortcuts;
  }

  private extractApplicationActions(activity: RawActivity): string[] {
    const actions: string[] = [];
    const app = activity.context?.application?.toLowerCase();

    if (!app) return actions;

    // Git commands
    if (activity.processed_text?.includes('git ')) {
      const gitCommands = activity.processed_text.match(/git\s+\w+/g);
      if (gitCommands) {
        actions.push(...gitCommands);
      }
    }

    // Browser navigation
    if (app.includes('chrome') || app.includes('firefox')) {
      if (activity.context?.url) {
        const url = new URL(activity.context.url);
        if (url.pathname.includes('/search')) {
          actions.push('web_search');
        }
      }
    }

    return actions;
  }

  updateConfig(config: Partial<ContentExtractionConfig>): void {
    this.config = { ...this.config, ...config };
  }
}