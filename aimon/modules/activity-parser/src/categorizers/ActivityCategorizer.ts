import { RawActivity, ActivityType, ActivityCategory } from '../types';
import { logger } from '../utils/logger';

export interface CategorizationConfig {
  productive_apps: string[];
  distracting_apps: string[];
  communication_apps: string[];
  learning_apps: string[];
}

export class ActivityCategorizer {
  private config: CategorizationConfig;
  private categoryCache: Map<string, ActivityCategory> = new Map();

  constructor(config: CategorizationConfig) {
    this.config = config;
    this.initializeCache();
  }

  categorize(activity: RawActivity, type: ActivityType): ActivityCategory {
    const app = activity.context?.application?.toLowerCase() || '';
    
    // Check cache first
    if (this.categoryCache.has(app)) {
      return this.categoryCache.get(app)!;
    }

    // Categorize based on activity type
    let category = this.categorizeByType(type);

    // Override based on application lists
    const appCategory = this.categorizeByApplication(app);
    if (appCategory) {
      category = appCategory;
    }

    // Special cases based on content
    if (activity.context?.url) {
      const urlCategory = this.categorizeByUrl(activity.context.url);
      if (urlCategory) {
        category = urlCategory;
      }
    }

    // Cache the result
    this.categoryCache.set(app, category);

    return category;
  }

  private categorizeByType(type: ActivityType): ActivityCategory {
    switch (type) {
      case ActivityType.CODING:
      case ActivityType.DOCUMENTING:
        return ActivityCategory.PRODUCTIVE;
      
      case ActivityType.COMMUNICATING:
        return ActivityCategory.COMMUNICATION;
      
      case ActivityType.BROWSING:
        return ActivityCategory.NEUTRAL;
      
      case ActivityType.IDLE:
        return ActivityCategory.BREAK;
      
      case ActivityType.READING:
      case ActivityType.TYPING:
      case ActivityType.CLICKING:
      case ActivityType.SCROLLING:
      default:
        return ActivityCategory.NEUTRAL;
    }
  }

  private categorizeByApplication(app: string): ActivityCategory | null {
    if (!app) return null;

    // Check productive apps
    if (this.config.productive_apps.some(prodApp => 
      app.includes(prodApp.toLowerCase())
    )) {
      return ActivityCategory.PRODUCTIVE;
    }

    // Check distracting apps
    if (this.config.distracting_apps.some(distApp => 
      app.includes(distApp.toLowerCase())
    )) {
      return ActivityCategory.DISTRACTING;
    }

    // Check communication apps
    if (this.config.communication_apps.some(commApp => 
      app.includes(commApp.toLowerCase())
    )) {
      return ActivityCategory.COMMUNICATION;
    }

    // Check learning apps
    if (this.config.learning_apps.some(learnApp => 
      app.includes(learnApp.toLowerCase())
    )) {
      return ActivityCategory.LEARNING;
    }

    return null;
  }

  private categorizeByUrl(url: string): ActivityCategory | null {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();

      // Social media sites
      const socialMedia = [
        'facebook.com', 'twitter.com', 'instagram.com', 
        'reddit.com', 'tiktok.com', 'linkedin.com'
      ];
      if (socialMedia.some(site => domain.includes(site))) {
        return ActivityCategory.DISTRACTING;
      }

      // Entertainment sites
      const entertainment = [
        'youtube.com', 'netflix.com', 'twitch.tv', 
        'spotify.com', 'soundcloud.com'
      ];
      if (entertainment.some(site => domain.includes(site))) {
        return ActivityCategory.ENTERTAINMENT;
      }

      // Learning sites
      const learning = [
        'coursera.org', 'udemy.com', 'edx.org',
        'khanacademy.org', 'skillshare.com',
        'docs.', 'developer.', 'learn.'
      ];
      if (learning.some(site => domain.includes(site))) {
        return ActivityCategory.LEARNING;
      }

      // Development sites
      const development = [
        'github.com', 'gitlab.com', 'bitbucket.org',
        'stackoverflow.com', 'npmjs.com', 'pypi.org'
      ];
      if (development.some(site => domain.includes(site))) {
        return ActivityCategory.PRODUCTIVE;
      }

    } catch (error) {
      logger.debug(`Invalid URL for categorization: ${url}`);
    }

    return null;
  }

  private initializeCache(): void {
    // Pre-populate cache with known applications
    const knownApps: Record<string, ActivityCategory> = {
      // Productive
      'vscode': ActivityCategory.PRODUCTIVE,
      'visual studio': ActivityCategory.PRODUCTIVE,
      'intellij': ActivityCategory.PRODUCTIVE,
      'sublime': ActivityCategory.PRODUCTIVE,
      'atom': ActivityCategory.PRODUCTIVE,
      'vim': ActivityCategory.PRODUCTIVE,
      'emacs': ActivityCategory.PRODUCTIVE,
      'excel': ActivityCategory.PRODUCTIVE,
      'word': ActivityCategory.PRODUCTIVE,
      'powerpoint': ActivityCategory.PRODUCTIVE,
      'notion': ActivityCategory.PRODUCTIVE,
      'obsidian': ActivityCategory.PRODUCTIVE,
      
      // Communication
      'slack': ActivityCategory.COMMUNICATION,
      'teams': ActivityCategory.COMMUNICATION,
      'discord': ActivityCategory.COMMUNICATION,
      'telegram': ActivityCategory.COMMUNICATION,
      'whatsapp': ActivityCategory.COMMUNICATION,
      'skype': ActivityCategory.COMMUNICATION,
      'zoom': ActivityCategory.COMMUNICATION,
      'outlook': ActivityCategory.COMMUNICATION,
      'gmail': ActivityCategory.COMMUNICATION,
      
      // Entertainment
      'steam': ActivityCategory.ENTERTAINMENT,
      'epic games': ActivityCategory.ENTERTAINMENT,
      'vlc': ActivityCategory.ENTERTAINMENT,
      'spotify': ActivityCategory.ENTERTAINMENT,
      
      // Browsers (neutral by default)
      'chrome': ActivityCategory.NEUTRAL,
      'firefox': ActivityCategory.NEUTRAL,
      'safari': ActivityCategory.NEUTRAL,
      'edge': ActivityCategory.NEUTRAL,
    };

    for (const [app, category] of Object.entries(knownApps)) {
      this.categoryCache.set(app, category);
    }
  }

  updateConfig(config: Partial<CategorizationConfig>): void {
    this.config = { ...this.config, ...config };
    // Clear cache to reflect new configuration
    this.categoryCache.clear();
    this.initializeCache();
  }

  getCategoryStatistics(): Record<ActivityCategory, number> {
    const stats: Record<ActivityCategory, number> = {
      [ActivityCategory.PRODUCTIVE]: 0,
      [ActivityCategory.NEUTRAL]: 0,
      [ActivityCategory.DISTRACTING]: 0,
      [ActivityCategory.BREAK]: 0,
      [ActivityCategory.COMMUNICATION]: 0,
      [ActivityCategory.LEARNING]: 0,
      [ActivityCategory.ENTERTAINMENT]: 0
    };

    for (const category of this.categoryCache.values()) {
      stats[category]++;
    }

    return stats;
  }
}