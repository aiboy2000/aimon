#!/bin/bash

# AI Activity Monitor - Quick Start Script
# This script sets up and starts the entire AI Activity Monitor ecosystem

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AIMON_DIR="$SCRIPT_DIR/aimon"

echo "================================================"
echo "    AI Activity Monitor - Quick Start Setup     "
echo "================================================"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

if ! command_exists python3; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+ first."
    echo "   Visit: https://www.python.org/"
    exit 1
fi

echo "✅ All prerequisites are installed"
echo ""

# Navigate to aimon directory
cd "$AIMON_DIR"

# Step 1: Start infrastructure services
echo "Step 1: Starting infrastructure services..."
echo "----------------------------------------"
cd infrastructure

if [ ! -f "scripts/setup.sh" ]; then
    echo "❌ Setup script not found. Please ensure you have the complete repository."
    exit 1
fi

# Make scripts executable
chmod +x scripts/setup.sh

# Run infrastructure setup
./scripts/setup.sh

echo "✅ Infrastructure services started"
echo ""

# Step 2: Install dependencies for all modules
echo "Step 2: Installing module dependencies..."
echo "----------------------------------------"
cd "$AIMON_DIR"

# Create install script if it doesn't exist
if [ ! -f "install-all.sh" ]; then
    cat > install-all.sh << 'EOF'
#!/bin/bash
set -e

echo "Installing dependencies for all modules..."

MODULES_DIR="$(pwd)/modules"

# TypeScript/Node.js modules
NODE_MODULES=(
    "activity-parser"
    "ai-summarizer"
    "ime-adapter"
    "context-detector"
    "monitor-dashboard"
)

# Python modules
PYTHON_MODULES=(
    "activity-db"
)

# Install Node.js modules
for module in "${NODE_MODULES[@]}"; do
    if [ -d "$MODULES_DIR/$module" ]; then
        echo "Installing $module dependencies..."
        cd "$MODULES_DIR/$module"
        if [ -f "package.json" ]; then
            npm install
        fi
    fi
done

# Install Python modules
for module in "${PYTHON_MODULES[@]}"; do
    if [ -d "$MODULES_DIR/$module" ]; then
        echo "Installing $module dependencies..."
        cd "$MODULES_DIR/$module"
        if [ -f "requirements.txt" ]; then
            pip3 install -r requirements.txt
        elif [ -f "pyproject.toml" ]; then
            pip3 install -e .
        fi
    fi
done

# Build Rust module
if [ -d "$MODULES_DIR/input-monitor" ]; then
    echo "Building input-monitor..."
    cd "$MODULES_DIR/input-monitor"
    if command -v cargo &> /dev/null; then
        cargo build --release
    else
        echo "⚠️  Rust/Cargo not installed. Skipping input-monitor build."
        echo "   Install Rust from: https://rustup.rs/"
    fi
fi

echo "✅ All dependencies installed"
EOF
    chmod +x install-all.sh
fi

./install-all.sh

echo ""

# Step 3: Create start script
echo "Step 3: Creating start script..."
echo "--------------------------------"

if [ ! -f "start-all.sh" ]; then
    cat > start-all.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting all AI Activity Monitor services..."

MODULES_DIR="$(pwd)/modules"

# Start Python services
echo "Starting activity-db..."
cd "$MODULES_DIR/activity-db"
python3 -m activity_db.main &

# Start TypeScript services
echo "Starting activity-parser..."
cd "$MODULES_DIR/activity-parser"
npm run dev &

echo "Starting ime-adapter..."
cd "$MODULES_DIR/ime-adapter"
npm run dev &

echo "Starting ai-summarizer..."
cd "$MODULES_DIR/ai-summarizer"
npm run dev &

# Start monitor dashboard
echo "Starting monitor-dashboard..."
cd "$MODULES_DIR/monitor-dashboard"
npm start &

# Start Rust service if built
if [ -f "$MODULES_DIR/input-monitor/target/release/input-monitor" ]; then
    echo "Starting input-monitor..."
    cd "$MODULES_DIR/input-monitor"
    ./target/release/input-monitor &
fi

echo ""
echo "✅ All services started!"
echo ""
echo "Service URLs:"
echo "  - Monitor Dashboard: http://localhost:3001"
echo "  - Activity Database API: http://localhost:8000"
echo "  - RabbitMQ Management: http://localhost:15672"
echo "  - Grafana: http://localhost:3000"
echo "  - Consul UI: http://localhost:8500"
echo ""
echo "To stop all services, press Ctrl+C"

# Wait for interrupt
wait
EOF
    chmod +x start-all.sh
fi

# Step 4: Start all services
echo ""
echo "Step 4: Starting all services..."
echo "--------------------------------"
./start-all.sh