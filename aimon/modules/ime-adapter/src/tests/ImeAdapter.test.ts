import { ImeAdapter } from '../ImeAdapter';
import { KeySequence, ReconstructionMethod } from '../types';

describe('ImeAdapter', () => {
  let adapter: ImeAdapter;

  beforeEach(() => {
    adapter = new ImeAdapter();
  });

  afterEach(() => {
    adapter.cleanup();
  });

  describe('Direct key mapping', () => {
    it('should map basic Latin text correctly', async () => {
      const sequence: KeySequence = {
        eventId: 'test-1',
        sessionId: 'session-1',
        deviceId: 'device-1',
        keys: [
          { key: 'h', timestamp: 1000 },
          { key: 'e', timestamp: 1100 },
          { key: 'l', timestamp: 1200 },
          { key: 'l', timestamp: 1300 },
          { key: 'o', timestamp: 1400 }
        ]
      };

      const result = await adapter.processKeySequence(sequence);
      
      expect(result.text).toBe('hello');
      expect(result.method).toBe(ReconstructionMethod.DIRECT);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle uppercase letters with Shift', async () => {
      const sequence: KeySequence = {
        eventId: 'test-2',
        sessionId: 'session-1',
        deviceId: 'device-1',
        keys: [
          { key: 'h', timestamp: 1000, modifiers: ['Shift'] },
          { key: 'i', timestamp: 1100 }
        ]
      };

      const result = await adapter.processKeySequence(sequence);
      
      expect(result.text).toBe('Hi');
      expect(result.method).toBe(ReconstructionMethod.DIRECT);
    });

    it('should handle special characters', async () => {
      const sequence: KeySequence = {
        eventId: 'test-3',
        sessionId: 'session-1',
        deviceId: 'device-1',
        keys: [
          { key: 'Space', timestamp: 1000 },
          { key: 'Enter', timestamp: 1100 },
          { key: 'Tab', timestamp: 1200 }
        ]
      };

      const result = await adapter.processKeySequence(sequence);
      
      expect(result.text).toBe(' \n\t');
      expect(result.method).toBe(ReconstructionMethod.DIRECT);
    });
  });

  describe('Pinyin processing', () => {
    it('should detect and convert simple pinyin', async () => {
      const sequence: KeySequence = {
        eventId: 'test-4',
        sessionId: 'session-1',
        deviceId: 'device-1',
        keys: [
          { key: 'n', timestamp: 1000 },
          { key: 'i', timestamp: 1100 },
          { key: 'h', timestamp: 1200 },
          { key: 'a', timestamp: 1300 },
          { key: 'o', timestamp: 1400 }
        ],
        applicationContext: 'Chinese Input'
      };

      const result = await adapter.processKeySequence(sequence);
      
      expect(result.text).toBe('你好');
      expect(result.method).toBe(ReconstructionMethod.PINYIN);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should handle mixed pinyin and direct text', async () => {
      const sequence: KeySequence = {
        eventId: 'test-5',
        sessionId: 'session-1',
        deviceId: 'device-1',
        keys: [
          // "Hello "
          { key: 'H', timestamp: 1000, modifiers: ['Shift'] },
          { key: 'e', timestamp: 1100 },
          { key: 'l', timestamp: 1200 },
          { key: 'l', timestamp: 1300 },
          { key: 'o', timestamp: 1400 },
          { key: 'Space', timestamp: 1500 },
          // "shijie" -> "世界"
          { key: 's', timestamp: 1600 },
          { key: 'h', timestamp: 1700 },
          { key: 'i', timestamp: 1800 },
          { key: 'j', timestamp: 1900 },
          { key: 'i', timestamp: 2000 },
          { key: 'e', timestamp: 2100 }
        ],
        language: 'zh'
      };

      const result = await adapter.processKeySequence(sequence);
      
      expect(result.text).toContain('Hello');
      expect(result.text).toContain('世界');
      expect(result.method).toBe(ReconstructionMethod.PINYIN);
    });
  });

  describe('Error handling', () => {
    it('should fallback to direct mapping on error', async () => {
      const sequence: KeySequence = {
        eventId: 'test-6',
        sessionId: 'session-1',
        deviceId: 'device-1',
        keys: [
          { key: 'a', timestamp: 1000 },
          { key: 'b', timestamp: 1100 },
          { key: 'c', timestamp: 1200 }
        ]
      };

      // Force an error by passing invalid data
      (sequence as any).keys = null;

      const result = await adapter.processKeySequence(sequence);
      
      expect(result.method).toBe(ReconstructionMethod.DIRECT);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.metadata).toBeDefined();
    });
  });
});