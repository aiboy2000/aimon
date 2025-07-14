import { KeyEvent } from '../types';

export class DirectKeyMapper {
  private keyMap: Map<string, string> = new Map([
    // Letters
    ['KeyA', 'a'], ['KeyB', 'b'], ['KeyC', 'c'], ['KeyD', 'd'],
    ['KeyE', 'e'], ['KeyF', 'f'], ['KeyG', 'g'], ['KeyH', 'h'],
    ['KeyI', 'i'], ['KeyJ', 'j'], ['KeyK', 'k'], ['KeyL', 'l'],
    ['KeyM', 'm'], ['KeyN', 'n'], ['KeyO', 'o'], ['KeyP', 'p'],
    ['KeyQ', 'q'], ['KeyR', 'r'], ['KeyS', 's'], ['KeyT', 't'],
    ['KeyU', 'u'], ['KeyV', 'v'], ['KeyW', 'w'], ['KeyX', 'x'],
    ['KeyY', 'y'], ['KeyZ', 'z'],
    
    // Numbers
    ['Digit0', '0'], ['Digit1', '1'], ['Digit2', '2'], ['Digit3', '3'],
    ['Digit4', '4'], ['Digit5', '5'], ['Digit6', '6'], ['Digit7', '7'],
    ['Digit8', '8'], ['Digit9', '9'],
    
    // Special characters
    ['Space', ' '], ['Enter', '\n'], ['Tab', '\t'],
    ['Period', '.'], ['Comma', ','], ['Semicolon', ';'],
    ['Quote', "'"], ['BracketLeft', '['], ['BracketRight', ']'],
    ['Backslash', '\\'], ['Slash', '/'], ['Equal', '='],
    ['Minus', '-'], ['Backquote', '`'],
    
    // With shift
    ['Shift+Digit1', '!'], ['Shift+Digit2', '@'], ['Shift+Digit3', '#'],
    ['Shift+Digit4', '$'], ['Shift+Digit5', '%'], ['Shift+Digit6', '^'],
    ['Shift+Digit7', '&'], ['Shift+Digit8', '*'], ['Shift+Digit9', '('],
    ['Shift+Digit0', ')'], ['Shift+Minus', '_'], ['Shift+Equal', '+'],
    ['Shift+BracketLeft', '{'], ['Shift+BracketRight', '}'],
    ['Shift+Backslash', '|'], ['Shift+Semicolon', ':'],
    ['Shift+Quote', '"'], ['Shift+Comma', '<'], ['Shift+Period', '>'],
    ['Shift+Slash', '?'], ['Shift+Backquote', '~']
  ]);

  mapKeys(keys: KeyEvent[]): string {
    let result = '';

    for (const keyEvent of keys) {
      // Skip standalone modifier keys
      if (['Control', 'Alt', 'Meta', 'CapsLock', 'Shift'].includes(keyEvent.key)) {
        continue;
      }

      // Handle backspace
      if (keyEvent.key === 'Backspace') {
        result = result.slice(0, -1);
        continue;
      }

      // Check if shift is pressed with this key
      const hasShift = keyEvent.modifiers?.includes('Shift') || false;

      // Map the key
      let mappedKey = this.getMappedKey(keyEvent.key, hasShift);
      
      // Handle uppercase for letters when shift is pressed
      if (hasShift && /^[a-z]$/.test(mappedKey)) {
        mappedKey = mappedKey.toUpperCase();
      }

      result += mappedKey;
    }

    return result;
  }

  private getMappedKey(key: string, withShift: boolean): string {
    // Try with shift modifier first
    if (withShift) {
      const shiftKey = `Shift+${key}`;
      if (this.keyMap.has(shiftKey)) {
        return this.keyMap.get(shiftKey)!;
      }
    }

    // Try direct mapping
    if (this.keyMap.has(key)) {
      return this.keyMap.get(key)!;
    }

    // Handle single character keys
    if (key.length === 1) {
      return key;
    }

    // Strip 'Key' prefix for letters
    if (key.startsWith('Key') && key.length === 4) {
      return key[3].toLowerCase();
    }

    // Default: return empty string for unmapped keys
    return '';
  }

  addCustomMapping(key: string, value: string): void {
    this.keyMap.set(key, value);
  }

  removeMapping(key: string): void {
    this.keyMap.delete(key);
  }
}