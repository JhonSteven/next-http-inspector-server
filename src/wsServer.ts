// Only import Node.js modules when running in Node.js environment
let WebSocket: any;
let WebSocketServer: any;

// Check if we're running in Node.js environment
const isNodeEnvironment = typeof process !== 'undefined' && process.versions && process.versions.node;

if (isNodeEnvironment) {
  try {
    const wsModule = require('ws');
    WebSocket = wsModule.default || wsModule;
    WebSocketServer = wsModule.WebSocketServer;
  } catch (error) {
    console.warn('⚠️ WebSocket module not available:', error instanceof Error ? error.message : String(error));
  }
}

// Extender el tipo WebSocket para incluir la propiedad isAlive y clientId
interface ExtendedWebSocket {
  isAlive?: boolean;
  clientId?: string;
  readyState?: number;
  send?: (data: any) => void;
  close?: (code?: number, reason?: string) => void;
  terminate?: () => void;
  ping?: () => void;
  on?: (event: string, callback: Function) => void;
}

let globalWsServer: any = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

export function createWebSocketServer(port: number) {
  // Check if Node.js modules are available
  if (!WebSocket || !WebSocketServer) {
    throw new Error('WebSocket module not available. This function requires Node.js environment.');
  }

  try {
    // Si ya existe un servidor, cerrarlo primero
    if (globalWsServer) {
      console.log('🔄 [WEBSOCKET] Closing existing WebSocket server...');
      globalWsServer.close();
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    }

    const wsServer = new WebSocketServer({ port });

    console.log(`🧩 [WEBSOCKET] Server created and running on ws://localhost:${port}`);
    console.log(`🔍 [WEBSOCKET] Server instance:`, wsServer);

    wsServer.on('connection', (ws: any) => {
      const clientId = Date.now() + Math.random().toString(36).substr(2, 9);
      console.log(`📡 [WEBSOCKET] New client connected - ID: ${clientId}`);
      console.log(`📡 [WEBSOCKET] Client readyState: ${ws.readyState}`);
      console.log(`📡 [WEBSOCKET] Total clients: ${wsServer.clients.size}`);
      
      const welcomeMessage = JSON.stringify({ type: 'info', message: 'Connected to next-instrument', clientId });
      console.log(`📤 [WEBSOCKET] Sending welcome message as string:`, welcomeMessage);
      ws.send(welcomeMessage);
      
      // Configurar ping/pong para mantener la conexión viva
      (ws as ExtendedWebSocket).isAlive = true;
      (ws as ExtendedWebSocket).clientId = clientId;
      
      ws.on('pong', () => {
        console.log(`📡 [WEBSOCKET] Pong received from client ${clientId}`);
        (ws as ExtendedWebSocket).isAlive = true;
      });
      
      ws.on('close', (code: any, reason: any) => {
        console.log(`📡 [WEBSOCKET] Client ${clientId} disconnected - Code: ${code}, Reason: ${reason}`);
        console.log(`📡 [WEBSOCKET] Remaining clients: ${wsServer.clients.size}`);
      });
      
      ws.on('error', (error: any) => {
        console.error(`📡 [WEBSOCKET] Client ${clientId} error:`, error);
      });

      ws.on('message', (data: any) => {
        try {
          console.log(`📡 [WEBSOCKET] Raw message from client ${clientId}:`, data);
          console.log(`📡 [WEBSOCKET] Message type:`, typeof data);
          console.log(`📡 [WEBSOCKET] Message constructor:`, data.constructor.name);
          console.log(`📡 [WEBSOCKET] Message length:`, data.length || 'N/A');
          
          const message = JSON.parse(data.toString());
          console.log(`📡 [WEBSOCKET] Parsed message from client ${clientId}:`, message.type);
          
          // Reenviar el mensaje a todos los clientes conectados (excepto el remitente)
          // Siempre enviar como texto JSON para evitar problemas de Buffer
          const messageString = data.toString();
          console.log(`📤 [WEBSOCKET] Converting message to string:`, messageString);
          
          // Verificar que sea JSON válido antes de reenviar
          try {
            const parsedMessage = JSON.parse(messageString);
            console.log(`📤 [WEBSOCKET] Valid JSON message, forwarding to clients`);
            
            wsServer.clients.forEach((client: any) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                try {
                  console.log(`📤 [WEBSOCKET] Forwarding message to client ${(client as ExtendedWebSocket).clientId || 'unknown'}`);
                  // Enviar como string JSON
                  client.send(messageString);
                  console.log(`📤 [WEBSOCKET] Message forwarded successfully to client ${(client as ExtendedWebSocket).clientId || 'unknown'}`);
                } catch (error) {
                  console.error(`❌ [WEBSOCKET] Failed to forward message to client:`, error);
                }
              }
            });
          } catch (parseError) {
            console.error(`❌ [WEBSOCKET] Invalid JSON received, not forwarding:`, parseError);
            console.error(`❌ [WEBSOCKET] Raw data:`, messageString);
          }
        } catch (e) {
          console.log(`📡 [WEBSOCKET] Raw message from client ${clientId}:`, data.toString());
          console.error(`❌ [WEBSOCKET] Error parsing message from client ${clientId}:`, e);
        }
      });
    });

    wsServer.on('error', (error: any) => {
      console.error('❌ [WEBSOCKET] Server error:', error);
    });

    // Configurar heartbeat para mantener conexiones vivas
    heartbeatInterval = setInterval(() => {
      if (wsServer) {
        const clientCount = wsServer.clients.size;
        console.log(`💓 [WEBSOCKET] Heartbeat check - ${clientCount} clients`);
        
        wsServer.clients.forEach((ws: any) => {
          const extendedWs = ws as ExtendedWebSocket;
          const clientId = extendedWs.clientId || 'unknown';
          
          if (extendedWs.isAlive === false) {
            console.log(`📡 [WEBSOCKET] Terminating inactive client ${clientId}`);
            return ws.terminate();
          }
          
          console.log(`💓 [WEBSOCKET] Sending ping to client ${clientId}`);
          extendedWs.isAlive = false;
          ws.ping();
        });
      } else {
        console.log('⚠️ [WEBSOCKET] Heartbeat: No server instance available');
      }
    }, 30000); // Ping cada 30 segundos

    globalWsServer = wsServer;
    return wsServer;
  } catch (error) {
    console.error('❌ Failed to create WebSocket server:', error);
    throw error;
  }
}

