import { LanguageDetectionResult } from '../types';

export class LanguageDetector {
  private scriptPatterns = {
    chinese: /[\u4e00-\u9fff\u3400-\u4dbf]/,
    japanese: /[\u3040-\u309f\u30a0-\u30ff]/,
    korean: /[\uac00-\ud7af\u1100-\u11ff]/,
    arabic: /[\u0600-\u06ff\u0750-\u077f]/,
    thai: /[\u0e00-\u0e7f]/,
    cyrillic: /[\u0400-\u04ff]/,
    latin: /[a-zA-Z]/
  };

  private languageKeywords = {
    chinese: ['的', '是', '在', '我', '有', '他', '这', '中', '不', '了'],
    english: ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are'],
    japanese: ['の', 'は', 'を', 'に', 'が', 'と', 'で', 'て', 'も', 'から']
  };

  detect(text: string, contextHints?: string): LanguageDetectionResult {
    if (!text) {
      return { language: 'unknown', confidence: 0, script: 'unknown' };
    }

    // Check context hints first
    if (contextHints) {
      const hintResult = this.detectFromContext(contextHints);
      if (hintResult.confidence > 0.7) {
        return hintResult;
      }
    }

    // Detect script
    const scriptResult = this.detectScript(text);
    
    // Detect language based on script and content
    const languageResult = this.detectLanguageFromScript(text, scriptResult.script);

    return {
      language: languageResult.language,
      confidence: (scriptResult.confidence + languageResult.confidence) / 2,
      script: scriptResult.script
    };
  }

  private detectScript(text: string): { script: string; confidence: number } {
    const counts: Record<string, number> = {};
    let total = 0;

    // Count characters by script
    for (const char of text) {
      for (const [script, pattern] of Object.entries(this.scriptPatterns)) {
        if (pattern.test(char)) {
          counts[script] = (counts[script] || 0) + 1;
          total++;
          break;
        }
      }
    }

    if (total === 0) {
      return { script: 'unknown', confidence: 0 };
    }

    // Find dominant script
    let maxScript = 'unknown';
    let maxCount = 0;

    for (const [script, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxScript = script;
      }
    }

    return {
      script: maxScript,
      confidence: maxCount / total
    };
  }

  private detectLanguageFromScript(text: string, script: string): { language: string; confidence: number } {
    switch (script) {
      case 'chinese':
        return { language: 'zh', confidence: 0.9 };
      
      case 'japanese':
        // Japanese often mixes scripts
        if (this.scriptPatterns.chinese.test(text)) {
          return { language: 'ja', confidence: 0.8 };
        }
        return { language: 'ja', confidence: 0.95 };
      
      case 'korean':
        return { language: 'ko', confidence: 0.95 };
      
      case 'latin':
        // Need more analysis for Latin script languages
        return this.detectLatinLanguage(text);
      
      case 'cyrillic':
        return { language: 'ru', confidence: 0.8 };
      
      case 'arabic':
        return { language: 'ar', confidence: 0.9 };
      
      default:
        return { language: 'unknown', confidence: 0 };
    }
  }

  private detectLatinLanguage(text: string): { language: string; confidence: number } {
    const words = text.toLowerCase().split(/\s+/);
    const scores: Record<string, number> = {};

    // Check for common words
    for (const [lang, keywords] of Object.entries(this.languageKeywords)) {
      let matches = 0;
      for (const word of words) {
        if (keywords.includes(word)) {
          matches++;
        }
      }
      scores[lang] = matches / words.length;
    }

    // Default to English for Latin script
    let maxLang = 'en';
    let maxScore = 0;

    for (const [lang, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxLang = lang;
      }
    }

    return {
      language: maxLang,
      confidence: Math.min(maxScore * 2, 0.9) // Scale up but cap at 0.9
    };
  }

  private detectFromContext(context: string): LanguageDetectionResult {
    const lowerContext = context.toLowerCase();
    
    // Check for language indicators in context
    const indicators = [
      { pattern: /chinese|中文|汉语/, language: 'zh', script: 'chinese' },
      { pattern: /english|英文|英语/, language: 'en', script: 'latin' },
      { pattern: /japanese|日本語|日文/, language: 'ja', script: 'japanese' },
      { pattern: /korean|한국어|韩文/, language: 'ko', script: 'korean' },
      { pattern: /pinyin|拼音/, language: 'zh', script: 'latin' } // Special case for pinyin
    ];

    for (const indicator of indicators) {
      if (indicator.pattern.test(lowerContext)) {
        return {
          language: indicator.language,
          script: indicator.script,
          confidence: 0.8
        };
      }
    }

    return { language: 'unknown', confidence: 0, script: 'unknown' };
  }
}