import { 
  ContextData, 
  SummaryRequest, 
  WorkSummary, 
  Goal, 
  UserPreferences, 
  ProjectContext 
} from '../types';
import { logger } from '../utils/logger';

export class ContextProvider {
  private summaryHistory: WorkSummary[] = [];
  private userGoals: Goal[] = [];
  private userPreferences: UserPreferences = this.getDefaultPreferences();
  private projectContext: ProjectContext | undefined;

  async getContext(request: SummaryRequest): Promise<ContextData> {
    const context: ContextData = {
      recent_summaries: await this.getRecentSummaries(request),
      user_goals: await this.getUserGoals(request),
      user_preferences: await this.getUserPreferences(request),
      project_context: await this.getProjectContext(request)
    };

    logger.debug(`Loaded context with ${context.recent_summaries.length} recent summaries and ${context.user_goals.length} goals`);
    return context;
  }

  private async getRecentSummaries(request: SummaryRequest): Promise<WorkSummary[]> {
    // Filter summaries by session/device if specified
    let filtered = this.summaryHistory;

    if (request.session_id) {
      filtered = filtered.filter(s => s.session_id === request.session_id);
    }

    if (request.device_id) {
      filtered = filtered.filter(s => s.device_id === request.device_id);
    }

    // Get recent summaries (last 5)
    return filtered
      .sort((a, b) => b.generated_at.getTime() - a.generated_at.getTime())
      .slice(0, 5);
  }

  private async getUserGoals(request: SummaryRequest): Promise<Goal[]> {
    // Return active goals
    return this.userGoals.filter(goal => goal.status === 'active');
  }

  private async getUserPreferences(request: SummaryRequest): Promise<UserPreferences> {
    // In a real implementation, this would query user settings from database
    return this.userPreferences;
  }

  private async getProjectContext(request: SummaryRequest): Promise<ProjectContext | undefined> {
    return this.projectContext;
  }

  // Methods to update context data

  async addSummaryToHistory(summary: WorkSummary): Promise<void> {
    this.summaryHistory.push(summary);
    
    // Keep only recent summaries (last 50)
    if (this.summaryHistory.length > 50) {
      this.summaryHistory.shift();
    }

    logger.debug(`Added summary ${summary.id} to history`);
  }

  async updateUserGoals(goals: Goal[]): Promise<void> {
    this.userGoals = goals;
    logger.info(`Updated user goals: ${goals.length} goals`);
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    this.userPreferences = { ...this.userPreferences, ...preferences };
    logger.info('Updated user preferences');
  }

  async updateProjectContext(context: ProjectContext): Promise<void> {
    this.projectContext = context;
    logger.info(`Updated project context with ${context.current_projects.length} projects`);
  }

  // Goal management methods

  async addGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
    const newGoal: Goal = {
      ...goal,
      id: this.generateGoalId()
    };

    this.userGoals.push(newGoal);
    logger.info(`Added new goal: ${newGoal.name}`);
    
