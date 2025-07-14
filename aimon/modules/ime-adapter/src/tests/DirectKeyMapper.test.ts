import { DirectKeyMapper } from '../processors/DirectKeyMapper';
import { KeyEvent } from '../types';

describe('DirectKeyMapper', () => {
  let mapper: DirectKeyMapper;

  beforeEach(() => {
    mapper = new DirectKeyMapper();
  });

  it('should map single letters correctly', () => {
    const keys: KeyEvent[] = [
      { key: 'a', timestamp: 1000 },
      { key: 'b', timestamp: 1100 },
      { key: 'c', timestamp: 1200 }
    ];

    expect(mapper.mapKeys(keys)).toBe('abc');
  });

  it('should handle uppercase with Shift modifier', () => {
    const keys: KeyEvent[] = [
      { key: 'a', timestamp: 1000, modifiers: ['Shift'] },
      { key: 'b', timestamp: 1100 },
      { key: 'c', timestamp: 1200, modifiers: ['Shift'] }
    ];

    expect(mapper.mapKeys(keys)).toBe('AbC');
  });

  it('should map numbers correctly', () => {
    const keys: KeyEvent[] = [
      { key: 'Digit1', timestamp: 1000 },
      { key: 'Digit2', timestamp: 1100 },
      { key: 'Digit3', timestamp: 1200 }
    ];

    expect(mapper.mapKeys(keys)).toBe('123');
  });

  it('should handle special characters with Shift', () => {
    const keys: KeyEvent[] = [
      { key: 'Digit1', timestamp: 1000, modifiers: ['Shift'] },
      { key: 'Digit2', timestamp: 1100, modifiers: ['Shift'] },
      { key: 'Equal', timestamp: 1200, modifiers: ['Shift'] }
    ];

    expect(mapper.mapKeys(keys)).toBe('!@+');
  });

  it('should handle Space, Enter, and Tab', () => {
    const keys: KeyEvent[] = [
      { key: 'a', timestamp: 1000 },
      { key: 'Space', timestamp: 1100 },
      { key: 'b', timestamp: 1200 },
      { key: 'Enter', timestamp: 1300 },
      { key: 'c', timestamp: 1400 },
      { key: 'Tab', timestamp: 1500 },
      { key: 'd', timestamp: 1600 }
    ];

    expect(mapper.mapKeys(keys)).toBe('a b\nc\td');
  });

  it('should handle Backspace correctly', () => {
    const keys: KeyEvent[] = [
      { key: 'a', timestamp: 1000 },
      { key: 'b', timestamp: 1100 },
      { key: 'c', timestamp: 1200 },
      { key: 'Backspace', timestamp: 1300 },
      { key: 'd', timestamp: 1400 }
    ];

    expect(mapper.mapKeys(keys)).toBe('abd');
  });

  it('should ignore modifier keys when pressed alone', () => {
    const keys: KeyEvent[] = [
      { key: 'Control', timestamp: 1000 },
      { key: 'Alt', timestamp: 1100 },
      { key: 'a', timestamp: 1200 },
      { key: 'Meta', timestamp: 1300 },
      { key: 'b', timestamp: 1400 }
    ];

    expect(mapper.mapKeys(keys)).toBe('ab');
  });

  it('should handle custom mappings', () => {
    mapper.addCustomMapping('CustomKey', '★');
    
    const keys: KeyEvent[] = [
      { key: 'a', timestamp: 1000 },
      { key: 'CustomKey', timestamp: 1100 },
      { key: 'b', timestamp: 1200 }
    ];

    expect(mapper.mapKeys(keys)).toBe('a★b');
  });

  it('should handle KeyCode format (e.g., KeyA)', () => {
    const keys: KeyEvent[] = [
      { key: 'KeyH', timestamp: 1000 },
      { key: 'KeyE', timestamp: 1100 },
      { key: 'KeyL', timestamp: 1200 },
      { key: 'KeyL', timestamp: 1300 },
      { key: 'KeyO', timestamp: 1400 }
    ];

    expect(mapper.mapKeys(keys)).toBe('hello');
  });
});