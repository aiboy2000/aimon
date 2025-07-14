# AI Activity Monitor - Microservice Communication Framework

Comprehensive infrastructure and communication framework for the AI Activity Monitor ecosystem.

## Overview

This framework provides the foundational infrastructure for all microservices in the AI Activity Monitor ecosystem to communicate efficiently and reliably. It includes message queuing, service discovery, configuration management, monitoring, and logging.

## Architecture

### Core Components

1. **Message Queue (RabbitMQ)**
   - Event-driven communication between services
   - Topic-based routing for flexible message distribution
   - Durable queues for reliability

2. **API Gateway (Traefik)**
   - Single entry point for all HTTP services
   - Automatic service discovery and load balancing
   - SSL/TLS termination

3. **Service Discovery (Consul)**
   - Dynamic service registration and discovery
   - Health checking
   - Key-value store for configuration

4. **Configuration Management (Vault)**
   - Secure storage for sensitive configuration
   - Dynamic secret generation
   - Access control and audit logging

5. **Monitoring (Prometheus + Grafana)**
   - Metrics collection and visualization
   - Custom dashboards for each service
   - Alert management

6. **Logging (ELK Stack)**
   - Centralized log aggregation
   - Full-text search capabilities
   - Log analysis and visualization

7. **Caching (Redis)**
   - High-performance data caching
   - Pub/sub for real-time updates
   - Session storage

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.8+ (for Python services)
- Node.js 18+ (for Node.js services)

### Setup Infrastructure

1. Clone the repository and navigate to infrastructure directory:
```bash
cd aimon/infrastructure
```

2. Run the setup script:
```bash
./scripts/setup.sh
```

This will:
- Start all infrastructure services
- Create necessary exchanges and queues in RabbitMQ
- Register initial services in Consul
- Set up monitoring dashboards

### Service URLs

After setup, the following services are available:

- **RabbitMQ Management**: http://localhost:15672 (user: aimon, pass: aimon123)
- **Traefik Dashboard**: http://localhost:8080
- **Consul UI**: http://localhost:8500
- **Vault UI**: http://localhost:8200 (token: aimon-dev-token)
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (user: admin, pass: aimon123)
- **Kibana**: http://localhost:5601
- **Redis**: localhost:6379

## Communication Patterns

### 1. Event-Driven Communication

Services communicate through RabbitMQ using topic exchanges:

```python
# Publishing an event
await publisher.publish_event("KeyPress", {
    "key": "A",
    "modifiers": ["Shift"],
    "timestamp": "2023-12-01T10:30:00Z"
})

# Consuming events
consumer.register_handler("KeyPress", handle_keypress)
await consumer.start_consuming("my_queue")
```

### 2. Request-Response (via HTTP)

Services expose REST APIs through the API gateway:

```python
# Service registration
await discovery.register_service(
    service_id="my-service-001",
    name="my-service",
    address="localhost",
    port=8000,
    check_url="http://localhost:8000/health"
)

# Service discovery
service_url = await discovery.get_service_url("activity-db")
response = await http_client.get(f"{service_url}/api/v1/events")
```

### 3. Configuration Management

Services retrieve configuration from Consul/Vault:

```python
# Get configuration
config = await config_client.get_config("my-service")

# Watch for configuration changes
await config_client.watch_config("my-service", on_config_change)
```

## Message Flow

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│Input Monitor│────>│  RabbitMQ   │────>│ Activity DB  │
└─────────────┘     └─────────────┘     └──────────────┘
                           │
                           ├────>┌──────────────┐
                           │     │Activity Parser│
                           │     └──────────────┘
                           │
                           └────>┌──────────────┐
                                │AI Summarizer  │
                                └──────────────┘
```

## Service Integration

### Python Services

Install the communication library:
```bash
pip install -e infrastructure/libraries/python/
```

Example service:
```python
from aimon_comm import RabbitMQClient, ServiceDiscovery

class MyService:
    def __init__(self):
        self.mq = RabbitMQClient()
        self.discovery = ServiceDiscovery()
    
    async def start(self):
        await self.mq.connect()
        await self.discovery.register_service(...)
