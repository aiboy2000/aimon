import { 
  ParsedActivity, 
  SummaryMetrics, 
  SummaryInsights, 
  ActivityCategory, 
  ActivityType,
  ContextData 
} from '../types';

export class InsightsGenerator {

  async generate(
    activities: ParsedActivity[], 
    metrics: SummaryMetrics, 
    context: ContextData
  ): Promise<SummaryInsights> {
    const insights: SummaryInsights = {
      productive_patterns: [],
      time_wasters: [],
      efficiency_tips: [],
      goal_progress: [],
      mood_indicators: []
    };

    // Generate productive patterns
    insights.productive_patterns = this.identifyProductivePatterns(activities, metrics);

    // Identify time wasters
    insights.time_wasters = this.identifyTimeWasters(activities, metrics);

    // Generate efficiency tips
    insights.efficiency_tips = this.generateEfficiencyTips(metrics, context);

    // Calculate goal progress if goals exist
    if (context.user_goals.length > 0) {
      insights.goal_progress = this.calculateGoalProgress(activities, metrics, context);
    }

    // Detect mood indicators
    insights.mood_indicators = this.detectMoodIndicators(activities, metrics);

    return insights;
  }

  private identifyProductivePatterns(
    activities: ParsedActivity[], 
    metrics: SummaryMetrics
  ): string[] {
    const patterns: string[] = [];

    // High productivity periods
    if (metrics.productivity_score > 80) {
      patterns.push('Maintained excellent productivity above 80%');
    } else if (metrics.productivity_score > 60) {
      patterns.push('Demonstrated good productivity levels');
    }

    // Focus patterns
    if (metrics.focus_score > 75) {
      patterns.push('Showed strong focus with minimal app switching');
    }

    // Deep work sessions
    const longSessions = this.findLongWorkSessions(activities);
    if (longSessions.length > 0) {
      const avgDuration = longSessions.reduce((sum, s) => sum + s.duration, 0) / longSessions.length;
      patterns.push(`Completed ${longSessions.length} deep work sessions averaging ${this.formatDuration(avgDuration)}`);
    }

    // Productive applications
    const topProductiveApps = metrics.top_applications
      .filter(app => app.category === ActivityCategory.PRODUCTIVE)
      .slice(0, 2);
    
    if (topProductiveApps.length > 0) {
      patterns.push(`Most productive with ${topProductiveApps.map(app => app.name).join(' and ')}`);
    }

    // Coding patterns
    const codingTime = metrics.type_breakdown[ActivityType.CODING];
    if (codingTime > 1800000) { // More than 30 minutes
      patterns.push(`Significant coding activity: ${this.formatDuration(codingTime)}`);
    }

    return patterns.slice(0, 5);
  }

  private identifyTimeWasters(
    activities: ParsedActivity[], 
    metrics: SummaryMetrics
  ): string[] {
    const timeWasters: string[] = [];

    // Distracting applications
    const distractingApps = metrics.top_applications
      .filter(app => 
        app.category === ActivityCategory.DISTRACTING && 
        app.time_spent > 600000 // More than 10 minutes
      );

    distractingApps.forEach(app => {
      timeWasters.push(`${app.name}: ${this.formatDuration(app.time_spent)}`);
    });

    // Entertainment overuse
    const entertainmentTime = metrics.category_breakdown[ActivityCategory.ENTERTAINMENT];
    if (entertainmentTime > 1800000) { // More than 30 minutes
      timeWasters.push(`Entertainment activities: ${this.formatDuration(entertainmentTime)}`);
    }

    // Excessive app switching
    if (metrics.focus_score < 40) {
      timeWasters.push('Frequent application switching reducing focus');
    }

    // Idle time patterns
    if (metrics.idle_time > metrics.active_time) {
      timeWasters.push('Extended periods of inactivity');
    }

    return timeWasters.slice(0, 4);
  }

  private generateEfficiencyTips(
    metrics: SummaryMetrics, 
    context: ContextData
  ): string[] {
    const tips: string[] = [];

    // Productivity-based tips
    if (metrics.productivity_score < 50) {
      tips.push('Focus on core productive tasks and minimize distractions');
      tips.push('Consider using focus tools or blocking distracting websites');
    } else if (metrics.productivity_score < 70) {
      tips.push('Good productivity - try extending focused work sessions');
    }

    // Focus-based tips
    if (metrics.focus_score < 50) {
      tips.push('Reduce app switching by batching similar tasks together');
      tips.push('Use the Pomodoro technique for better focus management');
    }

    // Time management tips
    const totalTime = metrics.active_time + metrics.idle_time;
    const activeRatio = metrics.active_time / totalTime;
    
    if (activeRatio < 0.6) {
      tips.push('Increase active work time by setting regular work intervals');
    }

    // Application-specific tips
    const topApp = metrics.top_applications[0];
    if (topApp && topApp.category === ActivityCategory.DISTRACTING) {
      tips.push(`Consider limiting time spent in ${topApp.name}`);
    }

    // Break patterns
    const breakTime = metrics.category_breakdown[ActivityCategory.BREAK];
    if (breakTime < 600000) { // Less than 10 minutes
      tips.push('Take more regular breaks to maintain productivity');
    } else if (breakTime > 3600000) { // More than 1 hour
      tips.push('Consider shorter, more frequent breaks instead of long ones');
    }

    // Context-based tips
    if (context.user_preferences.focus_areas.length > 0) {
      const focusArea = context.user_preferences.focus_areas[0];
      tips.push(`Allocate more dedicated time to ${focusArea} tasks`);
    }

    return tips.slice(0, 5);
  }

