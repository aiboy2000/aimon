import { 
  ParsedActivity, 
  SummaryMetrics, 
  TimePeriod, 
  ActivityCategory, 
  ActivityType,
  ApplicationMetric 
} from '../types';

export class MetricsCalculator {
  
  calculate(activities: ParsedActivity[], period: TimePeriod): SummaryMetrics {
    const metrics: SummaryMetrics = {
      total_activities: activities.length,
      active_time: 0,
      idle_time: 0,
      productivity_score: 0,
      focus_score: 0,
      distraction_ratio: 0,
      top_applications: [],
      category_breakdown: this.initializeCategoryBreakdown(),
      type_breakdown: this.initializeTypeBreakdown()
    };

    if (activities.length === 0) {
      return metrics;
    }

    // Calculate time metrics
    this.calculateTimeMetrics(activities, metrics, period);

    // Calculate application metrics
    this.calculateApplicationMetrics(activities, metrics);

    // Calculate productivity and focus scores
    this.calculateProductivityScore(metrics);
    this.calculateFocusScore(activities, metrics);

    // Calculate distraction ratio
    this.calculateDistractionRatio(metrics);

    return metrics;
  }

  private calculateTimeMetrics(
    activities: ParsedActivity[], 
    metrics: SummaryMetrics, 
    period: TimePeriod
  ): void {
    for (const activity of activities) {
      const duration = activity.duration || 0;

      if (activity.type === ActivityType.IDLE) {
        metrics.idle_time += duration;
      } else {
        metrics.active_time += duration;
      }

      // Category breakdown
      metrics.category_breakdown[activity.category] += duration;

      // Type breakdown
      metrics.type_breakdown[activity.type] += duration;
    }

    // Calculate remaining idle time if period is longer than tracked time
    const totalTrackedTime = metrics.active_time + metrics.idle_time;
    const periodDuration = period.end.getTime() - period.start.getTime();
    
    if (totalTrackedTime < periodDuration) {
      metrics.idle_time += periodDuration - totalTrackedTime;
    }
  }

  private calculateApplicationMetrics(
    activities: ParsedActivity[], 
    metrics: SummaryMetrics
  ): void {
    const appMap = new Map<string, {
      time_spent: number;
      activity_count: number;
      categories: Set<ActivityCategory>;
      productive_time: number;
    }>();

    // Aggregate by application
    for (const activity of activities) {
      const app = activity.application;
      const duration = activity.duration || 0;

      if (!appMap.has(app)) {
        appMap.set(app, {
          time_spent: 0,
          activity_count: 0,
          categories: new Set(),
          productive_time: 0
        });
      }

      const appData = appMap.get(app)!;
      appData.time_spent += duration;
      appData.activity_count++;
      appData.categories.add(activity.category);

      if (activity.category === ActivityCategory.PRODUCTIVE || 
          activity.category === ActivityCategory.LEARNING) {
        appData.productive_time += duration;
      }
    }

    // Convert to ApplicationMetric array
    metrics.top_applications = Array.from(appMap.entries())
      .map(([name, data]) => ({
        name,
        time_spent: data.time_spent,
        activity_count: data.activity_count,
        category: this.getDominantCategory(data.categories),
        productivity_contribution: data.productive_time / data.time_spent
      }))
      .sort((a, b) => b.time_spent - a.time_spent);
  }

  private calculateProductivityScore(metrics: SummaryMetrics): void {
    const totalActiveTime = metrics.active_time;
    if (totalActiveTime === 0) {
      metrics.productivity_score = 0;
      return;
    }

    const productiveTime = 
      metrics.category_breakdown[ActivityCategory.PRODUCTIVE] +
      metrics.category_breakdown[ActivityCategory.LEARNING] +
      (metrics.category_breakdown[ActivityCategory.COMMUNICATION] * 0.7); // Communication partially productive

    metrics.productivity_score = Math.min(100, (productiveTime / totalActiveTime) * 100);
  }

  private calculateFocusScore(activities: ParsedActivity[], metrics: SummaryMetrics): void {
    if (activities.length === 0) {
      metrics.focus_score = 0;
      return;
    }

    // Calculate app switching frequency
    const appSwitches = this.countAppSwitches(activities);
    const maxSwitches = activities.length; // Worst case: switch every activity
    const switchRatio = appSwitches / maxSwitches;

    // Calculate session continuity
    const avgSessionLength = this.calculateAverageSessionLength(activities);
    const sessionScore = Math.min(100, avgSessionLength / 600000 * 100); // 10 minutes = 100%

    // Calculate focus score (lower switching + longer sessions = higher focus)
    metrics.focus_score = Math.max(0, 
      (100 - (switchRatio * 50)) * 0.6 + sessionScore * 0.4
    );
  }