export function sendWS(wsServer: any, data: any) {
  if (!wsServer) {
    console.log('❌ [WEBSOCKET] No WebSocket server available for sending message');
    return;
  }

  // Check if WebSocket module is available
  if (!WebSocket) {
    console.log('❌ [WEBSOCKET] WebSocket module not available');
    return;
  }
  
  try {
    const payload = JSON.stringify(data);
    let sentCount = 0;
    let totalClients = wsServer.clients.size;
    
    console.log(`📤 [WEBSOCKET] Attempting to send message to ${totalClients} clients`);
    console.log(`📤 [WEBSOCKET] Message type: ${data.type}`);
    
    wsServer.clients.forEach((client: any) => {
      const clientId = (client as ExtendedWebSocket).clientId || 'unknown';
      console.log(`📤 [WEBSOCKET] Client ${clientId} readyState: ${client.readyState}`);
      
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
          sentCount++;
          console.log(`✅ [WEBSOCKET] Message sent to client ${clientId}`);
        } catch (error) {
          console.error(`❌ [WEBSOCKET] Failed to send message to client ${clientId}:`, error);
        }
      } else {
        console.log(`⚠️ [WEBSOCKET] Client ${clientId} not ready (state: ${client.readyState})`);
      }
    });
    
    console.log(`📊 [WEBSOCKET] Message delivery: ${sentCount}/${totalClients} clients`);
    
    if (sentCount === 0) {
      console.warn('⚠️ [WEBSOCKET] No active WebSocket clients to send message to');
      console.warn('⚠️ [WEBSOCKET] This might indicate a connection issue or hot reload problem');
    }
  } catch (error) {
    console.error('❌ [WEBSOCKET] Failed to serialize WebSocket message:', error);
  }
}

export function getGlobalWsServer(): any {
  return globalWsServer;
}

export function closeWebSocketServer() {
  if (globalWsServer) {
    console.log('🔄 [WEBSOCKET] Closing WebSocket server...');
    console.log(`🔄 [WEBSOCKET] Active clients before close: ${globalWsServer.clients.size}`);
    
    // Notify all clients before closing
    globalWsServer.clients.forEach((client: any) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          const shutdownMessage = JSON.stringify({ type: 'info', message: 'Server shutting down' });
          console.log(`📤 [WEBSOCKET] Sending shutdown message as string:`, shutdownMessage);
          client.send(shutdownMessage);
        } catch (e) {
          console.log('⚠️ [WEBSOCKET] Could not notify client of shutdown');
        }
      }
    });
    
    globalWsServer.close();
    globalWsServer = null;
    console.log('✅ [WEBSOCKET] WebSocket server closed');
  } else {
    console.log('ℹ️ [WEBSOCKET] No WebSocket server to close');
  }
  
  if (heartbeatInterval) {
    console.log('🔄 [WEBSOCKET] Clearing heartbeat interval');
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
