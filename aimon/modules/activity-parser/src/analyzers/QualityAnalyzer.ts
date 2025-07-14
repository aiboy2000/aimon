import { RawActivity } from '../types';
import { logger } from '../utils/logger';

export interface QualityThresholds {
  min_confidence: number;
  min_text_length: number;
  max_idle_duration: number;
}

export class QualityAnalyzer {
  private thresholds: QualityThresholds;
  private qualityScores: number[] = [];
  private anomalyPatterns: RegExp[] = [];

  constructor(thresholds: QualityThresholds) {
    this.thresholds = thresholds;
    this.initializeAnomalyPatterns();
  }

  analyze(activity: RawActivity): number {
    const scores: number[] = [];

    // Data completeness score
    scores.push(this.calculateCompletenessScore(activity));

    // Text quality score
    if (activity.processed_text) {
      scores.push(this.calculateTextQualityScore(activity.processed_text));
    }

    // Context quality score
    if (activity.context) {
      scores.push(this.calculateContextScore(activity.context));
    }

    // Temporal consistency score
    scores.push(this.calculateTemporalScore(activity));

    // Anomaly detection
    const anomalyScore = this.detectAnomalies(activity);
    scores.push(anomalyScore);

    // Calculate weighted average
    const weights = [0.2, 0.3, 0.2, 0.2, 0.1];
    let totalScore = 0;
    let totalWeight = 0;

    for (let i = 0; i < scores.length; i++) {
      if (scores[i] !== undefined) {
        totalScore += scores[i] * (weights[i] || 0.2);
        totalWeight += weights[i] || 0.2;
      }
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // Record score for statistics
    this.qualityScores.push(finalScore);
    if (this.qualityScores.length > 1000) {
      this.qualityScores.shift();
    }

    return finalScore;
  }

  private calculateCompletenessScore(activity: RawActivity): number {
    let score = 0;
    let fields = 0;

    // Required fields
    if (activity.id) { score += 1; fields += 1; }
    if (activity.timestamp) { score += 1; fields += 1; }
    if (activity.device_id) { score += 1; fields += 1; }
    if (activity.session_id) { score += 1; fields += 1; }
    if (activity.type) { score += 1; fields += 1; }

    // Optional but important fields
    if (activity.data && Object.keys(activity.data).length > 0) { 
      score += 0.5; fields += 0.5; 
    }
    if (activity.processed_text) { score += 0.5; fields += 0.5; }
    if (activity.context) { score += 0.5; fields += 0.5; }

    return fields > 0 ? score / fields : 0;
  }

  private calculateTextQualityScore(text: string): number {
    if (!text) return 0;

    let score = 1.0;

    // Length check
    if (text.length < this.thresholds.min_text_length) {
      score *= 0.5;
    }

    // Check for meaningful content
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 3) {
      score *= 0.7;
    }

    // Check for repetitive patterns
    if (this.hasRepetitivePattern(text)) {
      score *= 0.6;
    }

    // Check for gibberish
    if (this.looksLikeGibberish(text)) {
      score *= 0.3;
    }

    // Check for proper language structure
    if (this.hasProperStructure(text)) {
      score *= 1.2;
    }

    return Math.min(1.0, score);
  }

  private calculateContextScore(context: any): number {
    let score = 0;
    let fields = 0;

    if (context.application) { score += 1; fields += 1; }
    if (context.window_title) { score += 1; fields += 1; }
    if (context.process_name) { score += 0.5; fields += 0.5; }
    if (context.url) { score += 0.5; fields += 0.5; }

    // Validate URL if present
    if (context.url && !this.isValidUrl(context.url)) {
      score -= 0.5;
    }

    return fields > 0 ? Math.max(0, score / fields) : 0;
  }

  private calculateTemporalScore(activity: RawActivity): number {
    if (!activity.timestamp) return 0;

    const now = Date.now();
    const activityTime = activity.timestamp;

    // Check if timestamp is reasonable (not in future, not too old)
    if (activityTime > now) {
      return 0.3; // Future timestamp
    }

    const age = now - activityTime;
    if (age > 24 * 60 * 60 * 1000) { // Older than 24 hours
      return 0.7;
    }

    return 1.0;
  }

  private detectAnomalies(activity: RawActivity): number {
    let anomalyCount = 0;

    // Check text for anomaly patterns
    if (activity.processed_text) {
      for (const pattern of this.anomalyPatterns) {
        if (pattern.test(activity.processed_text)) {
          anomalyCount++;
        }
      }
    }

    // Check for suspicious patterns
    if (activity.type === 'keyboard' && activity.data) {
      // Extremely high typing speed
      if (activity.data.keys_per_second > 20) {
        anomalyCount++;
      }
    }

    // Check for data inconsistencies
    if (activity.type === 'mouse' && activity.processed_text) {
      // Mouse activity shouldn't have processed text
      anomalyCount++;
    }

    return anomalyCount === 0 ? 1.0 : Math.max(0.3, 1.0 - (anomalyCount * 0.2));
  }

  private hasRepetitivePattern(text: string): boolean {
    // Check for repeated characters
    if (/(.)\1{4,}/.test(text)) return true;

    // Check for repeated words
    const words = text.split(/\s+/);
    const wordSet = new Set(words);
    if (words.length > 5 && wordSet.size < words.length * 0.5) {
      return true;
    }

    return false;
  }

  private looksLikeGibberish(text: string): boolean {
    // Check for random character sequences
    const consonantClusters = /[bcdfghjklmnpqrstvwxyz]{5,}/i;
    if (consonantClusters.test(text)) return true;

    // Check for lack of vowels
    const vowelRatio = (text.match(/[aeiou]/gi) || []).length / text.length;
    if (vowelRatio < 0.1) return true;

    return false;
  }

  private hasProperStructure(text: string): boolean {
    // Check for sentence-like structure
    const hasPunctuation = /[.!?]/.test(text);
    const hasCapitalization = /^[A-Z]/.test(text);
    const hasSpaces = /\s/.test(text);

    return hasPunctuation || (hasCapitalization && hasSpaces);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private initializeAnomalyPatterns(): void {
    this.anomalyPatterns = [
      /password|passwd|pwd/i,
      /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN pattern
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email
      /\b(?:\d{4}[-\s]?){3}\d{4}\b/, // Credit card
      /-----BEGIN.*KEY-----/,  // Private keys
    ];
  }

  updateThresholds(thresholds: Partial<QualityThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  getAverageQuality(): number {
    if (this.qualityScores.length === 0) return 0;
    
    const sum = this.qualityScores.reduce((a, b) => a + b, 0);
    return sum / this.qualityScores.length;
  }

  getQualityDistribution(): Record<string, number> {
    const distribution = {
      excellent: 0,  // >= 0.9
      good: 0,       // >= 0.7
      fair: 0,       // >= 0.5
      poor: 0        // < 0.5
    };

    for (const score of this.qualityScores) {
      if (score >= 0.9) distribution.excellent++;
      else if (score >= 0.7) distribution.good++;
      else if (score >= 0.5) distribution.fair++;
      else distribution.poor++;
    }

    return distribution;
  }
}