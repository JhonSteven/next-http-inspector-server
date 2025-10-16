// Export all server functions for programmatic use
export { 
  createWebSocketServer, 
  sendWS, 
  getGlobalWsServer, 
  closeWebSocketServer 
} from './wsServer';

export { 
  createUIServer 
} from './uiServer';

// Export CLI function for programmatic use
export { main as runCLI } from './cli';
