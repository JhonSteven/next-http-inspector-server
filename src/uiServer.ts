import { getStyle } from './ui/styles';

// Only import Node.js modules when running in Node.js environment
let createServer: any;
let Server: any;

// Get version from package.json
let version = '0.0.0';
try {
  const packageJson = require('../package.json');
  version = packageJson.version || '0.0.0';
} catch (error) {
  try {
    // Fallback: try reading from file system
    const fs = require('fs');
    const path = require('path');
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    version = packageJson.version || '0.0.0';
  } catch (fallbackError) {
    console.warn('⚠️ Could not read version from package.json:', error instanceof Error ? error.message : String(error));
  }
}

// Check if we're running in Node.js environment
const isNodeEnvironment = typeof process !== 'undefined' && process.versions && process.versions.node;

if (isNodeEnvironment) {
  try {
    const httpModule = require('http');
    createServer = httpModule.createServer;
    Server = httpModule.Server;
  } catch (error) {
    console.warn('⚠️ HTTP module not available:', error instanceof Error ? error.message : String(error));
  }
}

export function createUIServer(port: number, path: string = '/ui', wsPort: number = 8080): any {
  // Check if Node.js modules are available
  if (!createServer || !Server) {
    throw new Error('HTTP module not available. This function requires Node.js environment.');
  }

  const server = createServer((req: any, res: any) => {
    // Handle CORS for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.url === path) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(getReactUIHTML(wsPort));
    } else if (req.url === '/api/logs' && req.method === 'POST') {
      // Handle HTTP log endpoint
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const logData = JSON.parse(body);
          console.log('📡 [HTTP_LOG] Received log via HTTP:', logData.type);
          
          // Forward the log to WebSocket clients
          const { getGlobalWsServer, sendWS } = require('./wsServer');
          const wsServer = getGlobalWsServer();
          
          if (wsServer) {
            sendWS(wsServer, logData);
            console.log('📤 [HTTP_LOG] Forwarded log to WebSocket clients');
          } else {
            console.log('⚠️ [HTTP_LOG] No WebSocket server available to forward log');
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Log received and forwarded' }));
        } catch (error) {
          console.error('❌ [HTTP_LOG] Error processing log:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  server.listen(port, () => {
    console.log(`🌐 next-instrument UI available at http://localhost:${port}${path}`);
    console.log(`📡 HTTP log endpoint available at http://localhost:${port}/api/logs`);
  });

  return server;
}

// HTML Template Functions
function getHTMLHead(wsPort: number): string {
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Next Http Server Inspector - Network Monitor</title>
    ${getStyle()}
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>`;
}

function getReactScript(wsPort: number): string {
  return `
    <script type="text/babel">
        ${getReactConstants()}
        ${getCustomHooks()}
        ${getReactComponents()}
        ${getMainApp()}
        ${getAppRenderer(wsPort)}
    </script>`;
}

function getReactConstants(): string {
  return `
        const { useState, useEffect, useCallback } = React;

        // App version
        const APP_VERSION = '${version}';

        // Types
        const FilterType = {
            ALL: 'ALL',
            GET: 'GET',
            POST: 'POST',
            PUT: 'PUT',
            DELETE: 'DELETE',
            ERROR: 'ERROR'
        };`;
}

// Custom Hooks
function getCustomHooks(): string {
  return `
        // Custom Hooks
        function useWebSocket(wsPort, onMessage) {
            const [isConnected, setIsConnected] = useState(false);
            const [ws, setWs] = useState(null);
            const [reconnectAttempts, setReconnectAttempts] = useState(0);
            const [isReconnecting, setIsReconnecting] = useState(false);
            const [connectionError, setConnectionError] = useState(null);
            const [lastConnectionTime, setLastConnectionTime] = useState(null);
            
            // Load persisted messageCount from localStorage
            const loadPersistedMessageCount = () => {
                try {
                    const saved = localStorage.getItem('next-telescope-message-count');
                    if (saved) {
                        const count = parseInt(saved, 10);
                        console.log('🔄 [WEBSOCKET] Restoring message count from localStorage:', count);
                        return count;
                    }
                } catch (e) {
                    console.warn('⚠️ [WEBSOCKET] Failed to load persisted message count:', e);
                }
                return 0;
            };
            
            const [messageCount, setMessageCount] = useState(loadPersistedMessageCount);

            const connectWebSocket = () => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    return;
                }

                try {
                    setConnectionError(null);
                    console.log(\`Attempting to connect to WebSocket on port \${wsPort}...\`);
                    const websocket = new WebSocket(\`ws://localhost:\${wsPort}\`);
                    
                    websocket.onopen = () => {
                        console.log(\`✅ Connected to WebSocket on port \${wsPort}\`);
                        setIsConnected(true);
                        setWs(websocket);
                        setReconnectAttempts(0);
                        setIsReconnecting(false);
                        setConnectionError(null);
                        setLastConnectionTime(new Date().toISOString());
                    };
                    
                    websocket.onmessage = (event) => {
                        console.log('📨 [WEBSOCKET] Raw message received');
                        console.log('📨 [WEBSOCKET] Message type:', typeof event.data);
                        console.log('📨 [WEBSOCKET] Message constructor:', event.data.constructor.name);
                        
                        setMessageCount(prev => {
                            const newCount = prev + 1;
                            // Persist the counter in localStorage
                            try {
                                localStorage.setItem('next-telescope-message-count', newCount.toString());
                                console.log('💾 [WEBSOCKET] Persisted message count to localStorage:', newCount);
                            } catch (e) {
                                console.warn('⚠️ [WEBSOCKET] Failed to persist message count:', e);
                            }
                            return newCount;
                        });
                        
                        try {
                            // Handle different message types in browser
                            let textData;
                            
                            if (event.data instanceof ArrayBuffer) {
                                // Convert ArrayBuffer to string
                                const decoder = new TextDecoder('utf-8');
                                textData = decoder.decode(event.data);
                                console.log('📨 [WEBSOCKET] Converted ArrayBuffer to text:', textData);
                            } else if (typeof event.data === 'string') {
                                // Already text
                                textData = event.data;
                                console.log('📨 [WEBSOCKET] Received text message');
                            } else {
                                // Convert other types to string
                                textData = event.data.toString();
                                console.log('📨 [WEBSOCKET] Converted to text:', textData);
                            }
                            
                            const data = JSON.parse(textData);
                            console.log('📨 [WEBSOCKET] Parsed message:', data);
                            console.log('📨 [WEBSOCKET] Total messages received:', messageCount + 1);
                            onMessage(data);
                        } catch (e) {
                            console.error('❌ [WEBSOCKET] Error parsing WebSocket message:', e);
                            console.error('❌ [WEBSOCKET] Raw data:', event.data);
                            console.error('❌ [WEBSOCKET] Data type:', typeof event.data);
                            console.error('❌ [WEBSOCKET] Data constructor:', event.data.constructor.name);
                        }
                    };
                    
                    websocket.onclose = (event) => {
                        console.log('WebSocket disconnected:', event.code, event.reason);
                        setIsConnected(false);
                        setWs(null);
                        
                        // Only attempt reconnection if it wasn't a manual close and we haven't exceeded max attempts
                        if (event.code !== 1000 && reconnectAttempts < 10) {
                            setIsReconnecting(true);
                            const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 15000); // Max 15 seconds, exponential backoff
                            console.log(\`🔄 Attempting to reconnect in \${delay/1000} seconds... (attempt \${reconnectAttempts + 1}/10)\`);
                            
                            setTimeout(() => {
                                setReconnectAttempts(prev => prev + 1);
                                connectWebSocket();
                            }, delay);
                        } else if (reconnectAttempts >= 10) {
                            console.error('❌ Max reconnection attempts reached.');
                            setIsReconnecting(false);
                            setConnectionError('Unable to connect to WebSocket server. Make sure the Next.js app is running with instrumentation enabled. Try refreshing the page.');
                        }
                    };
                    
                    websocket.onerror = (error) => {
                        console.error('WebSocket error:', error);
                        setIsConnected(false);
                        setIsReconnecting(false);
                        setConnectionError('WebSocket connection failed. Check if the server is running.');
                    };

                } catch (error) {
                    console.error('Failed to create WebSocket connection:', error);
                    setIsConnected(false);
                    setIsReconnecting(false);
                    setConnectionError('Failed to create WebSocket connection.');
                }
            };

            const manualReconnect = () => {
                console.log('🔄 Manual reconnection requested...');
                if (ws) {
                    ws.close(1000, 'Manual reconnection');
                }
                setReconnectAttempts(0);
                setIsReconnecting(false);
                setConnectionError(null);
                setTimeout(() => {
                    connectWebSocket();
                }, 100);
            };

            // Auto-reconnect on page visibility change (useful for hot reloads)
            useEffect(() => {
                const handleVisibilityChange = () => {
                    if (document.visibilityState === 'visible' && !isConnected && !isReconnecting) {
                        console.log('🔄 Page became visible, attempting to reconnect...');
                        manualReconnect();
                    }
                };

                document.addEventListener('visibilitychange', handleVisibilityChange);
                return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
            }, [isConnected, isReconnecting]);

            // Periodic connection check
            useEffect(() => {
                const checkConnection = () => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        // Send ping to keep connection alive
                        ws.send(JSON.stringify({ type: 'ping' }));
                    } else if (!isReconnecting && !connectionError) {
                        // If not connected and not already trying to reconnect, try to reconnect
                        console.log('🔄 Connection lost, attempting to reconnect...');
                        manualReconnect();
                    }
                };

                const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
                return () => clearInterval(interval);
            }, [ws, isReconnecting, connectionError]);

            useEffect(() => {
                console.log('🔄 [WEBSOCKET] useEffect triggered - wsPort:', wsPort);
                connectWebSocket();

                return () => {
                    console.log('🔄 [WEBSOCKET] Cleanup - closing WebSocket');
                    if (ws) {
                        ws.close(1000, 'Component unmounting');
                    }
                };
            }, [wsPort]);

            // Additional effect to detect hot reload and reconnect if necessary
            useEffect(() => {
                // If not connected after a while, attempt to reconnect
                const timeout = setTimeout(() => {
                    if (!isConnected && !isReconnecting) {
                        console.log('🔄 [WEBSOCKET] Hot reload detected - attempting to reconnect');
                        connectWebSocket();
                    }
                }, 1000);

                return () => clearTimeout(timeout);
            }, [isConnected, isReconnecting]);

            return { isConnected, ws, isReconnecting, connectionError, manualReconnect, lastConnectionTime, messageCount };
        }

        function useTheme() {
            const [theme, setTheme] = useState('light');

            useEffect(() => {
                const savedTheme = localStorage.getItem('theme') || 'light';
                setTheme(savedTheme);
                document.documentElement.setAttribute('data-theme', savedTheme);
            }, []);

            const toggleTheme = () => {
                const newTheme = theme === 'dark' ? 'light' : 'dark';
                setTheme(newTheme);
                localStorage.setItem('theme', newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
            };

            return { theme, toggleTheme };
        }`;
}

// React Components
function getReactComponents(): string {
  return `
        // Components
        ${getHeaderComponent()}
        ${getToolbarComponent()}
        ${getNetworkItemComponent()}
        ${getTimelineComponent()}
        ${getNetworkTableComponent()}`;
}

function getHeaderComponent(): string {
  return `
        function Header({ onToggleTheme, onClearAll, theme, onReconnect, connectionError, isConnected, isReconnecting, lastConnectionTime, messageCount, requests }) {
            return React.createElement('div', { className: 'header' },
                React.createElement('h1', null, '🔭 Next Http Server Inspector v' + APP_VERSION),
                React.createElement('div', { className: 'header-controls' },
                    React.createElement('div', { 
                        className: 'connection-status',
                        style: { 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            fontSize: '11px',
                            color: 'var(--text-secondary)'
                        }
                    },
                        React.createElement('span', { 
                            style: { 
                                color: isConnected ? 'var(--success-color)' : 
                                       isReconnecting ? 'var(--warning-color)' : 'var(--error-color)' 
                            }
                        }, isConnected ? '🟢' : isReconnecting ? '🟡' : '🔴'),
                        React.createElement('span', null, isConnected ? 'connected' : isReconnecting ? 'reconnecting...' : 'disconnected'),
                        lastConnectionTime && isConnected && React.createElement('span', { 
                            style: { fontSize: '10px', opacity: 0.7 }
                        }, \`(\${new Date(lastConnectionTime).toLocaleTimeString()})\`),
                        React.createElement('span', { 
                            style: { fontSize: '10px', opacity: 0.7, marginLeft: '8px' }
                        }, \`Messages: \${messageCount}\`),
                        React.createElement('span', { 
                            style: { fontSize: '10px', opacity: 0.7, marginLeft: '8px' }
                        }, \`Requests: \${requests.length}\`)
                    ),
                    (connectionError || !isConnected) && React.createElement('button', { 
                        className: 'reconnect-btn', 
                        onClick: onReconnect,
                        title: 'Reconnect to WebSocket',
                        disabled: isReconnecting
                    }, isReconnecting ? '⏳' : '🔄 Reconnect'),
                    React.createElement('button', { 
                        className: 'theme-toggle', 
                        onClick: onToggleTheme 
                    }, theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'),
                    React.createElement('button', { 
                        className: 'clear-btn', 
                        onClick: onClearAll 
                    }, '🗑️ Clear All')
                )
            );
        }`;
}

function getToolbarComponent(): string {
  return `
        function Toolbar({ filter, onFilterChange, stats, isConnected, isReconnecting }) {
            const filters = ['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'ERROR'];

            return React.createElement('div', { className: 'toolbar' },
                React.createElement('div', { className: 'filters' },
                    ...filters.map(filterType => 
                        React.createElement('button', {
                            key: filterType,
                            className: \`filter-btn \${filter === filterType ? 'active' : ''}\`,
                            onClick: () => onFilterChange(filterType)
                        }, filterType)
                    )
                ),
                React.createElement('div', { className: 'stats' },
                    React.createElement('div', { className: 'stat-item' },
                        React.createElement('span', { className: 'stat-number' }, stats.total),
                        React.createElement('span', null, 'requests')
                    ),
                    React.createElement('div', { className: 'stat-item' },
                        React.createElement('span', { className: 'stat-number' }, 
                            stats.total > 0 ? \`\${stats.successful}/\${stats.total}\` : '0/0'
                        ),
                        React.createElement('span', null, 'success')
                    ),
                    React.createElement('div', { className: 'stat-item' },
                        React.createElement('span', { className: 'stat-number' }, \`\${stats.avgDuration}ms\`),
                        React.createElement('span', null, 'avg time')
                    ),
                    React.createElement('div', { className: 'stat-item' },
                        React.createElement('span', { className: 'stat-number' }, \`\${stats.totalDuration}ms\`),
                        React.createElement('span', null, 'total time')
                    ),
                    React.createElement('div', { className: 'stat-item' },
                        React.createElement('span', { className: 'stat-number' }, stats.errors),
                        React.createElement('span', null, 'errors')
                    ),
                    React.createElement('div', { className: 'stat-item' },
                        React.createElement('span', { 
                            className: 'stat-number', 
                            style: { 
                                color: isConnected ? 'var(--success-color)' : 
                                       isReconnecting ? 'var(--warning-color)' : 'var(--error-color)' 
                            }
                        }, isConnected ? '🟢' : isReconnecting ? '🟡' : '🔴'),
                        React.createElement('span', null, isConnected ? 'connected' : isReconnecting ? 'reconnecting...' : 'disconnected')
                    )
                )
            );
        }`;
}

function getNetworkItemComponent(): string {
  return `
        function NetworkItem({ request, isExpanded, onToggleExpand }) {
            const [activeTab, setActiveTab] = React.useState('details');
            
            const formatTime = (dateString) => {
                const date = new Date(dateString);
                return date.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit',
                    fractionalSecondDigits: 3
                });
            };

            ${getJsonValueComponent()}
            ${getRequestDetailsRenderer()}
            ${getResponseBodyRenderer()}

            if (request.type === 'fetch_error') {
                return React.createElement('div', { 
                    className: 'network-item error-item', 
                    'data-id': request.id 
                },
                    React.createElement('div', { 
                        className: 'network-row', 
                        onClick: () => onToggleExpand(request.id) 
                    },
                        React.createElement('div', { className: 'network-url' },
                            React.createElement('span', { 
                                className: \`expand-icon \${isExpanded ? 'expanded' : ''}\` 
                            }, '▶'),
                            React.createElement('span', null, request.url)
                        ),
                        React.createElement('div', { 
                            className: \`network-method method-\${request.method} error\` 
                        }, request.method),
                        React.createElement('div', { 
                            className: 'network-status', 
                            style: { color: 'var(--error-color)' } 
                        }, 'ERROR'),
                        React.createElement('div', { className: 'network-duration' }, request.duration),
                        React.createElement('div', { className: 'network-time' }, formatTime(request.startDate))
                    ),
                    isExpanded && React.createElement('div', { className: 'network-details' },
                        React.createElement('div', { className: 'error-message' }, \`Error: \${request.error}\`),
                        React.createElement('div', { className: 'tabs-container' },
                            React.createElement('div', { className: 'tabs-header' },
                                React.createElement('button', {
                                    className: \`tab-button \${activeTab === 'details' ? 'active' : ''}\`,
                                    onClick: () => setActiveTab('details')
                                }, 'Details')
                            ),
                            React.createElement('div', { 
                                className: \`tab-content \${activeTab === 'details' ? 'active' : ''}\`
                            },
                                React.createElement('div', { 
                                    dangerouslySetInnerHTML: { __html: renderRequestDetails(request) } 
                                })
                            )
                        )
                    )
                );
            }

            const statusClass = request.status && request.status >= 200 && request.status < 300 ? 'status-2xx' :
                              request.status && request.status >= 300 && request.status < 400 ? 'status-3xx' :
                              request.status && request.status >= 400 && request.status < 500 ? 'status-4xx' : 'status-5xx';

            return React.createElement('div', { 
                className: 'network-item', 
                'data-id': request.id 
            },
                React.createElement('div', { 
                    className: 'network-row', 
                    onClick: () => onToggleExpand(request.id) 
                },
                    React.createElement('div', { className: 'network-url' },
                        React.createElement('span', { 
                            className: \`expand-icon \${isExpanded ? 'expanded' : ''}\` 
                        }, '▶'),
                        React.createElement('span', null, request.url)
                    ),
                    React.createElement('div', { 
                        className: \`network-method method-\${request.method}\${request.status && request.status >= 400 ? ' error' : ''}\` 
                    }, request.method),
                    React.createElement('div', { 
                        className: \`network-status \${statusClass}\` 
                    }, request.status),
                    React.createElement('div', { className: 'network-duration' }, request.duration),
                    React.createElement('div', { className: 'network-time' }, formatTime(request.startDate))
                ),
                isExpanded && React.createElement('div', { className: 'network-details' },
                    React.createElement('div', { className: 'tabs-container' },
                        React.createElement('div', { className: 'tabs-header' },
                            React.createElement('button', {
                                className: \`tab-button \${activeTab === 'details' ? 'active' : ''}\`,
                                onClick: () => setActiveTab('details')
                            }, 'Details'),
                            React.createElement('button', {
                                className: \`tab-button \${activeTab === 'response' ? 'active' : ''}\`,
                                onClick: () => setActiveTab('response')
                            }, 'Response Body')
                        ),
                        React.createElement('div', { 
                            className: \`tab-content \${activeTab === 'details' ? 'active' : ''}\`
                        },
                            React.createElement('div', { 
                                dangerouslySetInnerHTML: { __html: renderRequestDetails(request) } 
                            })
                        ),
                        React.createElement('div', { 
                            className: \`tab-content \${activeTab === 'response' ? 'active' : ''}\`
                        },
                            renderResponseBody(request)
                        )
                    )
                )
            );
        }`;
}

function getJsonValueComponent(): string {
  return `
            const JsonValue = ({ value, level = 0 }) => {
                const [isExpanded, setIsExpanded] = React.useState(level < 2);
                const toggleExpanded = () => setIsExpanded(!isExpanded);
                
                if (value === null) {
                    return React.createElement('span', { className: 'json-null' }, 'null');
                }
                
                if (typeof value === 'string') {
                    return React.createElement('span', { className: 'json-string' }, \`"\${value}"\`);
                }
                
                if (typeof value === 'number') {
                    return React.createElement('span', { className: 'json-number' }, value.toString());
                }
                
                if (typeof value === 'boolean') {
                    return React.createElement('span', { className: 'json-boolean' }, value.toString());
                }
                
                if (Array.isArray(value)) {
                    if (value.length === 0) {
                        return React.createElement('span', { className: 'json-bracket' }, '[]');
                    }
                    
                    return React.createElement('div', { className: 'json-array' },
                        React.createElement('button', { 
                            className: 'json-toggle',
                            onClick: toggleExpanded 
                        }, isExpanded ? '▼' : '▶'),
                        React.createElement('span', { className: 'json-bracket' }, '['),
                        isExpanded && React.createElement('div', { className: 'json-expanded' },
                            ...value.map((item, index) => 
                                React.createElement('div', { key: index },
                                    React.createElement(JsonValue, { value: item, level: level + 1 }),
                                    index < value.length - 1 && React.createElement('span', { className: 'json-comma' }, ',')
                                )
                            )
                        ),
                        !isExpanded && React.createElement('span', { className: 'json-bracket' }, '...'),
                        React.createElement('span', { className: 'json-bracket' }, ']')
                    );
                }
                
                if (typeof value === 'object') {
                    const entries = Object.entries(value);
                    
                    if (entries.length === 0) {
                        return React.createElement('span', { className: 'json-bracket' }, '{}');
                    }
                    
                    return React.createElement('div', { className: 'json-object' },
                        React.createElement('button', { 
                            className: 'json-toggle',
                            onClick: toggleExpanded 
                        }, isExpanded ? '▼' : '▶'),
                        React.createElement('span', { className: 'json-bracket' }, '{'),
                        isExpanded && React.createElement('div', { className: 'json-expanded' },
                            ...entries.map(([objKey, objValue], index) => 
                                React.createElement('div', { key: objKey },
                                    React.createElement('span', { className: 'json-key' }, \`"\${objKey}"\`),
                                    React.createElement('span', { className: 'json-bracket' }, ': '),
                                    React.createElement(JsonValue, { value: objValue, level: level + 1 }),
                                    index < entries.length - 1 && React.createElement('span', { className: 'json-comma' }, ',')
                                )
                            )
                        ),
                        !isExpanded && React.createElement('span', { className: 'json-bracket' }, '...'),
                        React.createElement('span', { className: 'json-bracket' }, '}')
                    );
                }
                
                return React.createElement('span', null, String(value));
            };`;
}

function getRequestDetailsRenderer(): string {
  return `
            const renderRequestDetails = (request) => {
                let details = '';
                
                if (request.urlParsed) {
                    details += \`
                        <div class="details-section">
                            <div class="details-title">URL Breakdown</div>
                            <div class="details-content">
                                <div><strong>Protocol:</strong> \${request.urlParsed.protocol}</div>
                                <div><strong>Host:</strong> \${request.urlParsed.hostname}\${request.urlParsed.port ? ':' + request.urlParsed.port : ''}</div>
                                <div><strong>Path:</strong> \${request.urlParsed.pathname}</div>
                                <div><strong>Query:</strong> \${request.urlParsed.search || 'N/A'}</div>
                                <div><strong>Hash:</strong> \${request.urlParsed.hash || 'N/A'}</div>
                            </div>
                        </div>
                    \`;
                }
                
                if (request.urlParams && Object.keys(request.urlParams).length > 0) {
                    details += \`
                        <div class="details-section">
                            <div class="details-title">URL Parameters</div>
                            <div class="details-content">
                                <div class="headers-grid">
                                    \${Object.entries(request.urlParams).map(([key, value]) => 
                                        \`<div class="header-key">\${key}:</div><div class="header-value">\${value}</div>\`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                    \`;
                }
                
                if (request.requestHeaders && Object.keys(request.requestHeaders).length > 0) {
                    details += \`
                        <div class="details-section">
                            <div class="details-title">Request Headers</div>
                            <div class="details-content">
                                <div class="headers-grid">
                                    \${Object.entries(request.requestHeaders).map(([key, value]) => 
                                        \`<div class="header-key">\${key}:</div><div class="header-value">\${value}</div>\`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                    \`;
                }
                
                if (request.responseHeaders && Object.keys(request.responseHeaders).length > 0) {
                    details += \`
                        <div class="details-section">
                            <div class="details-title">Response Headers</div>
                            <div class="details-content">
                                <div class="headers-grid">
                                    \${Object.entries(request.responseHeaders).map(([key, value]) => 
                                        \`<div class="header-key">\${key}:</div><div class="header-value">\${value}</div>\`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                    \`;
                }
                
                if (request.startTime && request.endTime) {
                    details += \`
                        <div class="details-section">
                            <div class="details-title">Timing Information</div>
                            <div class="details-content">
                                <div><strong>Start Time:</strong> \${new Date(request.startDate).toLocaleString()}</div>
                                <div><strong>End Time:</strong> \${new Date(request.endDate || '').toLocaleString()}</div>
                                <div><strong>Duration:</strong> \${request.duration}</div>
                                <div><strong>Start Timestamp:</strong> \${request.startTime.toFixed(2)}ms</div>
                                <div><strong>End Timestamp:</strong> \${request.endTime.toFixed(2)}ms</div>
                            </div>
                        </div>
                    \`;
                }
                
                return details;
            };`;
}

function getResponseBodyRenderer(): string {
  return `
            const renderResponseBody = (request) => {
                if (!request.responseBody) {
                    return React.createElement('div', { className: 'no-data' }, 'No response body');
                }
                
                try {
                    let parsedBody;
                    if (typeof request.responseBody === 'string') {
                        parsedBody = JSON.parse(request.responseBody);
                    } else {
                        parsedBody = request.responseBody;
                    }
                    
                    return React.createElement('div', { className: 'json-viewer' },
                        React.createElement(JsonValue, { value: parsedBody })
                    );
                } catch (e) {
                    return React.createElement('div', { className: 'details-content' },
                        React.createElement('pre', { style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }, 
                            typeof request.responseBody === 'string' ? request.responseBody : JSON.stringify(request.responseBody, null, 2)
                        )
                    );
                }
            };`;
}

function getTimelineComponent(): string {
  return `
        function Timeline({ requests, expandedItems, onRequestClick, selectedRequestId }) {
            const [zoom, setZoom] = React.useState(1);
            const [timeRange, setTimeRange] = React.useState({ start: 0, end: 10000 });
            
            const calculateTimelineData = () => {
                if (requests.length === 0) return { requests: [], timeRange: { start: 0, end: 10000 } };
                
                const now = Date.now();
                const startTime = Math.min(...requests.map(r => new Date(r.startDate).getTime()));
                const endTime = Math.max(...requests.map(r => {
                    const end = r.endDate ? new Date(r.endDate).getTime() : now;
                    return end;
                }));
                
                const totalDuration = endTime - startTime;
                const timelineWidth = 600; // Base width for the track
                const actualWidth = timelineWidth * zoom;
                
                const timelineRequests = requests.map(request => {
                    const requestStart = new Date(request.startDate).getTime();
                    const requestEnd = request.endDate ? new Date(request.endDate).getTime() : now;
                    const requestDuration = requestEnd - requestStart;
                    
                    const left = totalDuration > 0 ? ((requestStart - startTime) / totalDuration) * actualWidth : 0;
                    const width = totalDuration > 0 ? Math.max((requestDuration / totalDuration) * actualWidth, 2) : 2;
                    
                    return {
                        ...request,
                        left: left,
                        width: width,
                        duration: requestDuration,
                        startTime: requestStart,
                        endTime: requestEnd
                    };
                });
                
                return {
                    requests: timelineRequests,
                    timeRange: { start: startTime, end: endTime },
                    totalDuration,
                    actualWidth
                };
            };
            
            const { requests: timelineRequests, timeRange: calculatedTimeRange, totalDuration, actualWidth } = calculateTimelineData();
            
            const getRequestClass = (request) => {
                if (request.type === 'fetch_error') return 'error';
                
                const method = request.method?.toLowerCase();
                const isError = request.status && (request.status >= 400);
                
                let baseClass = '';
                switch (method) {
                    case 'get': baseClass = 'success'; break;
                    case 'post': baseClass = 'warning'; break;
                    case 'put': baseClass = 'info'; break;
                    case 'delete': baseClass = 'delete'; break;
                    case 'patch': baseClass = 'purple'; break;
                    default: baseClass = 'success';
                }
                
                return isError ? 'error' : baseClass;
            };
            
            const formatDuration = (ms) => {
                if (ms < 1000) return ms + 'ms';
                return (ms / 1000).toFixed(1) + 's';
            };
            
            const handleZoomIn = () => {
                setZoom(prev => Math.min(prev * 1.5, 5));
            };
            
            const handleZoomOut = () => {
                setZoom(prev => Math.max(prev / 1.5, 0.1));
            };
            
            const handleResetZoom = () => {
                setZoom(1);
            };
            
            if (requests.length === 0) {
                return React.createElement('div', { className: 'timeline-container' },
                    React.createElement('div', { className: 'timeline-header' },
                        React.createElement('div', { className: 'timeline-title' }, 'Timeline'),
                        React.createElement('div', { className: 'timeline-controls' },
                            React.createElement('div', { className: 'timeline-zoom' },
                                React.createElement('button', { 
                                    className: 'timeline-zoom-btn', 
                                    onClick: handleZoomOut,
                                    disabled: zoom <= 0.1
                                }, '−'),
                                React.createElement('span', { style: { fontSize: '10px', color: 'var(--text-secondary)' } }, Math.round(zoom * 100) + '%'),
                                React.createElement('button', { 
                                    className: 'timeline-zoom-btn', 
                                    onClick: handleZoomIn,
                                    disabled: zoom >= 5
                                }, '+'),
                                React.createElement('button', { 
                                    className: 'timeline-zoom-btn', 
                                    onClick: handleResetZoom
                                }, 'Reset')
                            )
                        )
                    ),
                    React.createElement('div', { className: 'timeline-viewport' },
                        React.createElement('div', { 
                            className: 'timeline-track',
                            style: { width: '100%' }
                        },
                            React.createElement('div', { 
                                style: { 
                                    textAlign: 'center', 
                                    color: 'var(--text-muted)', 
                                    fontSize: '11px',
                                    paddingTop: '12px'
                                } 
                            }, 'Waiting for requests...')
                        )
                    )
                );
            }
            
            return React.createElement('div', { className: 'timeline-container' },
                React.createElement('div', { className: 'timeline-header' },
                    React.createElement('div', { className: 'timeline-title' }, 'Timeline'),
                    React.createElement('div', { className: 'timeline-controls' },
                        React.createElement('div', { className: 'timeline-zoom' },
                            React.createElement('button', { 
                                className: 'timeline-zoom-btn', 
                                onClick: handleZoomOut,
                                disabled: zoom <= 0.1
                            }, '−'),
                            React.createElement('span', { style: { fontSize: '10px', color: 'var(--text-secondary)' } }, Math.round(zoom * 100) + '%'),
                            React.createElement('button', { 
                                className: 'timeline-zoom-btn', 
                                onClick: handleZoomIn,
                                disabled: zoom >= 5
                            }, '+'),
                            React.createElement('button', { 
                                className: 'timeline-zoom-btn', 
                                onClick: handleResetZoom
                            }, 'Reset')
                        )
                    )
                ),
                React.createElement('div', { className: 'timeline-viewport' },
                    React.createElement('div', { 
                        className: 'timeline-track',
                        style: { width: Math.max(actualWidth, 600) + 'px' }
                    },
                        ...timelineRequests.map(request => 
                            React.createElement('div', {
                                key: request.id,
                                className: 'timeline-row ' + (selectedRequestId === request.id ? 'selected' : ''),
                                onClick: () => onRequestClick(request.id)
                            },
                                React.createElement('div', { className: 'timeline-row-label' },
                                    request.method + ' ' + request.url.split('/').pop()
                                ),
                                React.createElement('div', { className: 'timeline-row-track' },
                                    React.createElement('div', {
                                        className: 'timeline-request ' + getRequestClass(request),
                                        style: {
                                            left: request.left + 'px',
                                            width: request.width + 'px'
                                        },
                                        title: request.method + ' ' + request.url + ' - ' + formatDuration(request.duration)
                                    },
                                        React.createElement('div', { className: 'timeline-request-label' },
                                            request.width > 30 ? request.method : ''
                                        )
                                    )
                                ),
                                React.createElement('div', { className: 'timeline-row-duration' },
                                    formatDuration(request.duration)
                                )
                            )
                        )
                    )
                ),
                React.createElement('div', { className: 'timeline-legend' },
                    React.createElement('div', { className: 'timeline-legend-item' },
                        React.createElement('div', { className: 'timeline-legend-color get' }),
                        React.createElement('span', null, 'GET')
                    ),
                    React.createElement('div', { className: 'timeline-legend-item' },
                        React.createElement('div', { className: 'timeline-legend-color post' }),
                        React.createElement('span', null, 'POST')
                    ),
                    React.createElement('div', { className: 'timeline-legend-item' },
                        React.createElement('div', { className: 'timeline-legend-color put' }),
                        React.createElement('span', null, 'PUT')
                    ),
                    React.createElement('div', { className: 'timeline-legend-item' },
                        React.createElement('div', { className: 'timeline-legend-color delete' }),
                        React.createElement('span', null, 'DELETE')
                    ),
                    React.createElement('div', { className: 'timeline-legend-item' },
                        React.createElement('div', { className: 'timeline-legend-color patch' }),
                        React.createElement('span', null, 'PATCH')
                    ),
                    React.createElement('div', { className: 'timeline-legend-item' },
                        React.createElement('div', { className: 'timeline-legend-color error' }),
                        React.createElement('span', null, 'ERROR')
                    )
                )
            );
        }`;
}

function getNetworkTableComponent(): string {
  return `
        function NetworkTable({ requests, expandedItems, onToggleExpand }) {
            if (requests.length === 0) {
                return React.createElement('div', { className: 'network-table' },
                    React.createElement('div', { className: 'network-header' },
                        React.createElement('div', null, 'Name'),
                        React.createElement('div', null, 'Method'),
                        React.createElement('div', null, 'Status'),
                        React.createElement('div', null, 'Duration'),
                        React.createElement('div', null, 'Time')
                    ),
                    React.createElement('div', { className: 'no-data' }, 'Waiting for requests...')
                );
            }

            return React.createElement('div', { className: 'network-table' },
                React.createElement('div', { className: 'network-header' },
                    React.createElement('div', null, 'Name'),
                    React.createElement('div', null, 'Method'),
                    React.createElement('div', null, 'Status'),
                    React.createElement('div', null, 'Duration'),
                    React.createElement('div', null, 'Time')
                ),
                React.createElement('div', { id: 'network-list' },
                    ...requests.map(request => 
                        React.createElement(NetworkItem, {
                            key: request.id,
                            request: request,
                            isExpanded: expandedItems.has(request.id),
                            onToggleExpand: onToggleExpand
                        })
                    )
                )
            );
        }`;
}

function getMainApp(): string {
  return `
        function App({ wsPort }) {
            // Load persisted data from localStorage on initialization
            const loadPersistedRequests = () => {
                try {
                    const saved = localStorage.getItem('next-telescope-requests');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        console.log('🔄 [UI] Restoring persisted requests:', parsed.length);
                        console.log('🔄 [UI] Sample request:', parsed[0]);
                        return parsed;
                    }
                } catch (e) {
                    console.warn('⚠️ [UI] Failed to load persisted requests:', e);
                }
                return [];
            };

            const [requests, setRequests] = useState([]);
            const [filter, setFilter] = useState('ALL');
            const [expandedItems, setExpandedItems] = useState(new Set());
            const [selectedRequestId, setSelectedRequestId] = useState(null);
            const [showRestoreMessage, setShowRestoreMessage] = useState(false);
            const [hasRestoredData, setHasRestoredData] = useState(false);
            
            const { theme, toggleTheme } = useTheme();
            
            // Load data from localStorage immediately after mount
            useEffect(() => {
                console.log('🔄 [UI] Loading data from localStorage on mount');
                const persistedRequests = loadPersistedRequests();
                console.log('🔄 [UI] Loaded requests from localStorage:', persistedRequests.length);
                
                if (persistedRequests.length > 0) {
                    setRequests(persistedRequests);
                    setHasRestoredData(true); // Mark that data was restored
                    console.log('✅ [UI] Successfully set requests state:', persistedRequests.length);
                }
            }, []); // Only execute once after mount
            
            // Show restore message only when data was restored from localStorage
            useEffect(() => {
                if (hasRestoredData && requests.length > 0) {
                    console.log('🔄 [UI] Showing restore message for', requests.length, 'restored requests');
                    setShowRestoreMessage(true);
                    // Hide the message after 5 seconds
                    setTimeout(() => setShowRestoreMessage(false), 5000);
                    // Reset the flag so it doesn't appear again
                    setHasRestoredData(false);
                }
            }, [hasRestoredData, requests.length]);

            // Backup effect to sync data if there are discrepancies
            useEffect(() => {
                // Only execute if state is empty but localStorage has data
                if (requests.length === 0) {
                    const localStorageRequests = (() => {
                        try {
                            const saved = localStorage.getItem('next-telescope-requests');
                            return saved ? JSON.parse(saved) : [];
                        } catch (e) {
                            return [];
                        }
                    })();
                    
                    if (localStorageRequests.length > 0) {
                        console.log('🔄 [UI] Backup sync - state is empty but localStorage has', localStorageRequests.length, 'requests');
                        setRequests(localStorageRequests);
                        setHasRestoredData(true); // Mark that data was restored in backup sync
                    }
                }
            }, [requests.length]);

            // Stable callback for WebSocket using useCallback
            const handleWebSocketMessage = useCallback((data) => {
                console.log('🔍 [UI] WebSocket message received:', data);
                console.log('🔍 [UI] Message type:', data.type);
                console.log('🔍 [UI] Message payload:', data.payload);
                
                if (data.type === 'fetch' || data.type === 'fetch_error') {
                    console.log('✅ [UI] Processing fetch message');
                    const request = {
                        ...data.payload,
                        type: data.type,
                        id: data.payload.id || 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                    };
                    
                    console.log('📝 [UI] Created request object:', request);
                    console.log('📝 [UI] Request ID:', request.id);
                    console.log('📝 [UI] Request status:', request.status);
                    console.log('📝 [UI] Request type:', request.type);
                    
                    setRequests(prev => {
                        console.log('📊 [UI] Current requests count:', prev.length);
                        const newRequests = [...prev, request];
                        console.log('📊 [UI] New requests count:', newRequests.length);
                        
                        // Persist to localStorage
                        try {
                            localStorage.setItem('next-telescope-requests', JSON.stringify(newRequests));
                            console.log('💾 [UI] Persisted requests to localStorage:', newRequests.length);
                        } catch (e) {
                            console.warn('⚠️ [UI] Failed to persist requests:', e);
                        }
                        return newRequests;
                    });
                } else {
                    console.log('⚠️ [UI] Unknown message type:', data.type);
                }
            }, []);

            const { isConnected, isReconnecting, connectionError, manualReconnect, lastConnectionTime, messageCount } = useWebSocket(wsPort, handleWebSocketMessage);

            const clearAllRequests = useCallback(() => {
                setRequests([]);
                setExpandedItems(new Set());
                setSelectedRequestId(null);
                setHasRestoredData(false); // Reset the restoration flag
                // Also clear localStorage
                try {
                    localStorage.removeItem('next-telescope-requests');
                    localStorage.removeItem('next-telescope-message-count');
                    console.log('🗑️ [UI] Cleared persisted requests and message count from localStorage');
                } catch (e) {
                    console.warn('⚠️ [UI] Failed to clear persisted data:', e);
                }
            }, []);

            const toggleExpand = useCallback((requestId) => {
                setExpandedItems(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(requestId)) {
                        newSet.delete(requestId);
                        setSelectedRequestId(null);
                    } else {
                        newSet.add(requestId);
                        setSelectedRequestId(requestId);
                    }
                    return newSet;
                });
            }, []);

            const handleRequestClick = useCallback((requestId) => {
                setSelectedRequestId(requestId);
                // Auto-expand the clicked request
                setExpandedItems(prev => {
                    const newSet = new Set(prev);
                    newSet.add(requestId);
                    return newSet;
                });
            }, []);

            const filteredRequests = requests.filter(request => {
                if (filter === 'ERROR') {
                    return request.type === 'fetch_error' || (request.status && request.status >= 400);
                } else if (filter !== 'ALL') {
                    return request.method === filter;
                }
                return true;
            });

            // Debug logging for UI state (only when it changes)
            useEffect(() => {
                console.log('🔍 [UI] State updated:');
                console.log('🔍 [UI] - Total requests:', requests.length);
                console.log('🔍 [UI] - Filtered requests:', filteredRequests.length);
                console.log('🔍 [UI] - Filter:', filter);
                console.log('🔍 [UI] - Is connected:', isConnected);
                console.log('🔍 [UI] - Message count:', messageCount);
                
                // Expose debug functions on window for manual inspection
                window.debugTelescope = {
                    getRequests: () => requests,
                    getFilteredRequests: () => filteredRequests,
                    getLocalStorageRequests: () => {
                        try {
                            const saved = localStorage.getItem('next-telescope-requests');
                            return saved ? JSON.parse(saved) : null;
                        } catch (e) {
                            return null;
                        }
                    },
                    getMessageCount: () => messageCount,
                    getLocalStorageMessageCount: () => {
                        try {
                            const saved = localStorage.getItem('next-telescope-message-count');
                            return saved ? parseInt(saved, 10) : null;
                        } catch (e) {
                            return null;
                        }
                    },
                    clearAll: clearAllRequests,
                    reloadRequests: () => {
                        const persistedRequests = loadPersistedRequests();
                        setRequests(persistedRequests);
                        console.log('🔄 [DEBUG] Reloaded requests:', persistedRequests.length);
                    },
                    forceSync: () => {
                        const localStorageRequests = (() => {
                            try {
                                const saved = localStorage.getItem('next-telescope-requests');
                                return saved ? JSON.parse(saved) : [];
                            } catch (e) {
                                return [];
                            }
                        })();
                        setRequests(localStorageRequests);
                        console.log('🔄 [DEBUG] Force sync completed:', localStorageRequests.length, 'requests');
                        return localStorageRequests.length;
                    },
                    emergencySync: () => {
                        console.log('🚨 [DEBUG] Emergency sync - forcing immediate data restoration');
                        const localStorageRequests = (() => {
                            try {
                                const saved = localStorage.getItem('next-telescope-requests');
                                return saved ? JSON.parse(saved) : [];
                            } catch (e) {
                                console.error('❌ [DEBUG] Failed to parse localStorage data:', e);
                                return [];
                            }
                        })();
                        
                        if (localStorageRequests.length > 0) {
                            setRequests(localStorageRequests);
                            console.log('✅ [DEBUG] Emergency sync completed:', localStorageRequests.length, 'requests restored');
                            return localStorageRequests.length;
                        } else {
                            console.log('⚠️ [DEBUG] No data found in localStorage for emergency sync');
                            return 0;
                        }
                    },
                    debugHotReload: () => {
                        console.log('🔍 [DEBUG] Hot reload diagnostic:');
                        console.log('🔍 [DEBUG] - Current state requests:', requests.length);
                        console.log('🔍 [DEBUG] - Current filtered requests:', filteredRequests.length);
                        console.log('🔍 [DEBUG] - Current message count:', messageCount);
                        
                        const localStorageRequests = (() => {
                            try {
                                const saved = localStorage.getItem('next-telescope-requests');
                                return saved ? JSON.parse(saved) : [];
                            } catch (e) {
                                return [];
                            }
                        })();
                        
                        console.log('🔍 [DEBUG] - localStorage requests:', localStorageRequests.length);
                        console.log('🔍 [DEBUG] - localStorage message count:', localStorage.getItem('next-telescope-message-count'));
                        console.log('🔍 [DEBUG] - WebSocket connected:', isConnected);
                        console.log('🔍 [DEBUG] - WebSocket reconnecting:', isReconnecting);
                        
                        // Attempt to load data manually
                        console.log('🔄 [DEBUG] Attempting manual data load...');
                        const manualLoad = loadPersistedRequests();
                        console.log('🔄 [DEBUG] Manual load result:', manualLoad.length, 'requests');
                        
                        if (manualLoad.length > 0 && requests.length === 0) {
                            console.log('🚨 [DEBUG] Found discrepancy - forcing state update');
                            setRequests(manualLoad);
                        }
                        
                        return {
                            stateRequests: requests.length,
                            localStorageRequests: localStorageRequests.length,
                            messageCount: messageCount,
                            isConnected: isConnected,
                            manualLoadResult: manualLoad.length
                        };
                    },
                    checkSync: () => {
                        const localStorageRequests = (() => {
                            try {
                                const saved = localStorage.getItem('next-telescope-requests');
                                return saved ? JSON.parse(saved) : [];
                            } catch (e) {
                                return [];
                            }
                        })();
                        console.log('🔍 [DEBUG] Sync check:');
                        console.log('🔍 [DEBUG] - State requests:', requests.length);
                        console.log('🔍 [DEBUG] - localStorage requests:', localStorageRequests.length);
                        console.log('🔍 [DEBUG] - Message count:', messageCount);
                        console.log('🔍 [DEBUG] - localStorage message count:', localStorage.getItem('next-telescope-message-count'));
                        return {
                            stateRequests: requests.length,
                            localStorageRequests: localStorageRequests.length,
                            messageCount: messageCount,
                            localStorageMessageCount: localStorage.getItem('next-telescope-message-count')
                        };
                    }
                };
            }, [requests.length, filteredRequests.length, filter, isConnected, messageCount]);

            const stats = {
                total: requests.length,
                successful: requests.filter(r => r.type === 'fetch' && r.status >= 200 && r.status < 300).length,
                errors: requests.filter(r => r.type === 'fetch_error' || (r.status && r.status >= 400)).length,
                avgDuration: requests.length > 0 
                    ? Math.round(
                        requests
                            .filter(r => r.duration)
                            .map(r => parseFloat(r.duration.replace(' ms', '')))
                            .reduce((a, b) => a + b, 0) / requests.filter(r => r.duration).length
                    )
                    : 0,
                totalDuration: Math.round(requests
                    .filter(r => r.duration)
                    .map(r => parseFloat(r.duration.replace(' ms', '')))
                    .reduce((a, b) => a + b, 0))
            };

            return React.createElement('div', { 'data-theme': theme },
                React.createElement(Header, { 
                    onToggleTheme: toggleTheme,
                    onClearAll: clearAllRequests,
                    theme: theme,
                    onReconnect: manualReconnect,
                    connectionError: connectionError,
                    isConnected: isConnected,
                    isReconnecting: isReconnecting,
                    lastConnectionTime: lastConnectionTime,
                    messageCount: messageCount,
                    requests: requests
                }),
                connectionError && React.createElement('div', { 
                    className: 'error-banner',
                    style: {
                        background: 'var(--error-color)',
                        color: 'white',
                        padding: '8px 16px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '500'
                    }
                }, connectionError),
                showRestoreMessage && React.createElement('div', { 
                    className: 'restore-banner',
                    style: {
                        background: 'var(--success-color)',
                        color: 'white',
                        padding: '8px 16px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '500'
                    }
                }, \`🔄 Restored \${requests.length} requests from previous session\`),
                React.createElement(Toolbar, { 
                    filter: filter,
                    onFilterChange: setFilter,
                    stats: stats,
                    isConnected: isConnected,
                    isReconnecting: isReconnecting
                }),
                React.createElement(Timeline, { 
                    requests: filteredRequests,
                    expandedItems: expandedItems,
                    onRequestClick: handleRequestClick,
                    selectedRequestId: selectedRequestId
                }),
                React.createElement(NetworkTable, { 
                    requests: filteredRequests,
                    expandedItems: expandedItems,
                    onToggleExpand: toggleExpand
                })
            );
        }`;
}

function getAppRenderer(wsPort: number): string {
  return `
        // Render the app using React 18 createRoot API
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App, { wsPort: ${wsPort} }));`;
}

function getReactUIHTML(wsPort: number = 8080): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    ${getHTMLHead(wsPort)}
</head>
<body>
    <div id="root"></div>
    ${getReactScript(wsPort)}
</body>
</html>
  `;
}
