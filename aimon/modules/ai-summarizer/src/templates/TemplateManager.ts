import { SummaryTemplate, SummaryType } from '../types';
import { logger } from '../utils/logger';

export class TemplateManager {
  private templates: Map<string, SummaryTemplate> = new Map();
  private defaultTemplates: Map<SummaryType, SummaryTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    // Daily summary template
    const dailyTemplate: SummaryTemplate = {
      id: 'daily-default',
      name: 'Daily Work Summary',
      description: 'Comprehensive daily work activity summary',
      type: SummaryType.DAILY,
      prompt_template: `Analyze the following work activity data for {time_range}:

{activity_summary}

{recent_context}

{goals_context}

Create a comprehensive daily summary that includes:
1. Overview of the day's work
2. Key accomplishments and activities
3. Productivity insights
4. Areas for improvement
5. Recommendations for tomorrow

Focus on being encouraging while providing actionable insights.`,
      required_metrics: ['total_activities', 'active_time', 'productivity_score'],
      output_format: 'mixed',
      max_length: 1000,
      target_audience: 'self'
    };

    // Hourly summary template
    const hourlyTemplate: SummaryTemplate = {
      id: 'hourly-default',
      name: 'Hourly Progress Check',
      description: 'Brief hourly progress summary',
      type: SummaryType.HOURLY,
      prompt_template: `Analyze this hour's work activity from {time_range}:

{activity_summary}

Create a brief hourly summary that includes:
1. Main activities completed
2. Productivity level
3. Quick recommendations for the next hour

Keep it concise and actionable.`,
      required_metrics: ['total_activities', 'productivity_score'],
      output_format: 'bullet_points',
      max_length: 300,
      target_audience: 'self'
    };

    // Weekly summary template
    const weeklyTemplate: SummaryTemplate = {
      id: 'weekly-default',
      name: 'Weekly Work Review',
      description: 'Comprehensive weekly work review',
      type: SummaryType.WEEKLY,
      prompt_template: `Analyze the week's work activity from {time_range}:

{activity_summary}

{recent_context}

{goals_context}

Create a comprehensive weekly summary that includes:
1. Week overview and key themes
2. Major accomplishments
3. Productivity trends and patterns
4. Goal progress assessment
5. Strategic recommendations for next week

Provide both tactical and strategic insights.`,
      required_metrics: ['total_activities', 'active_time', 'productivity_score', 'focus_score'],
      output_format: 'structured',
      max_length: 1500,
      target_audience: 'self'
    };

    // Session summary template
    const sessionTemplate: SummaryTemplate = {
      id: 'session-default',
      name: 'Session Summary',
      description: 'Work session completion summary',
      type: SummaryType.SESSION,
      prompt_template: `Analyze this work session from {time_range}:

{activity_summary}

Create a session summary that includes:
1. Session overview
2. Key activities and achievements
3. Focus and productivity assessment
4. Brief recommendations

Be encouraging and specific about accomplishments.`,
      required_metrics: ['total_activities', 'productivity_score'],
      output_format: 'narrative',
      max_length: 500,
      target_audience: 'self'
    };

    // Project summary template
    const projectTemplate: SummaryTemplate = {
      id: 'project-default',
      name: 'Project Progress Summary',
      description: 'Project-focused work summary',
      type: SummaryType.PROJECT,
      prompt_template: `Analyze project-related activities from {time_range}:

{activity_summary}

{goals_context}

Create a project-focused summary that includes:
1. Project progress overview
2. Key deliverables and milestones
3. Team collaboration insights
4. Resource utilization
5. Next steps and blockers

Focus on project outcomes and team dynamics.`,
      required_metrics: ['total_activities', 'active_time', 'productivity_score'],
      output_format: 'structured',
      max_length: 1200,
      target_audience: 'team'
    };

    // Manager template
    const managerTemplate: SummaryTemplate = {
      id: 'manager-report',
      name: 'Manager Status Report',
      description: 'Summary optimized for manager reporting',
      type: SummaryType.DAILY,
      prompt_template: `Prepare a professional status report for {time_range}:

{activity_summary}

{goals_context}

Create a manager-focused report that includes:
1. Executive summary of work completed
2. Key deliverables and outcomes
3. Progress against objectives
4. Challenges and roadblocks
5. Resource needs and next steps

Use professional language and focus on business impact.`,
      required_metrics: ['total_activities', 'productivity_score'],
      output_format: 'structured',
      max_length: 800,
      target_audience: 'manager'
    };