  private calculateGoalProgress(
    activities: ParsedActivity[], 
    metrics: SummaryMetrics,
    context: ContextData
  ): any[] {
    const progress: any[] = [];

    context.user_goals.forEach(goal => {
      let achieved = 0;

      switch (goal.metric_type) {
        case 'time':
          // Find time spent on goal-related activities
          achieved = this.calculateGoalTimeProgress(activities, goal);
          break;
        case 'count':
          // Count activities related to goal
          achieved = this.calculateGoalCountProgress(activities, goal);
          break;
        case 'percentage':
          // Calculate percentage-based progress
          achieved = this.calculateGoalPercentageProgress(metrics, goal);
          break;
      }

      const progressPercentage = Math.min(100, (achieved / goal.target_value) * 100);
      const status = this.determineGoalStatus(progressPercentage, goal);

      progress.push({
        goal_id: goal.id,
        goal_name: goal.name,
        target: goal.target_value,
        achieved,
        progress_percentage: progressPercentage,
        status
      });
    });

    return progress;
  }

  private calculateGoalTimeProgress(activities: ParsedActivity[], goal: any): number {
    // Match activities to goal based on keywords or applications
    const relevantActivities = activities.filter(activity => {
      const text = activity.content.text?.toLowerCase() || '';
      const app = activity.application.toLowerCase();
      
      return goal.keywords?.some((keyword: string) => 
        text.includes(keyword.toLowerCase()) || app.includes(keyword.toLowerCase())
      ) || false;
    });

    return relevantActivities.reduce((total, activity) => 
      total + (activity.duration || 0), 0
    );
  }

  private calculateGoalCountProgress(activities: ParsedActivity[], goal: any): number {
    return activities.filter(activity => {
      const text = activity.content.text?.toLowerCase() || '';
      return goal.keywords?.some((keyword: string) => 
        text.includes(keyword.toLowerCase())
      ) || false;
    }).length;
  }

  private calculateGoalPercentageProgress(metrics: SummaryMetrics, goal: any): number {
    // This would depend on the specific goal type
    if (goal.name.toLowerCase().includes('productivity')) {
      return metrics.productivity_score;
    }
    if (goal.name.toLowerCase().includes('focus')) {
      return metrics.focus_score;
    }
    return 0;
  }

  private determineGoalStatus(progress: number, goal: any): string {
    if (progress >= 100) return 'completed';
    if (progress >= 80) return 'ahead';
    if (progress >= 60) return 'on_track';
    return 'behind';
  }

  private detectMoodIndicators(
    activities: ParsedActivity[], 
    metrics: SummaryMetrics
  ): string[] {
    const indicators: string[] = [];

    // High productivity might indicate good mood
    if (metrics.productivity_score > 80) {
      indicators.push('High energy and motivation');
    } else if (metrics.productivity_score < 30) {
      indicators.push('Possible low energy or distraction');
    }

    // High distraction might indicate stress or boredom
    if (metrics.distraction_ratio > 0.4) {
      indicators.push('High distraction levels - possible stress or boredom');
    }

    // Communication patterns
    const commTime = metrics.category_breakdown[ActivityCategory.COMMUNICATION];
    if (commTime > 3600000) { // More than 1 hour
      indicators.push('High communication activity - collaborative mood');
    } else if (commTime < 300000) { // Less than 5 minutes
      indicators.push('Minimal communication - focused individual work');
    }

    // Break patterns
    const breakTime = metrics.category_breakdown[ActivityCategory.BREAK];
    if (breakTime > 2400000) { // More than 40 minutes
      indicators.push('Extended breaks - possible fatigue or avoidance');
    }

    return indicators.slice(0, 3);
  }

  private findLongWorkSessions(activities: ParsedActivity[]): Array<{app: string, duration: number}> {
    const sessions: Array<{app: string, duration: number}> = [];
    let currentSession = { app: '', duration: 0, start: 0 };

    for (const activity of activities) {
      if (activity.category === ActivityCategory.PRODUCTIVE) {
        if (currentSession.app === activity.application) {
          currentSession.duration += activity.duration || 0;
        } else {
          // Save previous session if it was long enough
          if (currentSession.duration > 1800000) { // 30 minutes
            sessions.push({
              app: currentSession.app,
              duration: currentSession.duration
            });
          }
          
          // Start new session
          currentSession = {
            app: activity.application,
            duration: activity.duration || 0,
            start: activity.timestamp.getTime()
          };
        }
      } else {
        // Non-productive activity breaks the session
        if (currentSession.duration > 1800000) {
          sessions.push({
            app: currentSession.app,
            duration: currentSession.duration
          });
        }
        currentSession = { app: '', duration: 0, start: 0 };
      }
    }

    // Check final session
    if (currentSession.duration > 1800000) {
      sessions.push({
        app: currentSession.app,
        duration: currentSession.duration
      });
    }

    return sessions;
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}