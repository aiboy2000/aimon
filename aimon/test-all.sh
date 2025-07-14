#!/bin/bash
set -e

echo "🧪 Running tests for all AI Activity Monitor modules..."
echo ""

MODULES_DIR="$(pwd)/modules"
FAILED_TESTS=()

# TypeScript/Node.js modules
NODE_MODULES=(
    "activity-parser"
    "ai-summarizer"
    "ime-adapter"
    "context-detector"
)

# Python modules
PYTHON_MODULES=(
    "activity-db"
)

# Test Node.js modules
for module in "${NODE_MODULES[@]}"; do
    if [ -d "$MODULES_DIR/$module" ]; then
        echo "Testing $module..."
        cd "$MODULES_DIR/$module"
        if [ -f "package.json" ] && grep -q '"test"' package.json; then
            if npm test; then
                echo "✅ $module tests passed"
            else
                echo "❌ $module tests failed"
                FAILED_TESTS+=("$module")
            fi
        else
            echo "⚠️  No tests found for $module"
        fi
        echo ""
    fi
done

# Test Python modules
for module in "${PYTHON_MODULES[@]}"; do
    if [ -d "$MODULES_DIR/$module" ]; then
        echo "Testing $module..."
        cd "$MODULES_DIR/$module"
        if [ -f "tests" ] || [ -d "tests" ]; then
            if python3 -m pytest tests/; then
                echo "✅ $module tests passed"
            else
                echo "❌ $module tests failed"
                FAILED_TESTS+=("$module")
            fi
        elif [ -f "test_*.py" ]; then
            if python3 -m pytest test_*.py; then
                echo "✅ $module tests passed"
            else
                echo "❌ $module tests failed"
                FAILED_TESTS+=("$module")
            fi
        else
            echo "⚠️  No tests found for $module"
        fi
        echo ""
    fi
done

# Test Rust module
if [ -d "$MODULES_DIR/input-monitor" ]; then
    echo "Testing input-monitor..."
    cd "$MODULES_DIR/input-monitor"
    if command -v cargo &> /dev/null; then
        if cargo test; then
            echo "✅ input-monitor tests passed"
        else
            echo "❌ input-monitor tests failed"
            FAILED_TESTS+=("input-monitor")
        fi
    else
        echo "⚠️  Rust/Cargo not installed. Skipping input-monitor tests."
    fi
    echo ""
fi

# Summary
echo "================================"
echo "         Test Summary           "
echo "================================"

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Failed tests:"
    for module in "${FAILED_TESTS[@]}"; do
        echo "   - $module"
    done
    exit 1
fi