```

### Node.js Services

Install the communication library:
```bash
npm install ../infrastructure/libraries/nodejs/aimon-comm
```

Example service:
```javascript
const { MessageQueue, ServiceDiscovery } = require('aimon-comm');

class MyService {
    constructor() {
        this.mq = new MessageQueue();
        this.discovery = new ServiceDiscovery();
    }
    
    async start() {
        await this.mq.connect();
        await this.discovery.register(...);
    }
}
```

## Monitoring and Observability

### Metrics

Services should expose Prometheus metrics:

```python
from prometheus_client import Counter, Histogram

events_processed = Counter('events_processed_total', 'Total events processed')
processing_time = Histogram('processing_duration_seconds', 'Event processing time')

@processing_time.time()
def process_event(event):
    events_processed.inc()
    # Process event
```

### Logging

Use structured logging with proper levels:

```python
import structlog

logger = structlog.get_logger()

logger.info("Processing event", event_type="KeyPress", session_id="123")
logger.error("Failed to process", error=str(e), event_id="456")
```

### Tracing

For distributed tracing (future enhancement):

```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

with tracer.start_as_current_span("process_event"):
    # Process event
```

## Security

### Authentication
- Services authenticate with API keys
- Inter-service communication uses mTLS (in production)
- Vault manages sensitive credentials

### Authorization
- Role-based access control via Consul ACLs
- API gateway enforces authentication
- Service mesh for zero-trust networking

### Data Protection
- Encrypt sensitive data in transit
- Use Vault for secrets management
- Regular security audits

## Development Guidelines

### Service Requirements

1. **Health Endpoint**: Every service must expose `/health`
2. **Metrics Endpoint**: Expose Prometheus metrics on `/metrics`
3. **Graceful Shutdown**: Handle SIGTERM properly
4. **Service Registration**: Register with Consul on startup
5. **Error Handling**: Implement circuit breakers and retries

### Message Schema

Use consistent message formats:

```json
{
    "type": "EventType",
    "data": {
        // Event-specific data
    },
    "metadata": {
        "timestamp": "2023-12-01T10:30:00Z",
        "source": "service-name",
        "correlation_id": "uuid"
    }
}
```

### Testing

1. **Unit Tests**: Test business logic
2. **Integration Tests**: Test service interactions
3. **Contract Tests**: Verify message contracts
4. **Load Tests**: Ensure performance requirements

## Deployment

### Docker Compose (Development)
```bash
docker-compose up -d
```

### Kubernetes (Production)
```bash
kubectl apply -f k8s/
```

### Scaling
- Services auto-scale based on CPU/memory
- RabbitMQ clustering for high availability
- Redis sentinel for failover
- Consul cluster for reliability

## Troubleshooting

### Common Issues

1. **Service can't connect to RabbitMQ**
   - Check RabbitMQ is running: `docker ps`
   - Verify credentials and URL
   - Check network connectivity

2. **Service not discovered**
   - Verify Consul is running
   - Check service registration
   - Review health check endpoint

3. **Messages not being processed**
   - Check queue bindings in RabbitMQ
   - Verify routing keys
   - Review consumer logs

### Debugging Tools

```bash
# View RabbitMQ queues
docker exec aimon-rabbitmq rabbitmqctl list_queues

# Check Consul services
curl http://localhost:8500/v1/catalog/services

# View service logs
docker-compose logs -f [service-name]

# Monitor metrics
curl http://localhost:9090/metrics
```

## Performance Tuning

### RabbitMQ
- Adjust prefetch count for consumers
- Use persistent messages for critical data
- Configure appropriate TTLs

### Redis
- Set memory limits
- Configure eviction policies
- Use pipelining for bulk operations

### Service Optimization
- Implement connection pooling
- Use batch processing where appropriate
- Cache frequently accessed data

## Contributing

When adding new services:

1. Follow the service template
2. Implement all required endpoints
3. Add service documentation
4. Create integration tests
5. Update deployment configurations

## License

MIT License - See LICENSE file for details