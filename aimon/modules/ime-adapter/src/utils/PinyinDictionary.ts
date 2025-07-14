import { PinyinCandidate } from '../types';

export class PinyinDictionary {
  private dictionary: Map<string, PinyinCandidate[]> = new Map();

  constructor() {
    this.initializeCommonPinyin();
  }

  getCandidates(pinyin: string): PinyinCandidate[] {
    const normalized = pinyin.toLowerCase().trim();
    return this.dictionary.get(normalized) || [];
  }

  addEntry(pinyin: string, characters: string[], frequency: number): void {
    const normalized = pinyin.toLowerCase().trim();
    const existing = this.dictionary.get(normalized) || [];
    
    existing.push({
      pinyin: normalized,
      characters,
      frequency
    });

    // Sort by frequency
    existing.sort((a, b) => b.frequency - a.frequency);
    this.dictionary.set(normalized, existing);
  }

  private initializeCommonPinyin(): void {
    // Common pinyin mappings with frequency scores
    const commonMappings = [
      // Single syllables
      { pinyin: 'wo', chars: ['我', '窝', '握'], freq: [0.95, 0.03, 0.02] },
      { pinyin: 'ni', chars: ['你', '泥', '逆'], freq: [0.90, 0.05, 0.05] },
      { pinyin: 'hao', chars: ['好', '号', '毫'], freq: [0.85, 0.10, 0.05] },
      { pinyin: 'de', chars: ['的', '得', '德'], freq: [0.90, 0.08, 0.02] },
      { pinyin: 'shi', chars: ['是', '时', '事', '十'], freq: [0.70, 0.15, 0.10, 0.05] },
      { pinyin: 'bu', chars: ['不', '部', '步'], freq: [0.85, 0.10, 0.05] },
      { pinyin: 'zai', chars: ['在', '再', '载'], freq: [0.80, 0.15, 0.05] },
      { pinyin: 'you', chars: ['有', '友', '由'], freq: [0.85, 0.10, 0.05] },
      { pinyin: 'he', chars: ['和', '何', '河'], freq: [0.70, 0.20, 0.10] },
      { pinyin: 'ta', chars: ['他', '她', '它'], freq: [0.40, 0.40, 0.20] },
      
      // Common multi-character words
      { pinyin: 'zhong', chars: ['中', '种', '重'], freq: [0.70, 0.20, 0.10] },
      { pinyin: 'guo', chars: ['国', '过', '果'], freq: [0.60, 0.30, 0.10] },
      { pinyin: 'ren', chars: ['人', '任', '认'], freq: [0.80, 0.10, 0.10] },
      { pinyin: 'da', chars: ['大', '打', '达'], freq: [0.70, 0.20, 0.10] },
      { pinyin: 'xiao', chars: ['小', '笑', '校'], freq: [0.60, 0.25, 0.15] },
      { pinyin: 'shuo', chars: ['说', '硕'], freq: [0.95, 0.05] },
      { pinyin: 'kan', chars: ['看', '砍'], freq: [0.90, 0.10] },
      { pinyin: 'lai', chars: ['来', '赖'], freq: [0.95, 0.05] },
      { pinyin: 'qu', chars: ['去', '取', '趣'], freq: [0.70, 0.20, 0.10] },
      { pinyin: 'jiu', chars: ['就', '九', '酒'], freq: [0.70, 0.20, 0.10] },
      
      // Numbers
      { pinyin: 'yi', chars: ['一', '以', '已', '意'], freq: [0.40, 0.30, 0.20, 0.10] },
      { pinyin: 'er', chars: ['二', '而', '儿'], freq: [0.40, 0.40, 0.20] },
      { pinyin: 'san', chars: ['三', '散'], freq: [0.90, 0.10] },
      { pinyin: 'si', chars: ['四', '思', '死'], freq: [0.60, 0.30, 0.10] },
      { pinyin: 'wu', chars: ['五', '无', '物'], freq: [0.50, 0.35, 0.15] },
      { pinyin: 'liu', chars: ['六', '流', '留'], freq: [0.60, 0.25, 0.15] },
      { pinyin: 'qi', chars: ['七', '起', '气'], freq: [0.40, 0.40, 0.20] },
      { pinyin: 'ba', chars: ['八', '把', '吧'], freq: [0.40, 0.40, 0.20] },
      
      // Common verbs
      { pinyin: 'zuo', chars: ['做', '作', '坐'], freq: [0.40, 0.40, 0.20] },
      { pinyin: 'xiang', chars: ['想', '向', '像'], freq: [0.50, 0.30, 0.20] },
      { pinyin: 'yao', chars: ['要', '药', '腰'], freq: [0.80, 0.10, 0.10] },
      { pinyin: 'gei', chars: ['给'], freq: [1.0] },
      { pinyin: 'dao', chars: ['到', '道', '倒'], freq: [0.70, 0.20, 0.10] },
    ];

    // Add to dictionary
    for (const mapping of commonMappings) {
      for (let i = 0; i < mapping.chars.length; i++) {
        this.addEntry(
          mapping.pinyin,
          [mapping.chars[i]],
          mapping.freq[i]
        );
      }
    }
  }

  // Load extended dictionary from file
  async loadFromFile(filepath: string): Promise<void> {
    // In production, this would load a comprehensive pinyin dictionary
    // Format: pinyin,character,frequency
    try {
      // Placeholder for file loading logic
      logger.info(`Loading pinyin dictionary from ${filepath}`);
    } catch (error) {
      logger.error('Failed to load pinyin dictionary:', error);
    }
  }
}

// Import logger type
import { logger } from './logger';