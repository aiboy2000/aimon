# AI Activity Monitor

An intelligent PC activity monitoring system that helps you understand and optimize your work patterns through AI-powered analysis.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for TypeScript modules)
- Python 3.9+ (for Python modules)
- Rust 1.70+ (for Rust modules)
- Git

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-activity-monitor
cd ai-activity-monitor

# Run the quick start script
./quickstart.sh
```

### Manual Setup

1. **Start Infrastructure Services**
```bash
cd aimon/infrastructure
./scripts/setup.sh
```

2. **Install Module Dependencies**
```bash
# Install all module dependencies
cd aimon
./install-all.sh
```

3. **Start All Services**
```bash
# From aimon directory
./start-all.sh
```

## 📊 Access the Services

Once everything is running, you can access:

- **Monitor Dashboard**: http://localhost:3001
- **Activity Database API**: http://localhost:8000
- **RabbitMQ Management**: http://localhost:15672 (aimon/aimon123)
- **Grafana**: http://localhost:3000 (admin/aimon123)
- **Consul UI**: http://localhost:8500

## 🏗️ Architecture Overview

The system consists of multiple microservices:

- **input-monitor** (Rust): Captures keyboard, mouse, and screen activity
- **ime-adapter** (TypeScript): Handles input method editor integration
- **activity-parser** (TypeScript): Structures raw activity data
- **ai-summarizer** (TypeScript): Generates AI-powered summaries
- **activity-db** (Python): Stores and serves activity data
- **monitor-dashboard** (React): Real-time monitoring interface

## 📖 Documentation

For detailed documentation, see the [aimon/README.md](aimon/README.md) file.

## 🛠️ Development

### Running Individual Modules

```bash
# Example: Run activity-parser
cd aimon/modules/activity-parser
npm install
npm run dev
```

### Running Tests

```bash
# Run all tests
cd aimon
./test-all.sh

# Run tests for specific module
cd aimon/modules/[module-name]
npm test  # or cargo test, or pytest
```

## 🤝 Contributing

Please read our contributing guidelines in the main documentation.

## 📄 License

MIT License - see LICENSE file for details.