#!/bin/bash
set -e

echo "🚀 Starting all AI Activity Monitor services..."
echo ""

MODULES_DIR="$(pwd)/modules"
PIDS=()

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping all services..."
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
        fi
    done
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Python services
echo "Starting activity-db..."
cd "$MODULES_DIR/activity-db"
python3 -m activity_db.main &
PIDS+=($!)
sleep 2

# Start TypeScript services
echo "Starting activity-parser..."
cd "$MODULES_DIR/activity-parser"
npm run dev &
PIDS+=($!)
sleep 1

echo "Starting ime-adapter..."
cd "$MODULES_DIR/ime-adapter"
npm run dev &
PIDS+=($!)
sleep 1

echo "Starting ai-summarizer..."
cd "$MODULES_DIR/ai-summarizer"
if [ -f "src/index.ts" ]; then
    npm run dev &
    PIDS+=($!)
    sleep 1
fi

# Start monitor dashboard
echo "Starting monitor-dashboard..."
cd "$MODULES_DIR/monitor-dashboard"
if [ -f "package.json" ]; then
    npm start &
    PIDS+=($!)
fi

# Start Rust service if built
if [ -f "$MODULES_DIR/input-monitor/target/release/input-monitor" ]; then
    echo "Starting input-monitor..."
    cd "$MODULES_DIR/input-monitor"
    ./target/release/input-monitor &
    PIDS+=($!)
fi

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Service URLs:"
echo "  - Monitor Dashboard: http://localhost:3000"
echo "  - Activity Database API: http://localhost:8000"
echo "  - RabbitMQ Management: http://localhost:15672 (aimon/aimon123)"
echo "  - Grafana: http://localhost:3000 (admin/aimon123)"
echo "  - Consul UI: http://localhost:8500"
echo "  - Traefik Dashboard: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all background processes
wait