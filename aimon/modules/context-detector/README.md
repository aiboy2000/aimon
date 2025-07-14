# Context Detector Module

The Context Detector module provides comprehensive application and window context detection for the AI Activity Monitor system, tracking window focus, application usage, and workspace organization.

## Overview

This module monitors system-level context including active windows, running applications, screen layouts, and user interaction patterns. It provides real-time context awareness that enables other modules to understand what users are working on and how they organize their digital workspace.

## Features

### 1. Window Tracking
- **Active Window Detection**: Monitors currently focused windows
- **Window Hierarchy**: Tracks parent-child window relationships
- **Window Events**: Detects focus, blur, open, close, move, resize events
- **Multi-Monitor Support**: Handles multiple screen configurations

### 2. Application Monitoring
- **Running Applications**: Tracks all active applications
- **Application Categorization**: Classifies apps by productivity type
- **Resource Usage**: Monitors CPU, memory usage per application
- **Application Lifecycle**: Tracks start/exit events

### 3. Context Intelligence
- **Focus Sessions**: Measures focused work periods
- **Productivity Scoring**: Rates applications and activities
- **Pattern Recognition**: Identifies work patterns and habits
- **Project Detection**: Automatically detects project contexts

### 4. Privacy & Security
- **Privacy Mode**: Optionally blur sensitive content
- **Selective Monitoring**: Configure what to track
- **Data Encryption**: Secure handling of sensitive data
- **Consent Management**: User control over data collection

## Architecture

```
context-detector/
├── src/
│   ├── ContextDetector.ts       # Main detector orchestrator
│   ├── types.ts                 # TypeScript type definitions
│   ├── trackers/
│   │   └── WindowTracker.ts     # Window monitoring and tracking
│   ├── monitors/
│   │   └── ApplicationMonitor.ts # Application lifecycle monitoring
│   ├── capture/
│   │   └── ScreenshotCapture.ts # Optional screenshot functionality
│   ├── patterns/
│   │   └── PatternMatcher.ts    # Pattern recognition engine
│   ├── detectors/
│   │   └── ProjectDetector.ts   # Project context detection
│   └── utils/
│       └── logger.ts            # Logging utilities
├── package.json
├── tsconfig.json
└── README.md
```

## API

### ContextDetector

```typescript
const detector = new ContextDetector({
  polling_interval: 1000,
  enable_window_tracking: true,
  enable_application_monitoring: true,
  enable_screenshot_capture: false,
  privacy_mode: false,
  patterns: []
});

// Start monitoring
await detector.start();

// Get current context
const context = await detector.getCurrentContext();
// {
//   window: {
//     title: "main.ts - Visual Studio Code",
//     application: "vscode",
//     bounds: { x: 0, y: 0, width: 1200, height: 800 }
//   },
//   session: {
//     duration: 1800000, // 30 minutes
//     productivity_rating: 95
//   }
// }

// Listen for context changes
detector.on('context-change', (event) => {
  console.log(`Window changed to: ${event.window_info.title}`);
});
```

### Event Handling

```typescript
// Window focus events
detector.on('context-change', (event: ContextEvent) => {
  if (event.event_type === ContextEventType.WINDOW_FOCUS) {
    console.log(`Focused: ${event.window_info.title}`);
  }
});

// Session tracking
detector.on('session-end', (session: FocusSession) => {
  console.log(`Session ended: ${session.duration}ms in ${session.application}`);
});

// Pattern matching
detector.on('pattern-match', ({ window, patterns }) => {
  console.log(`Pattern matched for ${window.title}:`, patterns);
});

// Project detection
detector.on('project-detected', ({ window, project }) => {
  console.log(`Project detected: ${project.project_name}`);
});
```

## Configuration

Environment variables:

```bash
# Service configuration
SERVICE_ID=context-detector-001
PORT=8085

# Monitoring settings
POLLING_INTERVAL=1000
ENABLE_WINDOW_TRACKING=true
ENABLE_APPLICATION_MONITORING=true
ENABLE_SCREENSHOT_CAPTURE=false
PRIVACY_MODE=false

# Screenshot settings
SCREENSHOT_INTERVAL=30000
SCREENSHOT_QUALITY=70
BLUR_SENSITIVE_CONTENT=true

# RabbitMQ
RABBITMQ_URL=amqp://aimon:aimon123@localhost:5672
RABBITMQ_EXCHANGE=activity_events
RABBITMQ_QUEUE=context_queue
OUTPUT_ROUTING_KEY=context.detected

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
docker build -t context-detector .
docker run -p 8085:8085 context-detector
```

## Platform Support

### Windows
- Uses Win32 APIs for window enumeration
- GetForegroundWindow for active window detection
- Process monitoring via WMI

### macOS
- NSWorkspace for application monitoring
- Accessibility APIs for window information
- Core Graphics for screen capture

### Linux
- X11/Wayland for window management
- /proc filesystem for process monitoring
- XCB for window properties

## Integration Points

1. **Context Detector** → Activity DB (via REST API)
   - Stores context events and sessions
   - Retrieves historical patterns

2. **Context Detector** → Other Modules (via RabbitMQ)
   - Provides context for activity analysis
   - Triggers context-aware processing

## Privacy Considerations

### Data Collection
- Only collects necessary context information
- User configurable privacy levels
- Opt-out mechanisms for sensitive data

### Data Security
- Local processing by default
- Encryption for sensitive information
- Secure API communication

### Compliance
- GDPR compliance for EU users
- CCPA compliance for California residents
- Transparent data usage policies

## Performance Optimization

### Efficient Polling
- Adaptive polling intervals
- Event-driven updates when possible
- Resource usage monitoring

### Memory Management
- Limited context history retention
- Efficient data structures
- Garbage collection optimization

## Use Cases

### Productivity Analysis
- Track time spent in different applications
- Identify productive vs. distracting patterns
- Measure focus and concentration periods

### Workspace Optimization
- Analyze window arrangement patterns
- Optimize screen real estate usage
- Improve multitasking efficiency

### Project Context
- Automatically detect project switches
- Track time per project
- Maintain project-specific contexts

### Team Insights
- Understand collaboration patterns
- Track communication tool usage
- Analyze meeting productivity

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Grant accessibility permissions (macOS)
   - Run with appropriate privileges (Windows/Linux)

2. **High CPU Usage**
   - Increase polling interval
   - Disable unnecessary features
   - Check for resource leaks

3. **Missing Window Information**
   - Verify platform-specific APIs
   - Check application sandboxing
   - Update system permissions

## License

Part of the AI Activity Monitor project.