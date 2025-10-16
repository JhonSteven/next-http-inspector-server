export function getStyle() {
    return `
    <style>
        :root {
            --bg-primary: #ffffff;
            --bg-secondary: #f8f9fa;
            --bg-tertiary: #e9ecef;
            --text-primary: #212529;
            --text-secondary: #6c757d;
            --text-muted: #adb5bd;
            --border-color: #dee2e6;
            --accent-color: #007bff;
            --success-color: #28a745;
            --warning-color: #ffc107;
            --error-color: #dc3545;
            --info-color: #17a2b8;
            --network-bg: #f5f5f5;
            --network-border: #d0d0d0;
            --network-header: #f0f0f0;
        }
        
        [data-theme="dark"] {
            --bg-primary: #0a0a0a;
            --bg-secondary: #1a1a1a;
            --bg-tertiary: #222;
            --text-primary: #e0e0e0;
            --text-secondary: #888;
            --text-muted: #666;
            --border-color: #333;
            --accent-color: #00d4ff;
            --success-color: #4caf50;
            --warning-color: #ff9800;
            --error-color: #f44336;
            --info-color: #2196f3;
            --network-bg: #1e1e1e;
            --network-border: #333;
            --network-header: #2a2a2a;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: var(--network-bg);
            color: var(--text-primary);
            padding: 0;
            margin: 0;
            font-size: 12px;
            line-height: 1.4;
        }
        
        .header {
            background: var(--network-header);
            border-bottom: 1px solid var(--network-border);
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .header h1 {
            color: var(--text-primary);
            font-size: 16px;
            font-weight: 500;
            margin: 0;
        }
        
        .header-controls {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        
        .theme-toggle {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            transition: all 0.2s ease;
        }
        
        .theme-toggle:hover {
            background: var(--bg-tertiary);
        }
        
        .clear-btn {
            background: var(--error-color);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .clear-btn:hover {
            background: #c82333;
        }
        
        .clear-btn:disabled {
            background: var(--text-muted);
            cursor: not-allowed;
        }
        
        .reconnect-btn {
            background: var(--warning-color);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            transition: all 0.2s ease;
            margin-right: 8px;
        }
        
        .reconnect-btn:hover {
            background: #e0a800;
        }
        
        .toolbar {
            background: var(--network-header);
            border-bottom: 1px solid var(--network-border);
            padding: 8px 16px;
            display: flex;
            gap: 16px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .filters {
            display: flex;
            gap: 4px;
        }
        
        .filter-btn {
            padding: 4px 8px;
            background: transparent;
            color: var(--text-primary);
            border: 1px solid transparent;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            transition: all 0.2s ease;
        }
        
        .filter-btn:hover {
            background: var(--bg-tertiary);
        }
        
        .filter-btn.active {
            background: var(--accent-color);
            color: white;
            border-color: var(--accent-color);
        }
        
        .stats {
            display: flex;
            gap: 16px;
            align-items: center;
            margin-left: auto;
        }
        
        .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: var(--text-secondary);
        }
        
        .stat-number {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .network-table {
            background: var(--bg-primary);
            border: 1px solid var(--network-border);
            border-radius: 0;
            overflow: hidden;
        }
        
        .network-header {
            background: var(--network-header);
            border-bottom: 1px solid var(--network-border);
            padding: 8px 16px;
            display: grid;
            grid-template-columns: 1fr 60px 50px 70px 80px;
            gap: 16px;
            font-size: 11px;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .network-item {
            border-bottom: 1px solid var(--network-border);
            transition: background 0.1s ease;
        }
        
        .network-item:hover {
            background: var(--bg-tertiary);
        }
        
        .network-item:last-child {
            border-bottom: none;
        }
        
        .network-row {
            padding: 8px 16px;
            display: grid;
            grid-template-columns: 1fr 60px 50px 70px 80px;
            gap: 16px;
            align-items: center;
            cursor: pointer;
        }
        
        .network-url {
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 11px;
            color: var(--text-primary);
            word-break: break-all;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .network-method {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            text-align: center;
            width: 60px;
        }
        
        .method-GET { background: var(--success-color); color: white; }
        .method-POST { background: var(--warning-color); color: white; }
        .method-PUT { background: var(--info-color); color: white; }
        .method-DELETE { background: #000000; color: white; }
        .method-PATCH { background: #9c27b0; color: white; }
        
        .method-GET.error { background: var(--error-color); color: white; }
        .method-POST.error { background: var(--error-color); color: white; }
        .method-PUT.error { background: var(--error-color); color: white; }
        .method-DELETE.error { background: var(--error-color); color: white; }
        .method-PATCH.error { background: var(--error-color); color: white; }
        
        .network-status {
            font-size: 11px;
            font-weight: 500;
            text-align: center;
            width: 50px;
        }
        
        .status-2xx { color: var(--success-color); }
        .status-3xx { color: var(--warning-color); }
        .status-4xx { color: var(--error-color); }
        .status-5xx { color: var(--error-color); }
        
        .network-duration {
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 11px;
            color: var(--text-secondary);
            text-align: right;
            width: 70px;
        }
        
        .network-time {
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 10px;
            color: var(--text-muted);
            text-align: right;
            width: 80px;
        }
        
        .network-details {
            background: var(--bg-secondary);
            border-top: 1px solid var(--network-border);
            padding: 16px;
        }
        
        .details-section {
            margin-bottom: 16px;
        }
        
        .details-title {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 8px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .details-content {
            background: var(--bg-primary);
            padding: 12px;
            border-radius: 4px;
            border: 1px solid var(--network-border);
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 11px;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .json-content-container {
            position: relative;
        }
        
        .json-content {
            white-space: pre-wrap;
            word-break: break-word;
            padding-right: 60px;
        }
        
        .copy-button {
            position: absolute;
            top: 8px;
            right: 8px;
            background: var(--accent-color);
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
            opacity: 0.8;
        }
        
        .copy-button:hover {
            opacity: 1;
            background: var(--accent-color);
            transform: scale(1.05);
        }
        
        .copy-button:active {
            transform: scale(0.95);
        }
        
        .headers-grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 8px;
        }
        
        .header-key {
            font-weight: 600;
            color: var(--accent-color);
        }
        
        .header-value {
            color: var(--text-primary);
        }
        
        .expand-icon {
            font-size: 10px;
            color: var(--text-muted);
            transition: transform 0.2s ease;
        }
        
        .expand-icon.expanded {
            transform: rotate(90deg);
        }
        
        .no-data {
            text-align: center;
            padding: 40px;
            color: var(--text-secondary);
            font-size: 14px;
        }
        
        .error-item {
            background: var(--bg-secondary);
            border-left: 3px solid var(--error-color);
        }
        
        .error-message {
            color: var(--error-color);
            font-weight: 600;
        }
        
        .tabs-container {
            margin-top: 16px;
        }
        
        .tabs-header {
            display: flex;
            border-bottom: 1px solid var(--network-border);
            margin-bottom: 16px;
        }
        
        .tab-button {
            background: transparent;
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            color: var(--text-secondary);
            border-bottom: 2px solid transparent;
            transition: all 0.2s ease;
        }
        
        .tab-button:hover {
            color: var(--text-primary);
            background: var(--bg-tertiary);
        }
        
        .tab-button.active {
            color: var(--accent-color);
            border-bottom-color: var(--accent-color);
            background: var(--bg-primary);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .json-viewer {
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 11px;
            line-height: 1.4;
        }
        
        .json-key {
            color: var(--accent-color);
            font-weight: 600;
        }
        
        .json-string {
            color: var(--success-color);
        }
        
        .json-number {
            color: var(--info-color);
        }
        
        .json-boolean {
            color: var(--warning-color);
        }
        
        .json-null {
            color: var(--text-muted);
            font-style: italic;
        }
        
        .json-toggle {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-muted);
            font-size: 10px;
            margin-right: 4px;
            padding: 0;
            width: 12px;
            height: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        
        .json-toggle:hover {
            color: var(--text-primary);
        }
        
        .json-object {
            margin-left: 16px;
        }
        
        .json-array {
            margin-left: 16px;
        }
        
        .json-collapsed {
            display: none;
        }
        
        .json-expanded {
            display: block;
        }
        
        .json-bracket {
            color: var(--text-muted);
        }
        
        .json-comma {
            color: var(--text-muted);
        }
        
        .timeline-container {
            background: var(--bg-primary);
            border: 1px solid var(--network-border);
            border-bottom: none;
            padding: 12px 16px;
            position: relative;
            overflow-x: auto;
        }
        
        .timeline-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .timeline-title {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .timeline-controls {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        
        .timeline-zoom {
            display: flex;
            gap: 4px;
            align-items: center;
        }
        
        .timeline-zoom-btn {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 2px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            transition: all 0.2s ease;
        }
        
        .timeline-zoom-btn:hover {
            background: var(--bg-tertiary);
        }
        
        .timeline-zoom-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .timeline-viewport {
            position: relative;
            background: var(--bg-secondary);
            border: 1px solid var(--network-border);
            border-radius: 4px;
            overflow-x: auto;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .timeline-track {
            position: relative;
            min-width: 100%;
            padding: 8px 0;
        }
        
        .timeline-row {
            position: relative;
            height: 24px;
            margin-bottom: 2px;
            display: flex;
            align-items: center;
            padding: 0 8px;
        }
        
        .timeline-row:hover {
            background: var(--bg-tertiary);
        }
        
        .timeline-row.selected {
            background: var(--accent-color);
            color: white;
        }
        
        .timeline-row-label {
            width: 120px;
            font-size: 10px;
            font-weight: 500;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-right: 8px;
            flex-shrink: 0;
        }
        
        .timeline-row.selected .timeline-row-label {
            color: white;
        }
        
        .timeline-row-track {
            flex: 1;
            position: relative;
            height: 16px;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 2px;
            margin-right: 8px;
        }
        
        .timeline-request {
            position: absolute;
            height: 14px;
            top: 1px;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            padding: 0 4px;
            font-size: 8px;
            font-weight: 500;
            color: white;
            min-width: 2px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .timeline-request:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            z-index: 10;
        }
        
        .timeline-request.selected {
            outline: 2px solid var(--accent-color);
            outline-offset: 1px;
            z-index: 20;
        }
        
        .timeline-row-duration {
            width: 60px;
            font-size: 9px;
            color: var(--text-secondary);
            text-align: right;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            flex-shrink: 0;
        }
        
        .timeline-row.selected .timeline-row-duration {
            color: white;
        }
        
        .timeline-request.error {
            background: var(--error-color);
        }
        
        .timeline-request.success {
            background: var(--success-color);
        }
        
        .timeline-request.warning {
            background: var(--warning-color);
        }
        
        .timeline-request.info {
            background: var(--info-color);
        }
        
        .timeline-request.purple {
            background: #9c27b0;
        }
        
        .timeline-request.delete {
            background: #000000;
        }
        
        .timeline-request-label {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
        }
        
        .timeline-time-marker {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 1px;
            background: var(--text-muted);
            opacity: 0.3;
        }
        
        .timeline-time-label {
            position: absolute;
            top: -18px;
            left: -20px;
            font-size: 9px;
            color: var(--text-muted);
            white-space: nowrap;
        }
        
        .timeline-legend {
            display: flex;
            gap: 12px;
            margin-top: 8px;
            font-size: 10px;
        }
        
        .timeline-legend-item {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .timeline-legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
        }
        
        .timeline-legend-color.get { background: var(--success-color); }
        .timeline-legend-color.post { background: var(--warning-color); }
        .timeline-legend-color.put { background: var(--info-color); }
        .timeline-legend-color.delete { background: #000000; }
        .timeline-legend-color.patch { background: #9c27b0; }
        .timeline-legend-color.error { background: var(--error-color); }
        
        @media (max-width: 768px) {
            .network-header,
            .network-row {
                grid-template-columns: 1fr;
                gap: 8px;
            }
            
            .network-method, .network-status, .network-duration, .network-time {
                text-align: left;
                width: auto;
            }
        }
    </style>
    `;
}
