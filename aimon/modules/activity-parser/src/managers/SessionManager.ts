import { ParsedActivity, SessionData, SessionSummary, ActivityType, ActivityCategory } from '../types';
import { logger } from '../utils/logger';

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private activityBuffer: Map<string, ParsedActivity[]> = new Map();
  private readonly MAX_IDLE_TIME = 5 * 60 * 1000; // 5 minutes

  async addActivity(activity: ParsedActivity): Promise<void> {
    const sessionId = activity.session_id;
    
    // Get or create session
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.createSession(activity);
      this.sessions.set(sessionId, session);
    }

    // Add activity to session
    session.activities.push(activity);

    // Update session end time
    if (!session.end_time || activity.timestamp > session.end_time) {
      session.end_time = activity.timestamp;
    }

    // Add to buffer for duration calculation
    this.bufferActivity(sessionId, activity);
  }

  async calculateDuration(activity: ParsedActivity): Promise<number | null> {
    const sessionId = activity.session_id;
    const buffer = this.activityBuffer.get(sessionId) || [];

    if (buffer.length < 2) {
      return null;
    }

    // Find the previous activity
    const currentIndex = buffer.findIndex(a => a.id === activity.id);
    if (currentIndex <= 0) {
      return null;
    }

    const previousActivity = buffer[currentIndex - 1];
    const duration = activity.timestamp.getTime() - previousActivity.timestamp.getTime();

    // Check if duration is reasonable
    if (duration > 0 && duration < this.MAX_IDLE_TIME) {
      return duration;
    }

    return null;
  }

  async getSessionSummary(sessionId: string): Promise<SessionSummary | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const activities = session.activities;
    if (activities.length === 0) {
      return null;
    }

    // Calculate durations
    const totalDuration = session.end_time 
      ? session.end_time.getTime() - session.start_time.getTime()
      : 0;

    let activeDuration = 0;
    let idleDuration = 0;

    // Calculate activity and category breakdowns
    const activityBreakdown: Record<ActivityType, number> = {} as any;
    const categoryBreakdown: Record<ActivityCategory, number> = {} as any;
    const applicationDurations = new Map<string, number>();

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      const duration = activity.duration || 0;

      // Activity type breakdown
      activityBreakdown[activity.type] = 
        (activityBreakdown[activity.type] || 0) + duration;

      // Category breakdown
      categoryBreakdown[activity.category] = 
        (categoryBreakdown[activity.category] || 0) + duration;

      // Application breakdown
      const appDuration = applicationDurations.get(activity.application) || 0;
      applicationDurations.set(activity.application, appDuration + duration);

      // Active vs idle time
      if (activity.type === ActivityType.IDLE) {
        idleDuration += duration;
      } else {
        activeDuration += duration;
      }
    }

    // Get top applications
    const topApplications = Array.from(applicationDurations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, duration]) => ({
        name,
        duration,
        activity_count: activities.filter(a => a.application === name).length,
        category: this.getApplicationCategory(activities, name)
      }));

    // Calculate productivity score
    const productivityScore = this.calculateProductivityScore(
      categoryBreakdown,
      activeDuration,
      totalDuration
    );

    return {
      total_duration: totalDuration,
      active_duration: activeDuration,
      idle_duration: idleDuration,
      activity_breakdown: activityBreakdown,
      category_breakdown: categoryBreakdown,
      top_applications: topApplications,
      productivity_score: productivityScore
    };
  }

  private createSession(activity: ParsedActivity): SessionData {
    return {
      session_id: activity.session_id,
      device_id: activity.device_id,
      start_time: activity.timestamp,
      activities: []
    };
  }

  private bufferActivity(sessionId: string, activity: ParsedActivity): void {
    let buffer = this.activityBuffer.get(sessionId);
    if (!buffer) {
      buffer = [];
      this.activityBuffer.set(sessionId, buffer);
    }

    buffer.push(activity);

    // Keep buffer size reasonable
    if (buffer.length > 100) {
      buffer.shift();
    }
  }

  private getApplicationCategory(activities: ParsedActivity[], appName: string): ActivityCategory {
    const appActivities = activities.filter(a => a.application === appName);
    if (appActivities.length === 0) {
      return ActivityCategory.NEUTRAL;
    }

    // Return most common category for this app
    const categoryCounts = new Map<ActivityCategory, number>();
    for (const activity of appActivities) {
      const count = categoryCounts.get(activity.category) || 0;
      categoryCounts.set(activity.category, count + 1);
    }

    let maxCount = 0;
    let dominantCategory = ActivityCategory.NEUTRAL;
    for (const [category, count] of categoryCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantCategory = category;
      }
    }

    return dominantCategory;
  }

  private calculateProductivityScore(
    categoryBreakdown: Record<ActivityCategory, number>,
    activeDuration: number,
    totalDuration: number
  ): number {
    if (totalDuration === 0) return 0;

    const weights = {
      [ActivityCategory.PRODUCTIVE]: 1.0,
      [ActivityCategory.LEARNING]: 0.9,
      [ActivityCategory.COMMUNICATION]: 0.7,
      [ActivityCategory.NEUTRAL]: 0.5,
      [ActivityCategory.BREAK]: 0.4,
      [ActivityCategory.ENTERTAINMENT]: 0.2,
      [ActivityCategory.DISTRACTING]: 0.0
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [category, duration] of Object.entries(categoryBreakdown)) {
      const weight = weights[category as ActivityCategory] || 0.5;
      weightedSum += weight * duration;
      totalWeight += duration;
    }

    if (totalWeight === 0) return 0;

    // Base score from weighted categories
    let score = (weightedSum / totalWeight) * 100;

    // Bonus for high active time ratio
    const activeRatio = activeDuration / totalDuration;
    if (activeRatio > 0.8) {
      score *= 1.1;
    } else if (activeRatio < 0.5) {
      score *= 0.9;
    }

    return Math.min(100, Math.max(0, score));
  }

  cleanupOldSessions(maxAge: number): void {
    const cutoffTime = Date.now() - maxAge;

    for (const [sessionId, session] of this.sessions) {
      const sessionAge = session.end_time
        ? session.end_time.getTime()
        : session.start_time.getTime();

      if (sessionAge < cutoffTime) {
        this.sessions.delete(sessionId);
        this.activityBuffer.delete(sessionId);
        logger.info(`Cleaned up old session: ${sessionId}`);
      }
    }
  }

  getTotalActivities(): number {
    let total = 0;
    for (const session of this.sessions.values()) {
      total += session.activities.length;
    }
    return total;
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  exportSessionData(sessionId: string): SessionData | null {
    return this.sessions.get(sessionId) || null;
  }
}