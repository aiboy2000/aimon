# Activity Database Module

RESTful API service for storing and querying activity data from the AI Activity Monitor ecosystem.

## Features

- **SQLite Database**: Fast, local storage with async support
- **RESTful API**: Complete CRUD operations for all activity data
- **Data Models**: Comprehensive schemas for events, sessions, applications, summaries, and screenshots
- **Authentication**: API key-based security
- **Pagination**: Efficient data retrieval with configurable page sizes
- **Data Retention**: Automatic cleanup of old data
- **Health Monitoring**: Built-in health checks and metrics
- **CORS Support**: Cross-origin requests for web dashboards

## API Endpoints

### Core Resources

#### Events (`/api/v1/events/`)
- `POST /` - Create new input event
- `GET /` - List events with filtering and pagination
- `GET /{id}` - Get specific event
- `PUT /{id}` - Update event
- `DELETE /{id}` - Delete event
- `GET /session/{session_id}` - Get all events for session
- `GET /statistics/` - Get event statistics

#### Sessions (`/api/v1/sessions/`)
- `POST /` - Create new session
- `GET /` - List sessions
- `GET /{id}` - Get session details
- `PUT /{id}` - Update session
- `DELETE /{id}` - Delete session

#### Applications (`/api/v1/applications/`)
- `POST /` - Register new application
- `GET /` - List tracked applications
- `GET /{id}` - Get application details
- `PUT /{id}` - Update application metadata
- `DELETE /{id}` - Remove application

#### Activity Summaries (`/api/v1/summaries/`)
- `POST /` - Create activity summary
- `GET /` - List summaries with date filtering
- `GET /{id}` - Get summary details
- `PUT /{id}` - Update summary

#### Screenshots (`/api/v1/screenshots/`)
- `POST /` - Store screenshot
- `GET /` - List screenshots
- `GET /{id}` - Get screenshot data
- `DELETE /{id}` - Delete screenshot

### System Endpoints

- `GET /` - Service information
- `GET /health` - Health check
- `GET /docs` - API documentation (development only)

## Configuration

Configure via environment variables or `.env` file:

```bash
# Database
DATABASE_URL=sqlite+aiosqlite:///./activity_monitor.db

# Server
HOST=0.0.0.0
PORT=8080
DEBUG=false

# Security
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Data retention
DATA_RETENTION_DAYS=90
CLEANUP_INTERVAL_HOURS=24

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:8080"]

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Message Queue (optional)
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=activity_events
```

## Database Schema

### Input Events
```sql
CREATE TABLE input_events (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSON NOT NULL,
    processed_text TEXT,
    application_context VARCHAR(255),
    window_title VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);
```

### Sessions
```sql
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_seconds INTEGER,
    user_id VARCHAR(255),
    os_info JSON,
    total_events INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Activity Summaries
```sql
CREATE TABLE activity_summaries (
    id INTEGER PRIMARY KEY,
    date DATETIME NOT NULL,
    period_type VARCHAR(10) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    total_events INTEGER DEFAULT 0,
    active_time_seconds INTEGER DEFAULT 0,
    keystrokes INTEGER DEFAULT 0,
    mouse_clicks INTEGER DEFAULT 0,
    productivity_score FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Usage Examples

### Creating Events
```python
import httpx

# Create input event
event_data = {
    "timestamp": "2023-12-01T10:30:00Z",
    "session_id": "session_123",
    "device_id": "device_456", 
    "event_type": "KeyPress",
    "event_data": {
        "key": "A",
        "modifiers": ["Shift"]
    }
}

response = httpx.post(
    "http://localhost:8080/api/v1/events/",
    json=event_data,
    headers={"Authorization": "Bearer your-api-key"}
)
```

### Querying Events
```python
# Get events with filtering
params = {
    "start_date": "2023-12-01T00:00:00Z",
    "end_date": "2023-12-01T23:59:59Z",
    "event_type": "KeyPress",
    "session_id": "session_123",
    "skip": 0,
    "limit": 100
}

response = httpx.get(
    "http://localhost:8080/api/v1/events/",
    params=params,
    headers={"Authorization": "Bearer your-api-key"}
)

data = response.json()
events = data["items"]
total = data["total"]
```

### Creating Sessions
```python
# Start new session
session_data = {
    "id": "session_123",
    "device_id": "device_456",
    "start_time": "2023-12-01T10:00:00Z",
    "os_info": {
        "platform": "Windows",
        "version": "11"
    }
}

response = httpx.post(
    "http://localhost:8080/api/v1/sessions/",
    json=session_data,
    headers={"Authorization": "Bearer your-api-key"}
)
```

## Installation

### Development Setup
```bash
cd modules/activity-db

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python -m activity_db.main
```

### Production Deployment
```bash
# Install with production dependencies
pip install .

# Run with Gunicorn
gunicorn activity_db.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8080

CMD ["python", "-m", "activity_db.main"]
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=activity_db

# Run specific test file
pytest tests/test_api.py

# Run in verbose mode
pytest -v
```

## Performance

### Database Optimization
- Indexes on frequently queried fields (timestamp, session_id, device_id)
- Composite indexes for complex queries
- Automatic data cleanup to maintain performance
- Connection pooling for concurrent requests

### API Performance
- Async request handling with FastAPI
- Efficient pagination with limit/offset
- Bulk operations for batch inserts
- Response compression for large datasets

### Monitoring
- Structured JSON logging
- Health check endpoints
- Request/response metrics
- Database query performance tracking

## Security

### Authentication
- API key-based authentication
- Configurable key permissions
- Rate limiting per API key
- Key usage tracking

### Data Protection
- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy
- Sensitive data filtering
- Configurable data retention policies

### Privacy
- Local data storage only
- No cloud transmission
- Configurable sensitive application filtering
- User-controlled data deletion

## Integration

### Input Monitor Integration
The input-monitor module sends events to this API:

```rust
// Rust client example
let event = InputEvent::new_key_press("A".to_string(), vec!["Shift".to_string()]);
let client = reqwest::Client::new();

let response = client
    .post("http://localhost:8080/api/v1/events/")
    .header("Authorization", "Bearer api-key")
    .json(&event)
    .send()
    .await?;
```

### Dashboard Integration
Web dashboards can query the API for real-time data:

```javascript
// JavaScript client example
async function getEvents(filters) {
    const response = await fetch('/api/v1/events/', {
        headers: {
            'Authorization': 'Bearer api-key',
            'Content-Type': 'application/json'
        },
        method: 'GET'
    });
    
    return response.json();
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check `DATABASE_URL` configuration
   - Ensure SQLite file permissions
   - Verify async driver installation

2. **Authentication Failures**
   - Verify API key format
   - Check `Authorization` header
   - Review key permissions

3. **Performance Issues**
   - Monitor database size
   - Check index usage
   - Review cleanup interval

4. **Memory Usage**
   - Adjust pagination limits
   - Configure data retention
   - Monitor request patterns

### Logging
Enable debug logging for troubleshooting:

```bash
LOG_LEVEL=DEBUG python -m activity_db.main
```

### Health Checks
Monitor service health:

```bash
curl http://localhost:8080/health
```

## Contributing

1. Follow FastAPI and SQLAlchemy best practices
2. Add comprehensive tests for new features
3. Update API documentation
4. Ensure backward compatibility
5. Add appropriate logging and error handling