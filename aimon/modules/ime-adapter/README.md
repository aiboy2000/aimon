# IME Adapter Module

The IME Adapter module reconstructs actual typed text from raw keyboard events, with special support for Input Method Editor (IME) systems like pinyin-to-Chinese conversion.

## Overview

This module processes keyboard event sequences and converts them into meaningful text, handling:
- Direct key-to-character mapping for Western languages
- Pinyin-to-Chinese character conversion for Chinese input
- Clipboard monitoring for enhanced text reconstruction
- Multi-language support with language detection

## Architecture

```
ime-adapter/
├── src/
│   ├── ImeAdapter.ts           # Main adapter class
│   ├── processors/
│   │   ├── DirectKeyMapper.ts  # Basic key-to-text mapping
│   │   ├── PinyinProcessor.ts  # Pinyin conversion
│   │   └── ClipboardMonitor.ts # Clipboard integration
│   ├── services/
│   │   ├── MessageQueueService.ts # RabbitMQ integration
│   │   └── ApiService.ts       # REST API and service discovery
│   ├── utils/
│   │   ├── languageDetector.ts # Language detection
│   │   ├── textSegmenter.ts    # Text segmentation
│   │   └── logger.ts           # Logging utilities
│   └── tests/                  # Unit tests
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Features

### 1. Direct Key Mapping
- Maps keyboard events to characters
- Handles modifiers (Shift, Caps Lock)
- Supports special keys (Space, Enter, Tab)
- Manages backspace and delete operations

### 2. Pinyin Processing
- Detects pinyin sequences automatically
- Segments continuous pinyin into syllables
- Converts pinyin to Chinese characters
- Provides multiple character alternatives
- Handles tone marks (ma1, ma2, ma3, ma4)

### 3. Clipboard Monitoring
- Monitors system clipboard changes
- Correlates clipboard content with typing
- Improves reconstruction accuracy for IME input
- Maintains clipboard history

### 4. Multi-language Support
- Automatic language detection
- Context-aware processing
- Fallback strategies for unknown languages

## API

### ImeAdapter

```typescript
const adapter = new ImeAdapter();

// Process keyboard sequence
const result = await adapter.processKeySequence({
  eventId: 'event-123',
  sessionId: 'session-456',
  deviceId: 'device-789',
  keys: [
    { key: 'n', timestamp: 1000 },
    { key: 'i', timestamp: 1100 },
    { key: 'h', timestamp: 1200 },
    { key: 'a', timestamp: 1300 },
    { key: 'o', timestamp: 1400 }
  ],
  language: 'zh'
});

// Result:
// {
//   text: '你好',
//   method: 'pinyin',
//   confidence: 0.85,
//   alternatives: ['你好', '拟好'],
//   language: 'zh'
// }
```

### Message Queue Integration

The module listens for keyboard events from RabbitMQ:

```json
{
  "type": "keyboard_sequence",
  "data": {
    "eventId": "event-123",
    "keys": [...],
    "sessionId": "session-456"
  }
}
```

And publishes reconstructed text:

```json
{
  "type": "text_reconstructed",
  "data": {
    "eventId": "event-123",
    "text": "你好",
    "method": "pinyin",
    "confidence": 0.85
  }
}
```

## Configuration

Environment variables:

```bash
# Service configuration
SERVICE_ID=ime-adapter-001
PORT=8082

# RabbitMQ
RABBITMQ_URL=amqp://aimon:aimon123@localhost:5672
RABBITMQ_EXCHANGE=activity_events
RABBITMQ_QUEUE=ime_adapter_queue
RABBITMQ_ROUTING_KEY=input.keys

# API endpoints
ACTIVITY_DB_URL=http://localhost:8080
API_KEY=dev-key
CONSUL_URL=http://localhost:8500

# Processing options
ENABLE_CLIPBOARD=true
ENABLE_ML=false
MAX_ALTERNATIVES=3
CONTEXT_WINDOW=50
CONFIDENCE_THRESHOLD=0.7

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
docker build -t ime-adapter .
docker run -p 8082:8082 ime-adapter
```

## Integration Points

1. **Input Monitor** → IME Adapter (via RabbitMQ)
   - Receives raw keyboard events
   - Processes in real-time

2. **IME Adapter** → Activity Parser (via RabbitMQ)
   - Sends reconstructed text
   - Includes confidence scores

3. **IME Adapter** → Activity DB (via REST API)
   - Updates events with processed text
   - Stores alternatives for review

## Performance Considerations

- Processes events asynchronously
- Caches pinyin dictionary in memory
- Batches API calls when possible
- Configurable processing timeouts

## Extending the Module

### Adding New Languages

1. Create a new processor in `src/processors/`
2. Implement the `TextProcessor` interface
3. Register in `ImeAdapter.ts`

### Custom Pinyin Dictionary

Override the default dictionary:

```typescript
const processor = new PinyinProcessor({
  customDictionary: {
    'nihao': [{ character: '你好', frequency: 1.0 }]
  }
});
```

## Troubleshooting

### Common Issues

1. **Clipboard access denied**
   - Run with appropriate permissions
   - Disable clipboard monitoring if not needed

2. **Poor pinyin recognition**
   - Check language detection settings
   - Verify pinyin dictionary is loaded

3. **High memory usage**
   - Reduce clipboard history size
   - Limit pinyin alternatives

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug npm run dev
```

## License

Part of the AI Activity Monitor project.