# Next Http Inspector Server

Standalone HTTP and WebSocket servers for Next.js HTTP Inspector that can run independently from the instrumentation.

## Features

- 🌐 **UI Server**: Web interface to monitor HTTP requests
- 🧩 **WebSocket Server**: Real-time communication with instrumentation
- 🚀 **CLI**: Command-line interface to run servers
- 📦 **Independent**: Can run without Next.js instrumentation

## Installation

> **💡 For regular users**: Use global installation. Local installation is only for developers who want to modify the source code.

### Global Installation (Recommended)

```bash
# Install globally to use from any project
npm install -g next-http-inspector-server
```

### Local Installation (Contributors Only)

```bash
# Only if you want to modify the server source code
git clone <repository-url>
cd next-http-inspector-server
npm install
npm run build
```

## Usage

### CLI (After global installation)

```bash
# Run both servers
next-inspector-server

# UI server only
next-inspector-server --ui-only

# WebSocket server only
next-inspector-server --ws-only

# Configure ports
next-inspector-server --ui-port 3002 --ws-port 8081

# Show help
next-inspector-server --help
```

### CLI (Without global installation)

```bash
# Run directly with npx
npx next-inspector-server --ui-port 3001 --ws-port 8080
```

### Programmatic

```typescript
import { 
  createWebSocketServer, 
  createUIServer, 
  closeWebSocketServer 
} from 'next-http-inspector-server';

// Create WebSocket server
const wsServer = createWebSocketServer(8080);

// Create UI server
const uiServer = createUIServer(3001, '/ui', 8080);

// Close WebSocket server
closeWebSocketServer();
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--ui-port` | Port for UI server | 3001 |
| `--ws-port` | Port for WebSocket server | 8080 |
| `--ui-path` | Path for UI endpoint | /ui |
| `--ui-only` | Run UI server only | false |
| `--ws-only` | Run WebSocket server only | false |
| `--help, -h` | Show help | - |

## Environment Variables

- `UI_PORT`: Port for UI server
- `WS_PORT`: Port for WebSocket server
- `UI_PATH`: Path for UI endpoint

## Development

```bash
# Compile TypeScript
npm run build

# Development mode (watch)
npm run dev

# Run server
npm start
```

## Complete Workflow

### 1. Install the server globally
```bash
npm install -g next-http-inspector-server
```

### 2. Run the server (in separate terminal)
```bash
next-inspector-server --ui-port 3001 --ws-port 8080
```

### 3. In your Next.js project, install the interceptors
```bash
npm install --save-dev next-http-inspector
```

### 4. Configure instrumentation
Create `instrumentation.ts` in your project root:
```typescript
import { setupNextInstrument } from 'next-http-inspector';

export function register() {
  setupNextInstrument({
    logFetch: true,
    logConsole: true,
    logErrors: true,
    websocket: { enabled: true, port: 8080 }
  });
}
```

### 5. Run your Next.js application
```bash
npm run dev
```

### 6. Access the monitoring interface
Open [http://localhost:3001/ui](http://localhost:3001/ui) in your browser.

## Next.js Integration

This package is designed to work with `next-http-inspector`. The Next.js instrumentation will automatically connect to these servers when they are running.

## Architecture

```
next-http-inspector-server/
├── src/
│   ├── cli.ts          # CLI interface
│   ├── index.ts        # Main exports
│   ├── uiServer.ts     # UI server
│   ├── wsServer.ts     # WebSocket server
│   └── ui/
│       └── styles.ts   # CSS styles
├── dist/               # Compiled code
├── package.json
└── tsconfig.json
```

## License

MIT
