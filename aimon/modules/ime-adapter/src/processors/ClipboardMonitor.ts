import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

interface ClipboardEntry {
  text: string;
  timestamp: number;
}

interface ClipboardMonitorOptions {
  maxHistorySize?: number;
  pollInterval?: number;
}

export class ClipboardMonitor extends EventEmitter {
  private history: ClipboardEntry[] = [];
  private isMonitoring: boolean = false;
  private lastText: string = '';
  private options: ClipboardMonitorOptions;
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor(options: ClipboardMonitorOptions = {}) {
    super();
    this.options = {
      maxHistorySize: options.maxHistorySize || 100,
      pollInterval: options.pollInterval || 500
    };
  }

  start(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    logger.info('Starting clipboard monitoring');

    // Note: In a real implementation, this would use platform-specific APIs
    // For now, we'll use a polling approach
    this.monitorInterval = setInterval(async () => {
      try {
        const text = await this.readSystemClipboard();
        
        if (text && text !== this.lastText) {
          this.lastText = text;
          this.addToHistory(text);
          this.emit('change', text);
          logger.debug('Clipboard changed:', text.substring(0, 50) + '...');
        }
      } catch (error: any) {
        logger.error('Failed to read clipboard:', error);
        this.emit('error', error);
      }
    }, this.options.pollInterval!);
  }

  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    logger.info('Stopped clipboard monitoring');
  }

  private async readSystemClipboard(): Promise<string> {
    // Placeholder implementation
    // In a real implementation, this would use clipboard libraries
    return '';
  }

  private addToHistory(text: string): void {
    const entry: ClipboardEntry = {
      text,
      timestamp: Date.now()
    };

    this.history.push(entry);

    // Limit history size
    if (this.history.length > this.options.maxHistorySize!) {
      this.history.shift();
    }
  }

  getHistory(): ClipboardEntry[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
    logger.debug('Clipboard history cleared');
  }

  getRecentText(timeWindowMs: number): string[] {
    const cutoffTime = Date.now() - timeWindowMs;
    
    return this.history
      .filter(entry => entry.timestamp >= cutoffTime)
      .map(entry => entry.text);
  }

  getTextAroundTime(timestamp: number, windowMs: number): string | null {
    const startTime = timestamp - windowMs;
    const endTime = timestamp + windowMs;

    const matches = this.history.filter(entry => 
      entry.timestamp >= startTime && entry.timestamp <= endTime
    );

    if (matches.length > 0) {
      // Return the closest match
      matches.sort((a, b) => 
        Math.abs(a.timestamp - timestamp) - Math.abs(b.timestamp - timestamp)
      );
      return matches[0].text;
    }

    return null;
  }

  async getCurrentClipboard(): Promise<string | null> {
    try {
      return await this.readSystemClipboard();
    } catch (error) {
      logger.error('Failed to read current clipboard:', error);
      return null;
    }
  }

  async correlateWithKeyEvents(
    keyEventTimestamp: number,
    windowMs: number = 2000
  ): Promise<{
    text: string | null;
    confidence: number;
    method: 'exact' | 'nearby' | 'none';
  }> {
    // Check for clipboard text around the key event time
    const nearbyText = this.getTextAroundTime(keyEventTimestamp, windowMs);
    
    if (nearbyText) {
      // Calculate confidence based on time proximity
      const entries = this.history.filter(e => 
        Math.abs(e.timestamp - keyEventTimestamp) <= windowMs
      );
      
      if (entries.length > 0) {
        const closestEntry = entries.reduce((closest, entry) => 
          Math.abs(entry.timestamp - keyEventTimestamp) < 
          Math.abs(closest.timestamp - keyEventTimestamp) ? entry : closest
        );
        
        const timeDiff = Math.abs(closestEntry.timestamp - keyEventTimestamp);
        const confidence = 1 - (timeDiff / windowMs);
        
        return {
          text: closestEntry.text,
          confidence,
          method: timeDiff < 100 ? 'exact' : 'nearby'
        };
      }
    }

    return {
      text: null,
      confidence: 0,
      method: 'none'
    };
  }

  // Check if clipboard contains Chinese text (for IME detection)
  async hasChineseText(): Promise<boolean> {
    const text = await this.getCurrentClipboard();
    if (!text) return false;
    
    // Check for Chinese characters
    const chineseRegex = /[\u4e00-\u9fa5]/;
    return chineseRegex.test(text);
  }

  // Get statistics about clipboard usage
  getStatistics(): {
    totalEntries: number;
    averageLength: number;
    languageDistribution: Record<string, number>;
  } {
    const stats = {
      totalEntries: this.history.length,
      averageLength: 0,
      languageDistribution: {} as Record<string, number>
    };

    if (this.history.length === 0) {
      return stats;
    }

    let totalLength = 0;
    
    for (const entry of this.history) {
      totalLength += entry.text.length;
      
      // Simple language detection
      if (/[\u4e00-\u9fa5]/.test(entry.text)) {
        stats.languageDistribution['chinese'] = 
          (stats.languageDistribution['chinese'] || 0) + 1;
      } else if (/[a-zA-Z]/.test(entry.text)) {
        stats.languageDistribution['english'] = 
          (stats.languageDistribution['english'] || 0) + 1;
      } else {
        stats.languageDistribution['other'] = 
          (stats.languageDistribution['other'] || 0) + 1;
      }
    }

    stats.averageLength = totalLength / this.history.length;
    
    return stats;
  }

  getRecentData(startTime: number, endTime: number): ClipboardEntry[] {
    return this.history.filter(
      item => item.timestamp >= startTime && item.timestamp <= endTime
    );
  }

  getLastData(): ClipboardEntry | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }
}