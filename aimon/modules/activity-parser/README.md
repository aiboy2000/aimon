# Activity Parser Module

The Activity Parser module cleans, structures, and categorizes raw activity data into meaningful insights for the AI Activity Monitor system.

## Overview

This module processes raw keyboard, mouse, and application events, applying intelligent rules and analysis to:
- Categorize activities (productive, distracting, neutral, etc.)
- Detect activity types (coding, documenting, browsing, etc.)
- Extract meaningful content and keywords
- Generate session summaries with productivity scores
- Ensure data quality through validation and anomaly detection

## Architecture

```
activity-parser/
├── src/
│   ├── ActivityParser.ts        # Main parser orchestrator
│   ├── types.ts                 # TypeScript type definitions
│   ├── engines/
│   │   └── RuleEngine.ts        # Rule-based processing engine
│   ├── extractors/
│   │   └── ContentExtractor.ts  # Content and keyword extraction
│   ├── categorizers/
│   │   └── ActivityCategorizer.ts # Activity categorization logic
│   ├── analyzers/
│   │   └── QualityAnalyzer.ts   # Data quality analysis
│   ├── managers/
│   │   └── SessionManager.ts    # Session tracking and summaries
│   ├── services/
│   │   ├── MessageQueueService.ts # RabbitMQ integration
│   │   └── ApiService.ts        # REST API and service discovery
│   └── tests/                   # Unit tests
├── package.json
├── tsconfig.json
└── README.md
```

## Features

### 1. Intelligent Activity Classification
- **Type Detection**: Automatically identifies coding, documenting, browsing, communicating, etc.
- **Category Assignment**: Classifies as productive, distracting, neutral, learning, etc.
- **Context-Aware**: Uses application, window title, and content for accurate classification

### 2. Rule-Based Processing
- **Flexible Rules**: Define custom rules with conditions and actions
- **Priority System**: Rules execute in priority order
- **Dynamic Updates**: Rules can be updated without restarting

### 3. Content Analysis
- **Keyword Extraction**: Identifies important terms from text
- **Language Detection**: Recognizes multiple languages (English, Chinese, etc.)
- **URL/File Extraction**: Captures references to resources
- **Technical Term Recognition**: Detects programming concepts

### 4. Quality Assurance
- **Data Validation**: Ensures completeness and consistency
- **Anomaly Detection**: Identifies suspicious patterns
- **Confidence Scoring**: Rates quality of each parsed activity

### 5. Session Analytics
- **Duration Tracking**: Calculates active vs idle time
- **Activity Breakdowns**: Summarizes time by type and category
- **Productivity Scoring**: Generates productivity metrics
- **Application Usage**: Tracks top applications and their categories

## API

### ActivityParser

```typescript
const parser = new ActivityParser(config);

// Parse single activity
const parsed = await parser.parseActivity({
  id: 'activity-123',
  timestamp: Date.now(),
  type: 'keyboard',
  processed_text: 'Working on the new feature',
  context: {
    application: 'vscode',
    window_title: 'feature.ts'
  }
});

// Result:
// {
//   type: ActivityType.CODING,
//   category: ActivityCategory.PRODUCTIVE,
//   content: {
//     text: 'Working on the new feature',
//     keywords: ['working', 'feature'],
//     language: 'en'
//   },
//   quality_score: 0.92
// }
```

### Rule Engine

```typescript
const rule: ParsingRule = {
  id: 'github-detection',
  name: 'GitHub Activity',
  priority: 100,
  conditions: [
    { field: 'context.url', operator: 'contains', value: 'github.com' }
  ],
  actions: [
    { type: 'set_category', params: { value: 'productive' } },
    { type: 'add_tag', params: { value: 'development' } }
  ]
};
```

### Session Summary

```typescript
const summary = await parser.getSessionSummary('session-123');
// {
//   total_duration: 3600000,     // 1 hour
//   active_duration: 3240000,    // 54 minutes
//   productivity_score: 78.5,
//   top_applications: [
//     { name: 'vscode', duration: 2400000, category: 'productive' },
//     { name: 'chrome', duration: 600000, category: 'neutral' }
//   ]
// }
```

## Configuration

Environment variables:

```bash
# Service configuration
SERVICE_ID=activity-parser-001
PORT=8083

# RabbitMQ
RABBITMQ_URL=amqp://aimon:aimon123@localhost:5672
RABBITMQ_EXCHANGE=activity_events
RABBITMQ_QUEUE=parser_queue
INPUT_ROUTING_KEY=processed.text_reconstructed
OUTPUT_ROUTING_KEY=parsed.activity

# API endpoints
ACTIVITY_DB_URL=http://localhost:8080
API_KEY=dev-key
CONSUL_URL=http://localhost:8500

# Logging
LOG_LEVEL=info
```

## Default Rules

The module includes predefined rules for common scenarios:

1. **Code Detection**: Identifies coding in IDEs
2. **Documentation Detection**: Recognizes markdown and docs
3. **Browser Categorization**: Classifies web activities
4. **Idle Detection**: Marks periods of inactivity
5. **Communication Apps**: Identifies chat/email usage

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
docker build -t activity-parser .
docker run -p 8083:8083 activity-parser
```

## Integration Points

1. **IME Adapter** → Activity Parser (via RabbitMQ)
   - Receives activities with reconstructed text
   - Processes and categorizes

2. **Activity Parser** → AI Summarizer (via RabbitMQ)
   - Sends parsed activities
   - Triggers summary generation

3. **Activity Parser** → Activity DB (via REST API)
   - Stores parsed activities
   - Saves session summaries

## Extending the Module

### Adding Custom Rules

```typescript
const customRule: ParsingRule = {
  id: 'custom-app',
  name: 'Custom App Detection',
  priority: 150,
  conditions: [
    { field: 'context.application', operator: 'equals', value: 'myapp' }
  ],
  actions: [
    { type: 'set_category', params: { value: 'productive' } }
  ]
};
```

### Custom Content Extractors

Extend the ContentExtractor class to add specialized extraction logic.

### Category Mappings

Update the categorization config to include new applications:

```typescript
{
  productive_apps: ['myapp', 'anotherapp'],
  learning_apps: ['newlearningapp']
}
```

## Performance Considerations

- Processes activities asynchronously
- Caches categorization results
- Batches database operations
- Configurable quality thresholds

## Monitoring

The module exposes metrics:
- Total activities parsed
- Average quality score
- Rule hit rates
- Processing time per activity

## License

Part of the AI Activity Monitor project.