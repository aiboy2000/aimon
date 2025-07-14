# AI Summarizer Module

The AI Summarizer module generates intelligent work activity summaries using AI models, providing insights into productivity patterns, achievements, and recommendations for improvement.

## Overview

This module processes parsed activity data to create meaningful summaries that help users understand their work patterns, track productivity, and receive actionable insights. It supports multiple summary types, customizable templates, and integrates with various AI providers.

## Architecture

```
ai-summarizer/
├── src/
│   ├── AISummarizer.ts          # Main summarization orchestrator
│   ├── types.ts                 # TypeScript type definitions
│   ├── services/
│   │   ├── AIModelService.ts    # AI model integration (OpenAI/Anthropic/Local)
│   │   ├── MessageQueueService.ts # RabbitMQ integration
│   │   └── ApiService.ts        # REST API and service discovery
│   ├── analyzers/
│   │   ├── MetricsCalculator.ts # Activity metrics calculation
│   │   └── InsightsGenerator.ts # Pattern analysis and insights
│   ├── templates/
│   │   └── TemplateManager.ts   # Summary template management
│   ├── providers/
│   │   └── ContextProvider.ts   # Context and goal management
│   └── tests/                   # Unit tests
├── package.json
├── tsconfig.json
└── README.md
```

## Features

### 1. Multiple Summary Types
- **Hourly**: Quick progress checks and recommendations
- **Daily**: Comprehensive day reviews with achievements
- **Weekly**: Strategic insights and pattern analysis
- **Session**: Work session completion summaries
- **Project**: Project-focused progress reports

### 2. AI-Powered Content Generation
- **Natural Language Summaries**: Human-readable work descriptions
- **Achievement Recognition**: Highlights accomplishments and progress
- **Pattern Analysis**: Identifies productive and distracting patterns
- **Personalized Recommendations**: Actionable advice for improvement

### 3. Comprehensive Metrics
- **Productivity Score**: Overall work effectiveness rating
- **Focus Score**: Concentration and deep work measurement
- **Time Distribution**: Breakdown by activity types and categories
- **Application Usage**: Top applications and their productivity impact

### 4. Intelligent Insights
- **Productive Patterns**: Identifies what works best
- **Time Wasters**: Highlights distractions and inefficiencies
- **Mood Indicators**: Detects energy levels and motivation
- **Goal Progress**: Tracks advancement toward objectives

### 5. Flexible Templates
- **Customizable Prompts**: Tailor summaries to specific needs
- **Multiple Formats**: Narrative, bullet points, structured
- **Audience Targeting**: Self, manager, team, or client focused
- **Template Library**: Pre-built templates for common scenarios

## API

### AISummarizer

```typescript
const summarizer = new AISummarizer(aiService, contextProvider);

// Generate a summary
const summary = await summarizer.generateSummary(activities, {
  session_id: 'session-123',
  time_period: {
    start: new Date('2024-01-01T09:00:00Z'),
    end: new Date('2024-01-01T17:00:00Z'),
    duration: 28800000
  },
  summary_type: SummaryType.DAILY,
  include_insights: true,
  include_recommendations: true
});

// Result:
// {
//   id: 'summary_123',
//   summary_type: 'daily',
//   content: {
//     overview: 'You had a highly productive day...',
//     key_activities: ['Completed feature implementation', 'Reviewed code'],
//     achievements: ['Resolved 5 bugs', 'Deployed new feature'],
//     focus_areas: ['coding', 'testing', 'documentation'],
//     recommendations: ['Take more breaks', 'Batch similar tasks']
//   },
//   metrics: {
//     productivity_score: 82.5,
//     focus_score: 76.3,
//     total_activities: 47,
//     active_time: 25200000
//   }
// }
```

### Template Management

```typescript
// Create custom template
const template = await templateManager.createTemplate({
  name: 'Sprint Review',
  description: 'End of sprint summary for teams',
  type: SummaryType.WEEKLY,
  prompt_template: `Analyze sprint activities from {time_range}:
    
{activity_summary}

Create a sprint review covering:
1. Sprint goals achievement
2. Key deliverables completed
3. Team collaboration insights
4. Blockers and challenges
5. Next sprint recommendations`,
  output_format: 'structured',
  max_length: 1000,
  target_audience: 'team'
});
```

