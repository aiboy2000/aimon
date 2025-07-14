#!/bin/bash

# AI Activity Monitor - Infrastructure Setup Script

set -e

echo "Setting up AI Activity Monitor infrastructure..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p config

# Start infrastructure services
echo "Starting infrastructure services..."
docker-compose up -d

# Wait for services to be healthy
echo "Waiting for services to be ready..."
sleep 10

# Check service health
echo "Checking service health..."
docker-compose ps

# Initialize RabbitMQ exchanges and queues
echo "Setting up RabbitMQ..."
docker exec aimon-rabbitmq rabbitmqctl wait /var/lib/rabbitmq/mnesia/rabbit@$HOSTNAME.pid

# Create exchanges
docker exec aimon-rabbitmq rabbitmqadmin -u aimon -p aimon123 declare exchange name=activity_events type=topic durable=true
docker exec aimon-rabbitmq rabbitmqadmin -u aimon -p aimon123 declare exchange name=system_events type=topic durable=true

# Create queues
docker exec aimon-rabbitmq rabbitmqadmin -u aimon -p aimon123 declare queue name=activity_db_queue durable=true
docker exec aimon-rabbitmq rabbitmqadmin -u aimon -p aimon123 declare queue name=parser_queue durable=true
docker exec aimon-rabbitmq rabbitmqadmin -u aimon -p aimon123 declare queue name=ai_summarizer_queue durable=true

# Create bindings
docker exec aimon-rabbitmq rabbitmqadmin -u aimon -p aimon123 declare binding source=activity_events destination=activity_db_queue routing_key="input.*"
docker exec aimon-rabbitmq rabbitmqadmin -u aimon -p aimon123 declare binding source=activity_events destination=parser_queue routing_key="raw.*"

# Register services in Consul
echo "Registering services in Consul..."
curl -X PUT -d '{
  "ID": "activity-db",
  "Name": "activity-db",
  "Tags": ["api", "database"],
  "Address": "localhost",
  "Port": 8080,
  "Check": {
    "HTTP": "http://localhost:8080/health",
    "Interval": "10s"
  }
}' http://localhost:8500/v1/agent/service/register

echo ""
echo "Infrastructure setup complete!"
echo ""
echo "Service URLs:"
echo "  - RabbitMQ Management: http://localhost:15672 (user: aimon, pass: aimon123)"
echo "  - Traefik Dashboard: http://localhost:8080"
echo "  - Consul UI: http://localhost:8500"
echo "  - Vault UI: http://localhost:8200 (token: aimon-dev-token)"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3000 (user: admin, pass: aimon123)"
echo "  - Kibana: http://localhost:5601"
echo "  - Redis: localhost:6379"
echo ""
echo "To stop all services: docker-compose down"
echo "To view logs: docker-compose logs -f [service-name]"