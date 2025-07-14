import { 
  KeySequence, 
  ReconstructedText, 
  ReconstructionMethod,
  ImeState,
  ProcessingOptions,
  TextSegment
} from './types';
import { PinyinProcessor } from './processors/PinyinProcessor';
import { DirectKeyMapper } from './processors/DirectKeyMapper';
import { ClipboardMonitor } from './processors/ClipboardMonitor';
import { LanguageDetector } from './utils/LanguageDetector';
import { TextSegmenter } from './utils/TextSegmenter';
import { logger } from './utils/logger';

export class ImeAdapter {
  private pinyinProcessor: PinyinProcessor;
  private directMapper: DirectKeyMapper;
  private clipboardMonitor: ClipboardMonitor;
  private languageDetector: LanguageDetector;
  private textSegmenter: TextSegmenter;
  private imeState: Map<string, ImeState> = new Map();

  constructor(options: ProcessingOptions = {}) {
    this.pinyinProcessor = new PinyinProcessor();
    this.directMapper = new DirectKeyMapper();
    this.clipboardMonitor = new ClipboardMonitor();
    this.languageDetector = new LanguageDetector();
    this.textSegmenter = new TextSegmenter();

    if (options.enableClipboardMonitoring) {
      this.clipboardMonitor.start();
    }
  }

  async processKeySequence(sequence: KeySequence): Promise<ReconstructedText> {
    const startTime = Date.now();
    
    try {
      // Get or create IME state for this session
      const state = this.getOrCreateState(sequence.sessionId);

      // Detect language and script
      const languageInfo = await this.detectLanguage(sequence);
      
      // Choose processing method based on context
      let result: ReconstructedText;

      if (this.shouldUsePinyin(sequence, languageInfo)) {
        result = await this.processPinyin(sequence, state);
      } else if (this.shouldUseClipboard(sequence)) {
        result = await this.processWithClipboard(sequence);
      } else {
        result = await this.processDirect(sequence);
      }

      // Add metadata
      result.metadata = {
        ...result.metadata,
        language: languageInfo.language,
        processingTime: Date.now() - startTime
      };

      logger.debug(`Processed key sequence: ${result.text} (${result.method})`);
      return result;

    } catch (error) {
      logger.error('Error processing key sequence:', error);
      
      // Fallback to direct mapping
      return {
        text: this.directMapper.mapKeys(sequence.keys),
        confidence: 0.3,
        method: ReconstructionMethod.DIRECT,
        metadata: {
          processingTime: Date.now() - startTime,
          error: error.message
        }
      };
    }
  }

  private async processPinyin(
    sequence: KeySequence, 
    state: ImeState
  ): Promise<ReconstructedText> {
    // Extract potential pinyin sequences
    const segments = this.textSegmenter.segment(
      this.directMapper.mapKeys(sequence.keys)
    );

    let reconstructedText = '';
    let totalConfidence = 0;
    const alternatives: string[] = [];

    for (const segment of segments) {
      if (segment.type === 'latin') {
        // Check if this could be pinyin
        const pinyinResult = await this.pinyinProcessor.process(segment.text);
        
        if (pinyinResult.confidence > 0.7) {
          reconstructedText += pinyinResult.text;
          totalConfidence += pinyinResult.confidence;
          
          if (pinyinResult.alternatives) {
            alternatives.push(...pinyinResult.alternatives);
          }
        } else {
          // Keep as Latin text
          reconstructedText += segment.text;
          totalConfidence += 0.9;
        }
      } else {
        // Already CJK characters
        reconstructedText += segment.text;
        totalConfidence += 1.0;
      }
    }

    const avgConfidence = totalConfidence / segments.length;

    return {
      text: reconstructedText,
      confidence: avgConfidence,
      method: ReconstructionMethod.PINYIN,
      alternatives: alternatives.slice(0, 3),
      metadata: {
        imeType: 'pinyin'
      }
    };
  }

  private async processWithClipboard(sequence: KeySequence): Promise<ReconstructedText> {
    // Check if we have recent clipboard data that matches
    const clipboardData = this.clipboardMonitor.getRecentData(
      sequence.keys[0].timestamp,
      sequence.keys[sequence.keys.length - 1].timestamp
    );

    if (clipboardData && clipboardData.length > 0) {
      // Try to match clipboard content with key sequence timing
      const matchedText = this.matchClipboardWithKeys(sequence, clipboardData);
      
      if (matchedText) {
        return {
          text: matchedText,
          confidence: 0.85,
          method: ReconstructionMethod.CLIPBOARD,
          metadata: {
            imeType: 'clipboard-assisted'
          }
        };
      }
    }

    // Fallback to direct mapping
    return this.processDirect(sequence);
  }

  private async processDirect(sequence: KeySequence): Promise<ReconstructedText> {
    const text = this.directMapper.mapKeys(sequence.keys);
    
    return {
      text,
      confidence: 0.95,
      method: ReconstructionMethod.DIRECT,
      metadata: {
        imeType: 'direct'
      }
    };
  }

  private shouldUsePinyin(sequence: KeySequence, languageInfo: any): boolean {
    // Check various indicators for Chinese input
    if (languageInfo.language === 'zh' || languageInfo.script === 'chinese') {
      return true;
    }

    // Check application context
    if (sequence.applicationContext?.toLowerCase().includes('pinyin') ||
        sequence.applicationContext?.toLowerCase().includes('chinese')) {
      return true;
    }

    // Check if keys look like pinyin
    const text = this.directMapper.mapKeys(sequence.keys);
    return this.pinyinProcessor.looksLikePinyin(text);
  }

  private shouldUseClipboard(sequence: KeySequence): boolean {
    // Check for Ctrl+V or Cmd+V patterns
    return sequence.keys.some(key => 
      key.key === 'v' && 
      (key.modifiers?.includes('Control') || key.modifiers?.includes('Meta'))
    );
  }

  private async detectLanguage(sequence: KeySequence) {
    // Use window title and application context as hints
    const contextHints = [
      sequence.windowTitle,
      sequence.applicationContext
    ].filter(Boolean).join(' ');

    const directText = this.directMapper.mapKeys(sequence.keys);
    
    return this.languageDetector.detect(directText, contextHints);
  }

  private matchClipboardWithKeys(
    sequence: KeySequence, 
    clipboardData: any[]
  ): string | null {
    // Simple matching logic - can be enhanced
    const keyTimestamps = sequence.keys.map(k => k.timestamp);
    const timeRange = {
      start: Math.min(...keyTimestamps),
      end: Math.max(...keyTimestamps)
    };

    for (const clip of clipboardData) {
      if (clip.timestamp >= timeRange.start && 
          clip.timestamp <= timeRange.end + 1000) {
        return clip.text;
      }
    }

    return null;
  }

  private getOrCreateState(sessionId: string): ImeState {
    if (!this.imeState.has(sessionId)) {
      this.imeState.set(sessionId, {
        isComposing: false,
        compositionBuffer: ''
      });
    }
    return this.imeState.get(sessionId)!;
  }

  cleanup() {
    this.clipboardMonitor.stop();
    this.imeState.clear();
  }
}