### Metrics and Insights

```typescript
// Calculate detailed metrics
const metrics = metricsCalculator.calculate(activities, timePeriod);

// Generate insights
const insights = await insightsGenerator.generate(activities, metrics, context);

// Access specific insights
console.log(insights.productive_patterns);
console.log(insights.efficiency_tips);
console.log(insights.goal_progress);
```

## Configuration

Environment variables:

```bash
# Service configuration
SERVICE_ID=ai-summarizer-001
PORT=8084

# RabbitMQ
RABBITMQ_URL=amqp://aimon:aimon123@localhost:5672
RABBITMQ_EXCHANGE=activity_events
RABBITMQ_QUEUE=summarizer_queue
INPUT_ROUTING_KEY=parsed.activity
OUTPUT_ROUTING_KEY=summary.generated

# AI Model (OpenAI)
AI_PROVIDER=openai
AI_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=your_openai_api_key
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1000

# AI Model (Local)
AI_PROVIDER=local
AI_BASE_URL=http://localhost:8080
AI_MODEL=local-model

# Processing
BATCH_SIZE=50
ENABLE_AUTO_SUMMARIES=true
SUMMARY_TRIGGER_INTERVAL=3600000

# API endpoints
ACTIVITY_DB_URL=http://localhost:8080
API_KEY=dev-key
CONSUL_URL=http://localhost:8500

# Logging
LOG_LEVEL=info
```

## Running the Module

### Development
```bash
npm install
npm run dev
```

### Testing
```bash
npm test
npm run test:watch
npm run test:coverage
```

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t ai-summarizer .
docker run -p 8084:8084 ai-summarizer
```

## Integration Points

1. **Activity Parser** → AI Summarizer (via RabbitMQ)
   - Receives parsed activities
   - Triggers summary generation

2. **AI Summarizer** → Activity DB (via REST API)
   - Stores generated summaries
   - Retrieves historical data

3. **AI Summarizer** → Monitor Dashboard (via RabbitMQ)
   - Sends summary notifications
   - Provides real-time insights

## AI Provider Support

### OpenAI
```bash
AI_PROVIDER=openai
AI_MODEL=gpt-3.5-turbo  # or gpt-4
OPENAI_API_KEY=your_key
```

### Anthropic Claude
```bash
AI_PROVIDER=anthropic
AI_MODEL=claude-3-sonnet
ANTHROPIC_API_KEY=your_key
```

### Local Models
```bash
AI_PROVIDER=local
AI_BASE_URL=http://localhost:8080
AI_MODEL=llama2  # or any local model
```

## Summary Types and Use Cases

### Hourly Summaries
- Quick productivity checks
- Real-time feedback
- Immediate course correction

### Daily Summaries
- End-of-day reflection
- Achievement tracking
- Next-day planning

### Weekly Summaries
- Pattern analysis
- Strategic insights
- Goal progress review

### Session Summaries
- Work session completion
- Focus assessment
- Break recommendations

### Project Summaries
- Project progress tracking
- Team collaboration insights
- Milestone achievement

## Advanced Features

### Goal Integration
- Automatic goal progress tracking
- Smart goal recommendations
- Achievement celebrations

### Context Awareness
- Previous summary context
- User preference adaptation
- Project-specific insights

### Mood Detection
- Energy level indicators
- Motivation patterns
- Burnout prevention

### Productivity Optimization
- Peak performance identification
- Distraction pattern analysis
- Efficiency recommendations

## Performance Considerations

- Asynchronous AI generation
- Response caching
- Token usage optimization
- Batch processing capabilities

## Monitoring and Metrics

The module exposes metrics:
- Summaries generated per hour
- Average generation time
- AI model token usage
- User engagement scores

## Troubleshooting

### Common Issues

1. **AI API Rate Limits**
   - Implement retry logic
   - Use exponential backoff
   - Monitor token usage

2. **Long Generation Times**
   - Reduce max_tokens
   - Optimize prompts
   - Use faster models

3. **Poor Summary Quality**
   - Improve prompt templates
   - Add more context
   - Fine-tune temperature

## License

Part of the AI Activity Monitor project.