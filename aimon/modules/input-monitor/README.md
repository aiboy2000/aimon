# Input Monitor Module

Cross-platform input monitoring service that captures keyboard, mouse, and screen events.

## Features

- **Cross-platform monitoring**: Supports Windows, macOS, and Linux
- **Real-time event capture**: Keyboard presses, mouse clicks, movements, and scrolling
- **Screenshot capture**: Periodic screen captures with configurable intervals
- **Multiple output methods**: HTTP API and RabbitMQ support
- **Batch processing**: Efficient event batching for performance
- **Privacy protection**: Password field filtering and app exclusion
- **Robust error handling**: Retry mechanisms and fallback options

## Configuration

Configure the module using `config.toml` or environment variables with `INPUT_MONITOR_` prefix:

```toml
# Server configuration
output_url = "http://localhost:8080/api/events"
api_key = "your-api-key-here"

# RabbitMQ configuration (optional)
rabbitmq_url = "amqp://localhost:5672"
rabbitmq_exchange = "activity_events"
rabbitmq_routing_key = "input.events"

# Monitoring settings
track_mouse_movement = false
screenshot_enabled = true
screenshot_interval_secs = 300
screenshot_quality = 75

# Performance settings
batch_size = 100
batch_timeout_ms = 5000
max_retries = 3
retry_delay_ms = 1000

# Privacy settings
filter_passwords = true
excluded_apps = ["KeePass", "1Password", "Bitwarden"]
```

## Environment Variables

All configuration options can be set via environment variables:

```bash
export INPUT_MONITOR_OUTPUT_URL="http://localhost:8080/api/events"
export INPUT_MONITOR_API_KEY="your-api-key"
export INPUT_MONITOR_TRACK_MOUSE_MOVEMENT=false
export INPUT_MONITOR_SCREENSHOT_ENABLED=true
```

## Event Types

The module emits standardized events in JSON format:

### Key Events
```json
{
  "type": "KeyPress",
  "timestamp": "2023-12-01T10:30:00Z",
  "session_id": "session_123",
  "device_id": "device_456",
  "key": "A",
  "modifiers": ["Shift", "Control"]
}
```

### Mouse Events
```json
{
  "type": "MouseClick",
  "timestamp": "2023-12-01T10:30:00Z",
  "session_id": "session_123",
  "device_id": "device_456",
  "button": "Left",
  "position": {"x": 100.0, "y": 200.0}
}
```

### Screenshot Events
```json
{
  "type": "Screenshot",
  "timestamp": "2023-12-01T10:30:00Z",
  "session_id": "session_123",
  "device_id": "device_456",
  "data": "base64-encoded-image-data",
  "format": "png"
}
```

## Usage

### Development
```bash
# Run in development mode
cargo run

# Run with custom config
RUST_LOG=debug cargo run
```

### Production
```bash
# Build release binary
cargo build --release

# Run with production config
./target/release/input-monitor
```

### Testing
```bash
# Run unit tests
cargo test

# Run tests with ignored (integration) tests
cargo test -- --ignored
```

## Platform Requirements

### Windows
- Requires elevation for global input monitoring
- Uses Windows API hooks

### macOS
- Requires Accessibility permissions
- Add app to System Preferences > Security & Privacy > Accessibility

### Linux
- Requires X11 or Wayland
- May need to run as root or add user to input group

## API Integration

The module sends events to the configured endpoint. The receiving service should handle:

```http
POST /api/events
Content-Type: application/json
Authorization: Bearer <api-key>

{
  "type": "KeyPress",
  "timestamp": "2023-12-01T10:30:00Z",
  ...
}
```

## Security Considerations

- **Password filtering**: Automatically filters password fields
- **App exclusion**: Excludes monitoring of sensitive applications
- **Local processing**: All data remains on local machine
- **No cloud transmission**: Events only sent to configured local endpoints

## Performance

- **Low overhead**: Minimal CPU and memory usage
- **Efficient batching**: Groups events for optimal performance
- **Async processing**: Non-blocking event capture and transmission
- **Configurable sampling**: Adjust capture rates for performance tuning