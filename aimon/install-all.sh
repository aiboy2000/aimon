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
        echo ""
        echo "📦 Installing $module dependencies..."
        cd "$MODULES_DIR/$module"
        if [ -f "package.json" ]; then
            npm install
            echo "✅ $module dependencies installed"
        fi
    fi
done

# Install Python modules
for module in "${PYTHON_MODULES[@]}"; do
    if [ -d "$MODULES_DIR/$module" ]; then
        echo ""
        echo "🐍 Installing $module dependencies..."
        cd "$MODULES_DIR/$module"
        if [ -f "requirements.txt" ]; then
            pip3 install -r requirements.txt
            echo "✅ $module dependencies installed"
        elif [ -f "pyproject.toml" ]; then
            pip3 install -e .
            echo "✅ $module dependencies installed"
        fi
    fi
done

# Build Rust module
if [ -d "$MODULES_DIR/input-monitor" ]; then
    echo ""
    echo "🦀 Building input-monitor..."
    cd "$MODULES_DIR/input-monitor"
    if command -v cargo &> /dev/null; then
        cargo build --release
        echo "✅ input-monitor built successfully"
    else
        echo "⚠️  Rust/Cargo not installed. Skipping input-monitor build."
        echo "   Install Rust from: https://rustup.rs/"
    fi
fi

echo ""
echo "✅ All dependencies installed successfully!"