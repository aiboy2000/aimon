import pinyin from 'pinyin';
import { ReconstructedText, PinyinCandidate } from '../types';
import { PinyinDictionary } from '../utils/PinyinDictionary';
import { logger } from '../utils/logger';

export class PinyinProcessor {
  private dictionary: PinyinDictionary;
  private cache: Map<string, ReconstructedText> = new Map();

  constructor() {
    this.dictionary = new PinyinDictionary();
  }

  async process(text: string): Promise<ReconstructedText> {
    // Check cache first
    if (this.cache.has(text)) {
      return this.cache.get(text)!;
    }

    try {
      // Split into potential pinyin syllables
      const syllables = this.splitIntoSyllables(text.toLowerCase());
      
      if (syllables.length === 0) {
        return {
          text: text,
          confidence: 0.1,
          method: 'pinyin' as any,
        };
      }

      // Get candidates for each syllable
      const candidates = await this.getCandidatesForSyllables(syllables);
      
      // Rank and select best match
      const result = this.selectBestCandidate(candidates, text);
      
      // Cache the result
      this.cache.set(text, result);
      
      // Limit cache size
      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      return result;

    } catch (error) {
      logger.error('Error in pinyin processing:', error);
      return {
        text: text,
        confidence: 0,
        method: 'pinyin' as any,
      };
    }
  }

  looksLikePinyin(text: string): boolean {
    if (!text || text.length < 2) return false;
    
    // Check if text contains only letters and possibly apostrophes
    if (!/^[a-zA-Z']+$/.test(text)) return false;
    
    // Check for common pinyin patterns
    const pinyinPatterns = [
      /[bpmfdtnlgkhjqxrzcsyw]?[aeiouv]+ng?/,
      /zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw]/,
      /[aeiouv]+[nr]?/
    ];
    
    const syllables = text.toLowerCase().split(/(?=[bpmfdtnlgkhjqxzhchshrzcsyw])/);
    return syllables.some(s => pinyinPatterns.some(p => p.test(s)));
  }

  // Methods expected by tests
  isPinyinSequence(text: string): boolean {
    return this.looksLikePinyin(text);
  }

  segmentPinyin(text: string): string[] {
    return this.splitIntoSyllables(text.toLowerCase());
  }

  async convertToCharacters(syllables: string[]): Promise<Array<{character: string, probability: number}>> {
    const results: Array<{character: string, probability: number}> = [];
    
    for (const syllable of syllables) {
      const candidates = this.dictionary.getCandidates(syllable);
      if (candidates.length > 0) {
        // Sort by frequency and return top candidates
        candidates.sort((a, b) => b.frequency - a.frequency);
        for (const candidate of candidates.slice(0, 3)) {
          for (const char of candidate.characters) {
            results.push({
              character: char,
              probability: candidate.frequency
            });
          }
        }
      }
    }
    
    return results;
  }

  async processPinyin(text: string): Promise<{text: string, alternatives?: string[], confidence: number}> {
    const processed = await this.process(text);
    return {
      text: processed.text,
      alternatives: processed.alternatives,
      confidence: processed.confidence
    };
  }

  private splitIntoSyllables(text: string): string[] {
    const syllables: string[] = [];
    let current = '';
    
    // Common pinyin initials
    const initials = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 
                     'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w'];
    
    let i = 0;
    while (i < text.length) {
      // Check for two-letter initials
      if (i < text.length - 1) {
        const twoChar = text.substring(i, i + 2);
        if (initials.includes(twoChar)) {
          if (current) {
            syllables.push(current);
          }
          current = twoChar;
          i += 2;
          continue;
        }
      }
      
      // Check for single-letter initials
      const oneChar = text[i];
      if (initials.includes(oneChar) && current.length > 0) {
        syllables.push(current);
        current = oneChar;
      } else {
        current += oneChar;
      }
      i++;
    }
    
    if (current) {
      syllables.push(current);
    }
    
    return syllables;
  }

  private async getCandidatesForSyllables(syllables: string[]): Promise<PinyinCandidate[][]> {
    const allCandidates: PinyinCandidate[][] = [];
    
    for (const syllable of syllables) {
      const candidates = this.dictionary.getCandidates(syllable);
      allCandidates.push(candidates);
    }
    
    return allCandidates;
  }

  private selectBestCandidate(
    candidateGroups: PinyinCandidate[][], 
    originalText: string
  ): ReconstructedText {
    if (candidateGroups.length === 0 || candidateGroups.some(g => g.length === 0)) {
      return {
        text: originalText,
        confidence: 0.1,
        method: 'pinyin' as any,
      };
    }

    // For simplicity, take the most frequent character from each group
    let result = '';
    let totalConfidence = 0;
    const alternatives: string[] = [];

    for (const group of candidateGroups) {
      if (group.length > 0) {
        // Sort by frequency
        group.sort((a, b) => b.frequency - a.frequency);
        
        result += group[0].characters[0];
        totalConfidence += group[0].frequency;
        
        // Add alternatives
        if (group.length > 1) {
          alternatives.push(group[1].characters[0]);
        }
      }
    }

    const avgConfidence = totalConfidence / candidateGroups.length;

    return {
      text: result,
      confidence: Math.min(avgConfidence, 1.0),
      method: 'pinyin' as any,
      alternatives: alternatives.slice(0, 3)
    };
  }
}