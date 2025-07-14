import { 
  ParsedActivity, 
  WorkSummary, 
  SummaryRequest, 
  SummaryTemplate,
  SummaryType,
  ActivityCategory,
  ActivityType,
  SummaryContent,
  SummaryMetrics,
  SummaryInsights,
  ContextData
} from './types';
import { AIModelService } from './services/AIModelService';
import { MetricsCalculator } from './analyzers/MetricsCalculator';
import { InsightsGenerator } from './analyzers/InsightsGenerator';
import { TemplateManager } from './templates/TemplateManager';
import { ContextProvider } from './providers/ContextProvider';
import { logger } from './utils/logger';

export class AISummarizer {
  private aiService: AIModelService;
  private metricsCalculator: MetricsCalculator;
  private insightsGenerator: InsightsGenerator;
  private templateManager: TemplateManager;
  private contextProvider: ContextProvider;

  constructor(
    aiService: AIModelService,
    contextProvider: ContextProvider
  ) {
    this.aiService = aiService;
    this.metricsCalculator = new MetricsCalculator();
    this.insightsGenerator = new InsightsGenerator();
    this.templateManager = new TemplateManager();
    this.contextProvider = contextProvider;
  }

  async generateSummary(
    activities: ParsedActivity[],
    request: SummaryRequest
  ): Promise<WorkSummary> {
    try {
      logger.info(`Generating ${request.summary_type} summary for ${activities.length} activities`);

      // Step 1: Calculate metrics
      const metrics = this.metricsCalculator.calculate(activities, request.time_period);

      // Step 2: Get context data
      const context = await this.contextProvider.getContext(request);

      // Step 3: Generate insights
      const insights = await this.insightsGenerator.generate(activities, metrics, context);

      // Step 4: Get or create template
      const template = await this.getTemplate(request);

      // Step 5: Generate AI summary content
      const content = await this.generateContent(
        activities, 
        metrics, 
        insights, 
        template, 
        context,
        request
      );

      // Step 6: Build final summary
      const summary: WorkSummary = {
        id: this.generateSummaryId(),
        session_id: request.session_id || 'unknown',
        device_id: request.device_id || 'unknown',
        period: request.time_period,
        summary_type: request.summary_type,
        content,
        metrics,
        insights,
        generated_at: new Date(),
        version: '1.0'
      };

      logger.info(`Generated summary ${summary.id} with ${content.key_activities.length} key activities`);
      return summary;

    } catch (error) {
      logger.error('Failed to generate summary:', error);
      throw error;
    }
  }

  private async getTemplate(request: SummaryRequest): Promise<SummaryTemplate> {
    if (request.template_id) {
      const template = await this.templateManager.getTemplate(request.template_id);
      if (template) return template;
    }

    // Get default template for summary type
    return this.templateManager.getDefaultTemplate(request.summary_type);
  }

  private async generateContent(
    activities: ParsedActivity[],
    metrics: SummaryMetrics,
    insights: SummaryInsights,
    template: SummaryTemplate,
    context: ContextData,
    request: SummaryRequest
  ): Promise<SummaryContent> {
    // Prepare prompt
    const prompt = this.buildPrompt(
      activities,
      metrics,
      insights,
      template,
      context,
      request
    );

    // Generate with AI
    const aiResponse = await this.aiService.generateSummary(prompt, template);

    // Parse AI response
    const parsedContent = this.parseAIResponse(aiResponse, template);

    // Add structured data
    return {
      overview: parsedContent.overview,
      key_activities: this.extractKeyActivities(activities, metrics),
      achievements: parsedContent.achievements || [],
      focus_areas: this.identifyFocusAreas(activities, metrics),
      distractions: this.identifyDistractions(activities, metrics),
      recommendations: request.include_recommendations ? 
        (parsedContent.recommendations || insights.efficiency_tips) : undefined
    };
  }

  private buildPrompt(
    activities: ParsedActivity[],
    metrics: SummaryMetrics,
    insights: SummaryInsights,
    template: SummaryTemplate,
    context: ContextData,
    request: SummaryRequest
  ): string {
    const timeRange = `${request.time_period.start.toLocaleString()} to ${request.time_period.end.toLocaleString()}`;
    
    let prompt = template.prompt_template
      .replace('{time_range}', timeRange)
      .replace('{total_activities}', metrics.total_activities.toString())
      .replace('{active_time}', this.formatDuration(metrics.active_time))
      .replace('{productivity_score}', metrics.productivity_score.toFixed(1));

    // Add activity summary
    const activitySummary = this.createActivitySummary(activities, metrics);
    prompt = prompt.replace('{activity_summary}', activitySummary);

    // Add context if available
    if (context.recent_summaries.length > 0) {
      const recentContext = this.createRecentContext(context.recent_summaries);
      prompt = prompt.replace('{recent_context}', recentContext);
    }

    // Add goals context
    if (context.user_goals.length > 0) {
      const goalsContext = this.createGoalsContext(context.user_goals, metrics);
      prompt = prompt.replace('{goals_context}', goalsContext);
    }

    // Add custom instructions
    if (request.custom_prompt) {
      prompt += `\n\nAdditional instructions: ${request.custom_prompt}`;
    }

    return prompt;
  }

