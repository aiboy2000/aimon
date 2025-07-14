import { ClipboardMonitor } from '../processors/ClipboardMonitor';
import { EventEmitter } from 'events';

describe('ClipboardMonitor', () => {
  let monitor: ClipboardMonitor;

  beforeEach(() => {
    monitor = new ClipboardMonitor();
  });

  afterEach(() => {
    monitor.stop();
  });

  describe('Clipboard monitoring', () => {
    it('should start and stop monitoring', () => {
      monitor.start();
      expect(monitor['isMonitoring']).toBe(true);
      
      monitor.stop();
      expect(monitor['isMonitoring']).toBe(false);
    });

    it('should not start twice', () => {
      monitor.start();
      const interval1 = monitor['monitorInterval'];
      
      monitor.start();
      const interval2 = monitor['monitorInterval'];
      
      expect(interval1).toBe(interval2);
    });
  });

  describe('Text history', () => {
    it('should maintain clipboard history', () => {
      // Manually add to history for testing
      monitor['addToHistory']('Text 1');
      monitor['addToHistory']('Text 2');
      monitor['addToHistory']('Text 3');

      const history = monitor.getHistory();
      expect(history).toHaveLength(3);
      expect(history[0].text).toBe('Text 1');
      expect(history[1].text).toBe('Text 2');
      expect(history[2].text).toBe('Text 3');
    });

    it('should timestamp clipboard entries', () => {
      const beforeTime = Date.now();
      monitor['addToHistory']('Test text');
      const afterTime = Date.now();
      
      const history = monitor.getHistory();
      
      expect(history[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(history[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should limit history size', () => {
      monitor = new ClipboardMonitor({ maxHistorySize: 3 });
      
      // Add more than max history size
      for (let i = 0; i < 5; i++) {
        monitor['addToHistory'](`Text ${i}`);
      }

      const history = monitor.getHistory();
      expect(history).toHaveLength(3);
      expect(history[0].text).toBe('Text 2'); // Oldest kept
      expect(history[2].text).toBe('Text 4'); // Newest
    });

    it('should clear history when requested', () => {
      monitor['addToHistory']('Some text');
      expect(monitor.getHistory()).toHaveLength(1);
      
      monitor.clearHistory();
      expect(monitor.getHistory()).toHaveLength(0);
    });
  });

  describe('Text correlation', () => {
    it('should get recent text within time window', async () => {
      const now = Date.now();
      
      // Add clipboard entries at different times
      monitor['history'] = [
        { text: 'Old text', timestamp: now - 60000 }, // 1 minute ago
        { text: 'Recent text 1', timestamp: now - 5000 }, // 5 seconds ago
        { text: 'Recent text 2', timestamp: now - 3000 }, // 3 seconds ago
        { text: 'Current text', timestamp: now - 1000 } // 1 second ago
      ];

      // Get text from last 10 seconds
      const recentText = monitor.getRecentText(10000);
      
      expect(recentText).toHaveLength(3);
      expect(recentText[0]).toBe('Recent text 1');
      expect(recentText[1]).toBe('Recent text 2');
      expect(recentText[2]).toBe('Current text');
    });

    it('should return empty array when no recent text', () => {
      const recentText = monitor.getRecentText(5000);
      expect(recentText).toEqual([]);
    });

    it('should handle empty time window', () => {
      monitor['history'] = [
        { text: 'Text', timestamp: Date.now() }
      ];

      const recentText = monitor.getRecentText(0);
      expect(recentText).toEqual([]);
    });
  });

  describe('Integration with text reconstruction', () => {
    it('should correlate clipboard text with timestamps', async () => {
      const keyTimestamp = Date.now();
      const clipboardText = '你好世界';
      
      mockClipboardy.read.mockResolvedValue(clipboardText);
      
      monitor.start();
      const changeCallback = mockClipboardEvent.startListening.mock.calls[0][0];
      await changeCallback();

      // Simulate checking for clipboard text around key event time
      const correlatedText = monitor.getTextAroundTime(keyTimestamp, 2000);
      
      expect(correlatedText).toBe(clipboardText);
    });

    it('should return null when no text found around timestamp', () => {
      const pastTimestamp = Date.now() - 60000; // 1 minute ago
      const correlatedText = monitor.getTextAroundTime(pastTimestamp, 2000);
      
      expect(correlatedText).toBeNull();
    });
  });
});