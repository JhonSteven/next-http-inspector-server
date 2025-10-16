#!/usr/bin/env node

import { createWebSocketServer, closeWebSocketServer } from './wsServer';
import { createUIServer } from './uiServer';

interface CLIOptions {
  uiPort?: number;
  wsPort?: number;
  uiPath?: string;
  uiOnly?: boolean;
  wsOnly?: boolean;
  help?: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--ui-port':
        options.uiPort = parseInt(args[++i], 10);
        break;
      case '--ws-port':
        options.wsPort = parseInt(args[++i], 10);
        break;
      case '--ui-path':
        options.uiPath = args[++i];
        break;
      case '--ui-only':
        options.uiOnly = true;
        break;
      case '--ws-only':
        options.wsOnly = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`❌ Unknown option: ${arg}`);
          process.exit(1);
        }
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🔭 Next Http Inspector Server

Usage: next-http-inspector-server [options]

Options:
  --ui-port <port>     Port for the UI server (default: 3001)
  --ws-port <port>     Port for the WebSocket server (default: 8080)
  --ui-path <path>     Path for the UI endpoint (default: /ui)
  --ui-only           Start only the UI server
  --ws-only           Start only the WebSocket server
  --help, -h          Show this help message

Examples:
  next-http-inspector-server
  next-http-inspector-server --ui-port 3002 --ws-port 8081
  next-http-inspector-server --ui-only --ui-port 3003
  next-http-inspector-server --ws-only --ws-port 8082

Environment Variables:
  UI_PORT             Port for the UI server
  WS_PORT             Port for the WebSocket server
  UI_PATH             Path for the UI endpoint
`);
}

function setupGracefulShutdown(servers: { close?: () => void }[]) {
  const shutdown = () => {
    console.log('\n🔄 Shutting down servers...');
    
    servers.forEach(server => {
      if (server && typeof server.close === 'function') {
        try {
          server.close();
        } catch (error) {
          console.error('❌ Error closing server:', error);
        }
      }
    });
    
    closeWebSocketServer();
    
    console.log('✅ Servers closed');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGUSR2', shutdown); // For nodemon
}

export async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  // Set default values
  const uiPort = options.uiPort || parseInt(process.env.UI_PORT || '3001', 10);
  const wsPort = options.wsPort || parseInt(process.env.WS_PORT || '8080', 10);
  const uiPath = options.uiPath || process.env.UI_PATH || '/ui';

  console.log('🚀 Starting Next Http Inspector Server...');
  console.log(`📊 Configuration:`);
  console.log(`   UI Port: ${uiPort}`);
  console.log(`   WS Port: ${wsPort}`);
  console.log(`   UI Path: ${uiPath}`);
  console.log(`   UI Only: ${options.uiOnly || false}`);
  console.log(`   WS Only: ${options.wsOnly || false}`);

  const servers: { close?: () => void }[] = [];

  try {
    // Start WebSocket server
    if (!options.uiOnly) {
      console.log(`\n🧩 Starting WebSocket server on port ${wsPort}...`);
      const wsServer = createWebSocketServer(wsPort);
      servers.push(wsServer);
      console.log(`✅ WebSocket server started on ws://localhost:${wsPort}`);
    }

    // Start UI server
    if (!options.wsOnly) {
      console.log(`\n🌐 Starting UI server on port ${uiPort}...`);
      const uiServer = createUIServer(uiPort, uiPath, wsPort);
      servers.push(uiServer);
      console.log(`✅ UI server started on http://localhost:${uiPort}${uiPath}`);
    }

    // Setup graceful shutdown
    setupGracefulShutdown(servers);

    console.log(`\n🎉 Servers are running!`);
    if (!options.wsOnly) {
      console.log(`🌐 Open your browser and navigate to: http://localhost:${uiPort}${uiPath}`);
    }
    if (!options.uiOnly) {
      console.log(`🧩 WebSocket server is available at: ws://localhost:${wsPort}`);
    }
    console.log(`\n💡 Press Ctrl+C to stop the servers`);

  } catch (error) {
    console.error('❌ Failed to start servers:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  console.error('❌ Application error:', error);
  process.exit(1);
});