  private createActivitySummary(activities: ParsedActivity[], metrics: SummaryMetrics): string {
    const lines = [
      `Total activities: ${metrics.total_activities}`,
      `Active time: ${this.formatDuration(metrics.active_time)}`,
      `Productivity score: ${metrics.productivity_score.toFixed(1)}/100`,
      '',
      'Top applications:'
    ];

    metrics.top_applications.slice(0, 5).forEach((app, index) => {
      lines.push(`${index + 1}. ${app.name}: ${this.formatDuration(app.time_spent)} (${app.category})`);
    });

    lines.push('', 'Activity breakdown:');
    Object.entries(metrics.type_breakdown).forEach(([type, duration]) => {
      if (duration > 0) {
        lines.push(`- ${type}: ${this.formatDuration(duration)}`);
      }
    });

    return lines.join('\n');
  }

  private createRecentContext(recentSummaries: WorkSummary[]): string {
    if (recentSummaries.length === 0) return '';

    const lines = ['Recent work patterns:'];
    recentSummaries.slice(0, 3).forEach((summary, index) => {
      lines.push(`${index + 1}. ${summary.summary_type} summary (${summary.metrics.productivity_score.toFixed(1)}% productive)`);
      if (summary.content.focus_areas.length > 0) {
        lines.push(`   Focus: ${summary.content.focus_areas.join(', ')}`);
      }
    });

    return lines.join('\n');
  }

  private createGoalsContext(goals: any[], metrics: SummaryMetrics): string {
    const lines = ['Current goals progress:'];
    
    goals.slice(0, 3).forEach((goal, index) => {
      const progress = (goal.current_value / goal.target_value * 100).toFixed(1);
      lines.push(`${index + 1}. ${goal.name}: ${progress}% complete`);
    });

    return lines.join('\n');
  }

  private parseAIResponse(response: string, template: SummaryTemplate): any {
    // Simple parsing - in a real implementation, this would be more sophisticated
    const sections = response.split('\n\n');
    
    return {
      overview: sections[0] || response,
      achievements: this.extractListItems(response, /(?:Achievement|Accomplishment)s?:?\s*(.*?)(?:\n\n|$)/is),
      recommendations: this.extractListItems(response, /(?:Recommendation|Suggestion)s?:?\s*(.*?)(?:\n\n|$)/is)
    };
  }

  private extractListItems(text: string, pattern: RegExp): string[] {
    const match = text.match(pattern);
    if (!match) return [];

    return match[1]
      .split('\n')
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5); // Limit to 5 items
  }

  private extractKeyActivities(activities: ParsedActivity[], metrics: SummaryMetrics): string[] {
    const keyActivities: string[] = [];

    // Add most productive activities
    const productiveActivities = activities
      .filter(a => a.category === ActivityCategory.PRODUCTIVE)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 3);

    productiveActivities.forEach(activity => {
      if (activity.content.text && activity.content.text.length > 10) {
        keyActivities.push(`${activity.type}: ${activity.content.text.substring(0, 100)}...`);
      } else {
        keyActivities.push(`${activity.type} in ${activity.application}`);
      }
    });

    // Add significant app usage
    metrics.top_applications.slice(0, 2).forEach(app => {
      if (app.time_spent > 300000) { // More than 5 minutes
        keyActivities.push(`Spent ${this.formatDuration(app.time_spent)} in ${app.name}`);
      }
    });

    return keyActivities.slice(0, 5);
  }

  private identifyFocusAreas(activities: ParsedActivity[], metrics: SummaryMetrics): string[] {
    const focusAreas: string[] = [];

    // Identify from top applications
    metrics.top_applications.slice(0, 3).forEach(app => {
      if (app.category === ActivityCategory.PRODUCTIVE) {
        focusAreas.push(app.name);
      }
    });

    // Identify from keywords
    const keywords = new Map<string, number>();
    activities.forEach(activity => {
      activity.content.keywords?.forEach(keyword => {
        keywords.set(keyword, (keywords.get(keyword) || 0) + 1);
      });
    });

    // Add top keywords
    Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([keyword]) => {
        if (!focusAreas.includes(keyword)) {
          focusAreas.push(keyword);
        }
      });

    return focusAreas.slice(0, 5);
  }

  private identifyDistractions(activities: ParsedActivity[], metrics: SummaryMetrics): string[] {
    const distractions: string[] = [];

    // Identify distracting applications
    metrics.top_applications.forEach(app => {
      if (app.category === ActivityCategory.DISTRACTING && app.time_spent > 300000) {
        distractions.push(`${app.name} (${this.formatDuration(app.time_spent)})`);
      }
    });

    // Add entertainment activities
    metrics.top_applications.forEach(app => {
      if (app.category === ActivityCategory.ENTERTAINMENT && app.time_spent > 600000) {
        distractions.push(`${app.name} entertainment (${this.formatDuration(app.time_spent)})`);
      }
    });

    return distractions.slice(0, 3);
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  private generateSummaryId(): string {
    return `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getSummaryHistory(
    sessionId: string,
    summaryType?: SummaryType,
    limit: number = 10
  ): Promise<WorkSummary[]> {
    // This would typically query a database
    // For now, return empty array
    return [];
  }

  async updateTemplate(template: SummaryTemplate): Promise<void> {
    await this.templateManager.updateTemplate(template);
  }

  getMetrics(): any {
    return {
      summariesGenerated: 0, // Would track in a real implementation
      averageGenerationTime: 0,
      modelUsage: this.aiService.getUsageStats()
    };
  }
}