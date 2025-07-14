import { EventEmitter } from 'events';
import {
  WindowInfo,
  ApplicationInfo,
  ContextEvent,
  ContextEventType,
  ContextDetectorConfig,
  FocusSession,
  ApplicationCategory,
  WindowPattern,
  BrowserContext,
  ProjectDetectionResult
} from './types';
import { WindowTracker } from './trackers/WindowTracker';
import { ApplicationMonitor } from './monitors/ApplicationMonitor';
import { ScreenshotCapture } from './capture/ScreenshotCapture';
import { PatternMatcher } from './patterns/PatternMatcher';
import { ProjectDetector } from './detectors/ProjectDetector';
import { logger } from './utils/logger';

export class ContextDetector extends EventEmitter {
  private windowTracker: WindowTracker;
  private applicationMonitor: ApplicationMonitor;
  private screenshotCapture: ScreenshotCapture;
  private patternMatcher: PatternMatcher;
  private projectDetector: ProjectDetector;
  
  private currentWindow: WindowInfo | null = null;
  private currentSession: FocusSession | null = null;
  private isRunning = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor(private config: ContextDetectorConfig) {
    super();
    
    this.windowTracker = new WindowTracker();
    this.applicationMonitor = new ApplicationMonitor();
    this.screenshotCapture = new ScreenshotCapture(config.screenshot_config);
    this.patternMatcher = new PatternMatcher(config.patterns);
    this.projectDetector = new ProjectDetector();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Context detector already running');
      return;
    }

    try {
      logger.info('Starting context detector...');

      if (this.config.enable_window_tracking) {
        await this.windowTracker.initialize();
      }

      if (this.config.enable_application_monitoring) {
        await this.applicationMonitor.initialize();
      }

      if (this.config.enable_screenshot_capture) {
        await this.screenshotCapture.initialize();
      }

      this.setupEventHandlers();
      this.startPolling();

      this.isRunning = true;
      logger.info('Context detector started successfully');

    } catch (error) {
      logger.error('Failed to start context detector:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    await this.endCurrentSession();
    await this.screenshotCapture.cleanup();

    logger.info('Context detector stopped');
  }

  private setupEventHandlers(): void {
    this.windowTracker.on('window-focus', (window: WindowInfo) => {
      this.handleWindowFocus(window);
    });

    this.windowTracker.on('window-blur', (window: WindowInfo) => {
      this.handleWindowBlur(window);
    });

    this.applicationMonitor.on('app-start', (app: ApplicationInfo) => {
      this.handleApplicationStart(app);
    });

    this.applicationMonitor.on('app-exit', (app: ApplicationInfo) => {
      this.handleApplicationExit(app);
    });
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(async () => {
      try {
        await this.pollContext();
      } catch (error) {
        logger.error('Error in context polling:', error);
      }
    }, this.config.polling_interval);
  }

  private async pollContext(): Promise<void> {
    if (!this.config.enable_window_tracking) return;

    const activeWindow = await this.windowTracker.getActiveWindow();
    
    if (!activeWindow) return;

    // Check if window changed
    if (!this.currentWindow || this.currentWindow.id !== activeWindow.id) {
      await this.handleWindowChange(activeWindow);
    } else {
      // Update current session duration
      if (this.currentSession) {
        this.currentSession.duration = Date.now() - this.currentSession.start_time.getTime();
      }
    }

    // Capture screenshot if enabled
    if (this.config.enable_screenshot_capture) {
      await this.captureScreenshotIfNeeded();
    }
  }

  private async handleWindowChange(window: WindowInfo): Promise<void> {
    const previousWindow = this.currentWindow;

    // End previous session
    await this.endCurrentSession();

    // Start new session
    await this.startNewSession(window);

    // Emit context change event
    const contextEvent = this.createContextEvent(
      ContextEventType.WINDOW_FOCUS,
      window
    );

    this.emit('context-change', contextEvent);

    // Apply patterns
    const patternResults = this.patternMatcher.match(window);
    if (patternResults.length > 0) {
      this.emit('pattern-match', { window, patterns: patternResults });
    }

    // Detect project context
    if (this.shouldDetectProject(window)) {
      const projectResult = await this.projectDetector.detect(window);
      if (projectResult) {
        this.emit('project-detected', { window, project: projectResult });
      }
    }

    this.currentWindow = window;
  }

  private async handleWindowFocus(window: WindowInfo): Promise<void> {
    logger.debug(`Window focused: ${window.title} (${window.application})`);
    await this.handleWindowChange(window);
  }

  private async handleWindowBlur(window: WindowInfo): Promise<void> {
    logger.debug(`Window blurred: ${window.title} (${window.application})`);
    
    const contextEvent = this.createContextEvent(
      ContextEventType.WINDOW_BLUR,
      window
    );

    this.emit('context-change', contextEvent);
  }

  private async handleApplicationStart(app: ApplicationInfo): Promise<void> {
    logger.info(`Application started: ${app.name}`);

    const contextEvent: ContextEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      device_id: 'device-1',
      session_id: 'session-1',
      event_type: ContextEventType.APPLICATION_START,
      window_info: {} as WindowInfo,
      application_info: app,
      metadata: {
        screen_count: 1,
        active_screen: 0,
        system_info: {
          os: process.platform,
          os_version: require('os').release(),
          screen_resolution: '1920x1080'
        }
      }
    };

    this.emit('context-change', contextEvent);
  }