    return newGoal;
  }

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal | null> {
    const goalIndex = this.userGoals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) return null;

    this.userGoals[goalIndex] = { ...this.userGoals[goalIndex], ...updates };
    logger.info(`Updated goal: ${goalId}`);
    
    return this.userGoals[goalIndex];
  }

  async updateGoalProgress(goalId: string, currentValue: number): Promise<void> {
    const goal = this.userGoals.find(g => g.id === goalId);
    if (goal) {
      goal.current_value = currentValue;
      logger.debug(`Updated progress for goal ${goalId}: ${currentValue}/${goal.target_value}`);
    }
  }

  // Context analysis methods

  getProductivityTrend(): number {
    if (this.summaryHistory.length < 2) return 0;

    const recent = this.summaryHistory.slice(-3);
    const older = this.summaryHistory.slice(-6, -3);

    if (older.length === 0) return 0;

    const recentAvg = recent.reduce((sum, s) => sum + s.metrics.productivity_score, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.metrics.productivity_score, 0) / older.length;

    return recentAvg - olderAvg;
  }

  getCommonPatterns(): string[] {
    const patterns: string[] = [];

    // Analyze common productive apps
    const appFrequency = new Map<string, number>();
    this.summaryHistory.forEach(summary => {
      summary.metrics.top_applications.slice(0, 3).forEach(app => {
        appFrequency.set(app.name, (appFrequency.get(app.name) || 0) + 1);
      });
    });

    const topApps = Array.from(appFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    topApps.forEach(([app, frequency]) => {
      if (frequency >= 3) {
        patterns.push(`Consistently productive with ${app}`);
      }
    });

    // Analyze focus patterns
    const avgFocusScore = this.summaryHistory
      .reduce((sum, s) => sum + s.metrics.focus_score, 0) / this.summaryHistory.length;

    if (avgFocusScore > 75) {
      patterns.push('Strong focus consistency');
    } else if (avgFocusScore < 40) {
      patterns.push('Frequent task switching pattern');
    }

    return patterns;
  }

  getPersonalInsights(): string[] {
    const insights: string[] = [];

    // Peak productivity times
    const hourlyProductivity = new Map<number, number[]>();
    this.summaryHistory.forEach(summary => {
      const hour = summary.period.start.getHours();
      if (!hourlyProductivity.has(hour)) {
        hourlyProductivity.set(hour, []);
      }
      hourlyProductivity.get(hour)!.push(summary.metrics.productivity_score);
    });

    // Find peak hours
    let peakHour = -1;
    let peakScore = 0;
    hourlyProductivity.forEach((scores, hour) => {
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      if (avgScore > peakScore) {
        peakScore = avgScore;
        peakHour = hour;
      }
    });

    if (peakHour !== -1 && peakScore > 60) {
      const hourStr = peakHour === 0 ? '12 AM' : 
                     peakHour < 12 ? `${peakHour} AM` : 
                     peakHour === 12 ? '12 PM' : `${peakHour - 12} PM`;
      insights.push(`Peak productivity around ${hourStr}`);
    }

    // Goal achievement patterns
    const completedGoals = this.userGoals.filter(g => g.status === 'completed').length;
    const totalGoals = this.userGoals.length;
    
    if (totalGoals > 0) {
      const completionRate = (completedGoals / totalGoals) * 100;
      if (completionRate > 80) {
        insights.push('Excellent goal achievement rate');
      } else if (completionRate > 50) {
        insights.push('Good progress on goals');
      } else {
        insights.push('Consider breaking down goals into smaller tasks');
      }
    }

    return insights;
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      summary_frequency: 'daily',
      preferred_length: 'medium',
      focus_areas: ['productivity', 'coding', 'learning'],
      exclude_categories: [],
      notification_settings: {
        email_summaries: false,
        push_notifications: false,
        summary_times: ['17:00'],
        productivity_alerts: true
      }
    };
  }

  private generateGoalId(): string {
    return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Bulk operations for context management

  async importGoals(goals: Goal[]): Promise<void> {
    this.userGoals = goals;
    logger.info(`Imported ${goals.length} goals`);
  }

  async exportContext(): Promise<{
    goals: Goal[];
    preferences: UserPreferences;
    recentSummaries: WorkSummary[];
  }> {
    return {
      goals: this.userGoals,
      preferences: this.userPreferences,
      recentSummaries: this.summaryHistory.slice(-10)
    };
  }

  async clearHistory(): Promise<void> {
    this.summaryHistory = [];
    logger.info('Cleared summary history');
  }

  getStatistics(): {
    summaryCount: number;
    goalCount: number;
    completedGoals: number;
    averageProductivity: number;
  } {
    const completedGoals = this.userGoals.filter(g => g.status === 'completed').length;
    const avgProductivity = this.summaryHistory.length > 0 ?
      this.summaryHistory.reduce((sum, s) => sum + s.metrics.productivity_score, 0) / this.summaryHistory.length :
      0;

    return {
      summaryCount: this.summaryHistory.length,
      goalCount: this.userGoals.length,
      completedGoals,
      averageProductivity: avgProductivity
    };
  }
}