  private calculateDistractionRatio(metrics: SummaryMetrics): void {
    const totalActiveTime = metrics.active_time;
    if (totalActiveTime === 0) {
      metrics.distraction_ratio = 0;
      return;
    }

    const distractingTime = 
      metrics.category_breakdown[ActivityCategory.DISTRACTING] +
      metrics.category_breakdown[ActivityCategory.ENTERTAINMENT];

    metrics.distraction_ratio = distractingTime / totalActiveTime;
  }

  private countAppSwitches(activities: ParsedActivity[]): number {
    let switches = 0;
    let lastApp = '';

    for (const activity of activities) {
      if (activity.application !== lastApp) {
        switches++;
        lastApp = activity.application;
      }
    }

    return Math.max(0, switches - 1); // First "switch" doesn't count
  }

  private calculateAverageSessionLength(activities: ParsedActivity[]): number {
    const sessions = new Map<string, number>();
    let currentApp = '';
    let sessionStart = 0;

    for (const activity of activities) {
      if (activity.application !== currentApp) {
        // End previous session
        if (currentApp && sessionStart > 0) {
          const sessionLength = activity.timestamp.getTime() - sessionStart;
          sessions.set(currentApp, (sessions.get(currentApp) || 0) + sessionLength);
        }

        // Start new session
        currentApp = activity.application;
        sessionStart = activity.timestamp.getTime();
      }
    }

    if (sessions.size === 0) return 0;

    const totalTime = Array.from(sessions.values()).reduce((sum, time) => sum + time, 0);
    return totalTime / sessions.size;
  }

  private getDominantCategory(categories: Set<ActivityCategory>): ActivityCategory {
    // Priority order for determining dominant category
    const priority = [
      ActivityCategory.PRODUCTIVE,
      ActivityCategory.LEARNING,
      ActivityCategory.COMMUNICATION,
      ActivityCategory.NEUTRAL,
      ActivityCategory.ENTERTAINMENT,
      ActivityCategory.DISTRACTING,
      ActivityCategory.BREAK
    ];

    for (const category of priority) {
      if (categories.has(category)) {
        return category;
      }
    }

    return ActivityCategory.NEUTRAL;
  }

  private initializeCategoryBreakdown(): Record<ActivityCategory, number> {
    return {
      [ActivityCategory.PRODUCTIVE]: 0,
      [ActivityCategory.NEUTRAL]: 0,
      [ActivityCategory.DISTRACTING]: 0,
      [ActivityCategory.BREAK]: 0,
      [ActivityCategory.COMMUNICATION]: 0,
      [ActivityCategory.LEARNING]: 0,
      [ActivityCategory.ENTERTAINMENT]: 0
    };
  }

  private initializeTypeBreakdown(): Record<ActivityType, number> {
    return {
      [ActivityType.TYPING]: 0,
      [ActivityType.CLICKING]: 0,
      [ActivityType.SCROLLING]: 0,
      [ActivityType.READING]: 0,
      [ActivityType.CODING]: 0,
      [ActivityType.BROWSING]: 0,
      [ActivityType.COMMUNICATING]: 0,
      [ActivityType.DOCUMENTING]: 0,
      [ActivityType.IDLE]: 0
    };
  }

  // Utility methods for specific metric calculations
  calculateProductivityTrend(metricsHistory: SummaryMetrics[]): number {
    if (metricsHistory.length < 2) return 0;

    const recent = metricsHistory.slice(-3); // Last 3 periods
    const older = metricsHistory.slice(-6, -3); // Previous 3 periods

    const recentAvg = recent.reduce((sum, m) => sum + m.productivity_score, 0) / recent.length;
    const olderAvg = older.length > 0 ? 
      older.reduce((sum, m) => sum + m.productivity_score, 0) / older.length : recentAvg;

    return recentAvg - olderAvg; // Positive = improving, negative = declining
  }

  calculateEfficiencyScore(metrics: SummaryMetrics): number {
    // Efficiency = productivity per unit of active time
    const totalActiveHours = metrics.active_time / 3600000; // Convert to hours
    if (totalActiveHours === 0) return 0;

    const baseEfficiency = metrics.productivity_score / totalActiveHours;
    const focusBonus = metrics.focus_score / 100;
    const distractionPenalty = metrics.distraction_ratio;

    return Math.max(0, baseEfficiency * (1 + focusBonus - distractionPenalty));
  }
}