  private async handleApplicationExit(app: ApplicationInfo): Promise<void> {
    logger.info(`Application exited: ${app.name}`);

    const contextEvent: ContextEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      device_id: 'device-1',
      session_id: 'session-1',
      event_type: ContextEventType.APPLICATION_EXIT,
      window_info: {} as WindowInfo,
      application_info: app,
      metadata: {
        screen_count: 1,
        active_screen: 0,
        system_info: {
          os: process.platform,
          os_version: require('os').release(),
          screen_resolution: '1920x1080'
        }
      }
    };

    this.emit('context-change', contextEvent);
  }

  private async startNewSession(window: WindowInfo): Promise<void> {
    this.currentSession = {
      id: this.generateSessionId(),
      application: window.application,
      window_title: window.title,
      start_time: new Date(),
      duration: 0,
      activity_score: 0,
      interruption_count: 0,
      productivity_rating: this.calculateProductivityRating(window)
    };

    logger.debug(`Started new session: ${this.currentSession.id}`);
  }

  private async endCurrentSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.end_time = new Date();
    this.currentSession.duration = 
      this.currentSession.end_time.getTime() - this.currentSession.start_time.getTime();

    this.emit('session-end', this.currentSession);
    
    logger.debug(`Ended session: ${this.currentSession.id}, duration: ${this.currentSession.duration}ms`);
    
    this.currentSession = null;
  }

  private createContextEvent(type: ContextEventType, window: WindowInfo): ContextEvent {
    return {
      id: this.generateEventId(),
      timestamp: new Date(),
      device_id: 'device-1',
      session_id: 'session-1',
      event_type: type,
      window_info: window,
      application_info: this.getApplicationInfo(window),
      focus_duration: this.currentSession?.duration,
      metadata: {
        screen_count: 1,
        active_screen: 0,
        system_info: {
          os: process.platform,
          os_version: require('os').release(),
          screen_resolution: '1920x1080'
        }
      }
    };
  }

  private getApplicationInfo(window: WindowInfo): ApplicationInfo {
    return {
      name: window.application,
      process_name: window.process_name,
      executable_path: '',
      category: this.categorizeApplication(window.application),
      productivity_score: this.calculateProductivityRating(window),
      window_count: 1,
      total_focus_time: 0,
      last_active: new Date()
    };
  }

  private categorizeApplication(appName: string): ApplicationCategory {
    const app = appName.toLowerCase();
    
    if (app.includes('code') || app.includes('ide') || app.includes('studio')) {
      return ApplicationCategory.DEVELOPMENT;
    }
    if (app.includes('chrome') || app.includes('firefox') || app.includes('safari')) {
      return ApplicationCategory.BROWSER;
    }
    if (app.includes('slack') || app.includes('teams') || app.includes('discord')) {
      return ApplicationCategory.COMMUNICATION;
    }
    if (app.includes('office') || app.includes('excel') || app.includes('word')) {
      return ApplicationCategory.PRODUCTIVITY;
    }
    if (app.includes('youtube') || app.includes('netflix') || app.includes('game')) {
      return ApplicationCategory.ENTERTAINMENT;
    }
    
    return ApplicationCategory.UNKNOWN;
  }

  private calculateProductivityRating(window: WindowInfo): number {
    const category = this.categorizeApplication(window.application);
    
    switch (category) {
      case ApplicationCategory.DEVELOPMENT:
      case ApplicationCategory.PRODUCTIVITY:
        return 90;
      case ApplicationCategory.COMMUNICATION:
        return 70;
      case ApplicationCategory.BROWSER:
        return 50;
      case ApplicationCategory.ENTERTAINMENT:
        return 20;
      default:
        return 50;
    }
  }

  private shouldDetectProject(window: WindowInfo): boolean {
    const devApps = ['vscode', 'intellij', 'sublime', 'atom', 'vim'];
    return devApps.some(app => window.application.toLowerCase().includes(app));
  }

  private async captureScreenshotIfNeeded(): Promise<void> {
    if (!this.config.enable_screenshot_capture || !this.currentWindow) return;

    try {
      const screenshot = await this.screenshotCapture.capture();
      if (screenshot) {
        this.emit('screenshot-captured', {
          window: this.currentWindow,
          screenshot_path: screenshot
        });
      }
    } catch (error) {
      logger.error('Failed to capture screenshot:', error);
    }
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods

  async getCurrentContext(): Promise<{
    window: WindowInfo | null;
    session: FocusSession | null;
    applications: ApplicationInfo[];
  }> {
    const applications = await this.applicationMonitor.getRunningApplications();
    
    return {
      window: this.currentWindow,
      session: this.currentSession,
      applications
    };
  }

  async getActiveWindows(): Promise<WindowInfo[]> {
    return this.windowTracker.getAllWindows();
  }

  async updateConfig(config: Partial<ContextDetectorConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    if (config.patterns) {
      this.patternMatcher.updatePatterns(config.patterns);
    }
    
    logger.info('Context detector configuration updated');
  }

  getStatistics(): any {
    return {
      isRunning: this.isRunning,
      currentWindow: this.currentWindow?.title || null,
      sessionDuration: this.currentSession?.duration || 0,
      eventsGenerated: 0 // Would track in real implementation
    };
  }
}