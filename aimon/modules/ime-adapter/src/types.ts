export interface KeyEvent {
  key: string;
  timestamp: number;
  modifiers?: string[];
}

export interface KeySequence {
  eventId: string;
  sessionId: string;
  deviceId: string;
  keys: KeyEvent[];
  applicationContext?: string;
  windowTitle?: string;
  language?: string;
}

export interface ReconstructedText {
  text: string;
  confidence: number; // 0.0 to 1.0
  method: ReconstructionMethod;
  alternatives?: string[];
  metadata?: {
    language?: string;
    imeType?: string;
    processingTime?: number;
  };
}

export enum ReconstructionMethod {
  DIRECT = 'direct',           // Direct key mapping
  PINYIN = 'pinyin',          // Pinyin to Chinese
  JAPANESE = 'japanese',       // Japanese IME
  KOREAN = 'korean',          // Korean IME
  CLIPBOARD = 'clipboard',     // Clipboard monitoring
  HYBRID = 'hybrid',          // Multiple methods combined
  ML_PREDICTION = 'ml'        // Machine learning prediction
}

export interface ImeState {
  isComposing: boolean;
  compositionBuffer: string;
  candidateList?: string[];
  selectedCandidate?: number;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  script: string; // latin, chinese, japanese, korean, etc.
}

export interface PinyinCandidate {
  pinyin: string;
  characters: string[];
  frequency: number;
}

export interface TextSegment {
  text: string;
  type: 'latin' | 'cjk' | 'mixed';
  language?: string;
}

export interface ProcessingOptions {
  enableClipboardMonitoring?: boolean;
  enableMLPrediction?: boolean;
  maxAlternatives?: number;
  contextWindowSize?: number;
  confidenceThreshold?: number;
}