    // Store templates
    this.templates.set(dailyTemplate.id, dailyTemplate);
    this.templates.set(hourlyTemplate.id, hourlyTemplate);
    this.templates.set(weeklyTemplate.id, weeklyTemplate);
    this.templates.set(sessionTemplate.id, sessionTemplate);
    this.templates.set(projectTemplate.id, projectTemplate);
    this.templates.set(managerTemplate.id, managerTemplate);

    // Set as defaults
    this.defaultTemplates.set(SummaryType.DAILY, dailyTemplate);
    this.defaultTemplates.set(SummaryType.HOURLY, hourlyTemplate);
    this.defaultTemplates.set(SummaryType.WEEKLY, weeklyTemplate);
    this.defaultTemplates.set(SummaryType.SESSION, sessionTemplate);
    this.defaultTemplates.set(SummaryType.PROJECT, projectTemplate);

    logger.info(`Initialized ${this.templates.size} summary templates`);
  }

  async getTemplate(id: string): Promise<SummaryTemplate | null> {
    return this.templates.get(id) || null;
  }

  getDefaultTemplate(type: SummaryType): SummaryTemplate {
    const template = this.defaultTemplates.get(type);
    if (!template) {
      throw new Error(`No default template found for type: ${type}`);
    }
    return template;
  }

  async updateTemplate(template: SummaryTemplate): Promise<void> {
    this.templates.set(template.id, template);
    logger.info(`Updated template: ${template.id}`);
  }

  async createTemplate(template: Omit<SummaryTemplate, 'id'>): Promise<SummaryTemplate> {
    const id = this.generateTemplateId(template.name);
    const newTemplate: SummaryTemplate = { ...template, id };
    
    this.templates.set(id, newTemplate);
    logger.info(`Created new template: ${id}`);
    
    return newTemplate;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const deleted = this.templates.delete(id);
    if (deleted) {
      logger.info(`Deleted template: ${id}`);
    }
    return deleted;
  }

  listTemplates(): SummaryTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByType(type: SummaryType): SummaryTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.type === type);
  }

  getTemplatesByAudience(audience: string): SummaryTemplate[] {
    return Array.from(this.templates.values())
      .filter(template => template.target_audience === audience);
  }

  async validateTemplate(template: SummaryTemplate): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check required fields
    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.prompt_template || template.prompt_template.trim().length === 0) {
      errors.push('Prompt template is required');
    }

    if (template.max_length <= 0) {
      errors.push('Max length must be positive');
    }

    // Check prompt template placeholders
    const requiredPlaceholders = ['{time_range}', '{activity_summary}'];
    for (const placeholder of requiredPlaceholders) {
      if (!template.prompt_template.includes(placeholder)) {
        errors.push(`Missing required placeholder: ${placeholder}`);
      }
    }

    // Validate metrics
    if (template.required_metrics.length === 0) {
      errors.push('At least one required metric must be specified');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private generateTemplateId(name: string): string {
    const base = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const timestamp = Date.now().toString(36);
    return `${base}-${timestamp}`;
  }

  // Preset templates for common use cases
  static getManagerDailyTemplate(): SummaryTemplate {
    return {
      id: 'manager-daily-preset',
      name: 'Manager Daily Report',
      description: 'Professional daily report for managers',
      type: SummaryType.DAILY,
      prompt_template: `Professional daily status report for {time_range}:

ACTIVITIES SUMMARY:
{activity_summary}

OBJECTIVE PROGRESS:
{goals_context}

Please provide a concise professional report including:
• Key accomplishments and deliverables
• Progress against planned objectives  
• Productivity metrics and insights
• Issues or blockers encountered
• Planned activities for tomorrow

Format for executive consumption.`,
      required_metrics: ['total_activities', 'productivity_score', 'active_time'],
      output_format: 'structured',
      max_length: 600,
      target_audience: 'manager'
    };
  }

  static getPersonalReflectionTemplate(): SummaryTemplate {
    return {
      id: 'personal-reflection-preset',
      name: 'Personal Reflection',
      description: 'Thoughtful personal work reflection',
      type: SummaryType.DAILY,
      prompt_template: `Reflect on your work day from {time_range}:

{activity_summary}

{recent_context}

Create a thoughtful personal reflection that explores:
• What energized you today?
• What challenged you?
• What did you learn?
• How did you grow professionally?
• What are you grateful for?
• How can tomorrow be even better?

Be encouraging and focus on growth and learning.`,
      required_metrics: ['productivity_score', 'focus_score'],
      output_format: 'narrative',
      max_length: 800,
      target_audience: 'self'
    };
  }
}