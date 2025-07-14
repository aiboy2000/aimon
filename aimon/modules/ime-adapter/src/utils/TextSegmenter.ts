import { TextSegment } from '../types';

export class TextSegmenter {
  segment(text: string): TextSegment[] {
    if (!text) return [];

    const segments: TextSegment[] = [];
    let currentSegment = '';
    let currentType: 'latin' | 'cjk' | 'mixed' = 'latin';

    for (const char of text) {
      const charType = this.getCharType(char);
      
      if (charType === currentType || charType === 'other') {
        currentSegment += char;
      } else {
        // Type changed, save current segment
        if (currentSegment) {
          segments.push({
            text: currentSegment,
            type: currentType
          });
        }
        currentSegment = char;
        currentType = charType === 'other' ? currentType : charType;
      }
    }

    // Add final segment
    if (currentSegment) {
      segments.push({
        text: currentSegment,
        type: currentType
      });
    }

    return this.mergeSmallSegments(segments);
  }

  private getCharType(char: string): 'latin' | 'cjk' | 'other' {
    // CJK unified ideographs
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(char)) {
      return 'cjk';
    }
    
    // Japanese hiragana and katakana
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(char)) {
      return 'cjk';
    }
    
    // Korean hangul
    if (/[\uac00-\ud7af\u1100-\u11ff]/.test(char)) {
      return 'cjk';
    }
    
    // Latin characters
    if (/[a-zA-Z]/.test(char)) {
      return 'latin';
    }
    
    // Everything else (numbers, punctuation, etc.)
    return 'other';
  }

  private mergeSmallSegments(segments: TextSegment[]): TextSegment[] {
    if (segments.length <= 1) return segments;

    const merged: TextSegment[] = [];
    let i = 0;

    while (i < segments.length) {
      const current = segments[i];
      
      // Merge small segments with neighbors
      if (current.text.length <= 2 && i > 0 && i < segments.length - 1) {
        const prev = merged[merged.length - 1];
        const next = segments[i + 1];
        
        // Prefer merging with same type
        if (prev.type === current.type || next.type !== current.type) {
          prev.text += current.text;
        } else {
          next.text = current.text + next.text;
          i++; // Skip next as we've already merged it
        }
      } else {
        merged.push({ ...current });
      }
      
      i++;
    }

    return merged;
  }

  // Analyze if a segment looks like pinyin
  isPotentialPinyin(segment: TextSegment): boolean {
    if (segment.type !== 'latin') return false;
    
    const text = segment.text.toLowerCase();
    
    // Check length - pinyin syllables are typically 2-6 characters
    if (text.length < 2 || text.length > 6) return false;
    
    // Check for common pinyin patterns
    const pinyinPattern = /^[bpmfdtnlgkhjqxrzcsyw]?[aeiouv]+[ng]?$/;
    return pinyinPattern.test(text);
  }
}