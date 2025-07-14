import { EventEmitter } from 'events';
import { ApplicationInfo, ApplicationCategory } from '../types';
import { logger } from '../utils/logger';

export class ApplicationMonitor extends EventEmitter {
  private runningApps = new Map<string, ApplicationInfo>();
  private initialized = false;

  async initialize(): Promise<void> {
    try {
      // Mock initialization
      this.initialized = true;
      logger.info('Application monitor initialized');
    } catch (error) {
      logger.error('Failed to initialize application monitor:', error);
      throw error;
    }
  }

  async getRunningApplications(): Promise<ApplicationInfo[]> {
    if (!this.initialized) {
      throw new Error('Application monitor not initialized');
    }

    // Mock implementation
    const mockApps: ApplicationInfo[] = [
      {
        name: 'Visual Studio Code',
        process_name: 'code',
        executable_path: '/usr/bin/code',
        version: '1.85.0',
        category: ApplicationCategory.DEVELOPMENT,
        productivity_score: 95,
        window_count: 2,
        total_focus_time: 7200000, // 2 hours
        last_active: new Date()
      },
      {
        name: 'Google Chrome',
        process_name: 'chrome',
        executable_path: '/usr/bin/google-chrome',
        version: '120.0.6099.109',
        category: ApplicationCategory.BROWSER,
        productivity_score: 60,
        window_count: 5,
        total_focus_time: 3600000, // 1 hour
        last_active: new Date()
      },
      {
        name: 'Slack',
        process_name: 'slack',
        executable_path: '/usr/bin/slack',
        version: '4.36.0',
        category: ApplicationCategory.COMMUNICATION,
        productivity_score: 75,
        window_count: 1,
        total_focus_time: 1800000, // 30 minutes
        last_active: new Date()
      }
    ];

    return mockApps;
  }

  async getApplicationInfo(processName: string): Promise<ApplicationInfo | null> {
    const apps = await this.getRunningApplications();
    return apps.find(app => app.process_name === processName) || null;
  }

  async isApplicationRunning(processName: string): Promise<boolean> {
    const apps = await this.getRunningApplications();
    return apps.some(app => app.process_name === processName);
  }

  private categorizeApplication(name: string): ApplicationCategory {
    const appName = name.toLowerCase();
    
    if (appName.includes('code') || appName.includes('intellij') || appName.includes('studio')) {
      return ApplicationCategory.DEVELOPMENT;
    }
    if (appName.includes('chrome') || appName.includes('firefox') || appName.includes('safari')) {
      return ApplicationCategory.BROWSER;
    }
    if (appName.includes('slack') || appName.includes('teams') || appName.includes('discord')) {
      return ApplicationCategory.COMMUNICATION;
    }
    if (appName.includes('office') || appName.includes('excel') || appName.includes('word')) {
      return ApplicationCategory.PRODUCTIVITY;
    }
    if (appName.includes('spotify') || appName.includes('vlc') || appName.includes('game')) {
      return ApplicationCategory.ENTERTAINMENT;
    }
    
    return ApplicationCategory.UNKNOWN;
  }
}