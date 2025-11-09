/**
 * Chrome DevTools Extension para Performance Monitoring
 * Extensão que se integra com React DevTools para monitorar performance
 */

const manifest = {
  "manifest_version": 3,
  "name": "React Performance Monitor",
  "version": "1.0.0",
  "description": "Monitoramento avançado de performance para aplicações React",
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "React Performance Monitor"
  },
  "devtools_page": "devtools.html",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
};

const contentScript = `
// Content Script para Chrome Extension
// Injeta scripts de monitoramento na página

class ReactPerformanceMonitor {
  constructor() {
    this.isEnabled = false;
    this.metrics = new Map();
    this.observers = [];
    this.init();
  }

  init() {
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupMonitoring());
    } else {
      this.setupMonitoring();
    }
  }

  setupMonitoring() {
    // Injetar Performance Observer
    this.injectPerformanceObserver();
    
    // Injetar React DevTools integration
    this.injectReactDevToolsIntegration();
    
    // Injetar Custom metrics collection
    this.injectCustomMetrics();
    
    // Configurar comunicação com background script
    this.setupBackgroundCommunication();
  }

  injectPerformanceObserver() {
    const script = \`
      (function() {
        // Performance Observer para Core Web Vitals
        if ('PerformanceObserver' in window) {
          // LCP Observer
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            window.postMessage({
              type: 'REACT_PERF_METRIC',
              metric: 'LCP',
              value: lastEntry.startTime,
              timestamp: Date.now()
            }, '*');
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // FID Observer
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              window.postMessage({
                type: 'REACT_PERF_METRIC',
                metric: 'FID',
                value: entry.processingStart - entry.startTime,
                timestamp: Date.now()
              }, '*');
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // CLS Observer
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
                window.postMessage({
                  type: 'REACT_PERF_METRIC',
                  metric: 'CLS',
                  value: clsValue,
                  timestamp: Date.now()
                }, '*');
              }
            });
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        }

        // React render monitoring
        if (window.React) {
          const originalCreateElement = window.React.createElement;
          let renderCount = 0;
          
          window.React.createElement = function(...args) {
            renderCount++;
            if (renderCount % 100 === 0) { // A cada 100 renders
              window.postMessage({
                type: 'REACT_PERF_METRIC',
                metric: 'RENDER_COUNT',
                value: renderCount,
                timestamp: Date.now()
              }, '*');
            }
            return originalCreateElement.apply(this, args);
          };
        }

        // Memory monitoring
        setInterval(() => {
          if (performance.memory) {
            window.postMessage({
              type: 'REACT_PERF_METRIC',
              metric: 'MEMORY_USAGE',
              value: performance.memory.usedJSHeapSize,
              timestamp: Date.now()
            }, '*');
          }
        }, 5000);
      })();
    \`;

    const scriptElement = document.createElement('script');
    scriptElement.textContent = script;
    document.head.appendChild(scriptElement);
  }

  injectReactDevToolsIntegration() {
    const script = \`
      (function() {
        // Integration com React DevTools
        const connectToDevTools = () => {
          if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
            
            // Monitor component renders
            const originalRender = hook.renderers.get(1)?.render;
            if (originalRender) {
              hook.renderers.get(1).render = function(...args) {
                const startTime = performance.now();
                const result = originalRender.apply(this, args);
                const endTime = performance.now();
                
                window.postMessage({
                  type: 'REACT_DEVTOOLS_RENDER',
                  duration: endTime - startTime,
                  timestamp: Date.now()
                }, '*');
                
                return result;
              };
            }
          }
        };

        // Try to connect immediately and on future loads
        connectToDevTools();
        const observer = new MutationObserver(connectToDevTools);
        observer.observe(document.body, { childList: true, subtree: true });
      })();
    \`;

    const scriptElement = document.createElement('script');
    scriptElement.textContent = script;
    document.head.appendChild(scriptElement);
  }

  injectCustomMetrics() {
    const script = \`
      (function() {
        // API monitoring
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          const startTime = performance.now();
          return originalFetch.apply(this, args)
            .then(response => {
              const endTime = performance.now();
              window.postMessage({
                type: 'REACT_PERF_API',
                url: args[0],
                duration: endTime - startTime,
                status: response.status,
                timestamp: Date.now()
              }, '*');
              return response;
            })
            .catch(error => {
              const endTime = performance.now();
              window.postMessage({
                type: 'REACT_PERF_API',
                url: args[0],
                duration: endTime - startTime,
                error: error.message,
                timestamp: Date.now()
              }, '*');
              throw error;
            });
        };

        // Error monitoring
        window.addEventListener('error', (event) => {
          window.postMessage({
            type: 'REACT_PERF_ERROR',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            timestamp: Date.now()
          }, '*');
        });

        // User timing marks
        window.addEventListener('load', () => {
          const navigation = performance.getEntriesByType('navigation')[0];
          if (navigation) {
            window.postMessage({
              type: 'REACT_PERF_NAVIGATION',
              timings: {
                dns: navigation.domainLookupEnd - navigation.domainLookupStart,
                tcp: navigation.connectEnd - navigation.connectStart,
                ttfb: navigation.responseStart - navigation.requestStart,
                dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                load: navigation.loadEventEnd - navigation.fetchStart
              },
              timestamp: Date.now()
            }, '*');
          }
        });
      })();
    \`;

    const scriptElement = document.createElement('script');
    scriptElement.textContent = script;
    document.head.appendChild(scriptElement);
  }

  setupBackgroundCommunication() {
    // Listen for messages from the page
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;

      const { type, ...data } = event.data;
      
      if (type === 'REACT_PERF_METRIC' || 
          type === 'REACT_DEVTOOLS_RENDER' ||
          type === 'REACT_PERF_API' ||
          type === 'REACT_PERF_ERROR' ||
          type === 'REACT_PERF_NAVIGATION') {
        
        // Forward to background script
        chrome.runtime.sendMessage({
          type: 'PERFORMANCE_DATA',
          data: { type, ...data }
        });
      }
    });

    // Listen for commands from popup/background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'GET_PERFORMANCE_DATA') {
        // Return current performance data
        sendResponse({ data: this.getCurrentMetrics() });
      } else if (request.type === 'CLEAR_PERFORMANCE_DATA') {
        this.clearMetrics();
        sendResponse({ success: true });
      }
    });
  }

  getCurrentMetrics() {
    return {
      metrics: Object.fromEntries(this.metrics),
      timestamp: Date.now()
    };
  }

  clearMetrics() {
    this.metrics.clear();
  }

  start() {
    this.isEnabled = true;
  }

  stop() {
    this.isEnabled = false;
  }
}

// Initialize monitor
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ReactPerformanceMonitor());
} else {
  new ReactPerformanceMonitor();
}
`;

const backgroundScript = `
// Background Service Worker para Chrome Extension
// Gerencia comunicação e armazenamento de dados de performance

class PerformanceDataManager {
  constructor() {
    this.data = new Map();
    this.setupMessageHandlers();
  }

  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'PERFORMANCE_DATA') {
        this.handlePerformanceData(request.data, sender.tab?.id);
        sendResponse({ received: true });
      } else if (request.type === 'GET_STORED_DATA') {
        sendResponse({ data: this.getStoredData() });
      } else if (request.type === 'CLEAR_DATA') {
        this.clearStoredData();
        sendResponse({ success: true });
      }
    });
  }

  handlePerformanceData(data, tabId) {
    const key = \`tab_\${tabId}\`;
    
    if (!this.data.has(key)) {
      this.data.set(key, {
        tabId,
        metrics: [],
        startTime: Date.now()
      });
    }

    const tabData = this.data.get(key);
    tabData.metrics.push({
      ...data,
      receivedAt: Date.now()
    });

    // Keep only last 1000 entries per tab
    if (tabData.metrics.length > 1000) {
      tabData.metrics = tabData.metrics.slice(-1000);
    }

    // Update badge
    this.updateBadge(tabId, tabData.metrics.length);
  }

  updateBadge(tabId, count) {
    chrome.action.setBadgeText({
      text: count > 0 ? count.toString() : '',
      tabId
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: count > 0 ? '#ef4444' : '#6b7280',
      tabId
    });
  }

  getStoredData() {
    return Object.fromEntries(this.data);
  }

  clearStoredData() {
    this.data.clear();
  }
}

const manager = new PerformanceDataManager();
`;

const popupHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      width: 350px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      margin: 4px 0;
      background: #f3f4f6;
      border-radius: 6px;
    }
    .metric.good { background: #dcfce7; }
    .metric.warning { background: #fef3c7; }
    .metric.error { background: #fee2e2; }
    .value {
      font-weight: 600;
      font-family: 'Monaco', 'Menlo', monospace;
    }
    .controls {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    button {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      cursor: pointer;
    }
    button:hover {
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>Performance Monitor</h2>
  </div>
  
  <div id="metrics">
    <div class="metric">
      <span>Core Web Vitals</span>
      <span class="value" id="core-vitals">Carregando...</span>
    </div>
    <div class="metric">
      <span>Memory Usage</span>
      <span class="value" id="memory">Carregando...</span>
    </div>
    <div class="metric">
      <span>API Calls</span>
      <span class="value" id="api-calls">Carregando...</span>
    </div>
    <div class="metric">
      <span>Errors</span>
      <span class="value" id="errors">Carregando...</span>
    </div>
  </div>
  
  <div class="controls">
    <button id="refresh">Atualizar</button>
    <button id="export">Exportar</button>
    <button id="clear">Limpar</button>
  </div>

  <script src="popup.js"></script>
</body>
</html>
`;

const popupScript = `
// Popup script para Chrome Extension
// Interface de usuário para visualizar dados de performance

class PerformancePopup {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadStoredData();
    this.setupEventListeners();
    this.startAutoRefresh();
  }

  async loadStoredData() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STORED_DATA' });
      this.data = response.data || {};
      this.updateDisplay();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  updateDisplay() {
    const tabs = Object.values(this.data);
    if (tabs.length === 0) {
      this.setMetric('core-vitals', 'Nenhum dado', 'warning');
      this.setMetric('memory', 'N/A', 'warning');
      this.setMetric('api-calls', '0', 'warning');
      this.setMetric('errors', '0', 'warning');
      return;
    }

    // Aggregate data from all tabs
    let totalMetrics = 0;
    let totalApiCalls = 0;
    let totalErrors = 0;
    let latestMemory = 0;

    tabs.forEach(tab => {
      totalMetrics += tab.metrics.length;
      totalApiCalls += tab.metrics.filter(m => m.type === 'REACT_PERF_API').length;
      totalErrors += tab.metrics.filter(m => m.type === 'REACT_PERF_ERROR').length;
      
      const memoryMetric = tab.metrics.find(m => m.type === 'REACT_PERF_METRIC' && m.metric === 'MEMORY_USAGE');
      if (memoryMetric) {
        latestMemory = memoryMetric.value;
      }
    });

    this.setMetric('core-vitals', totalMetrics.toString(), totalMetrics > 100 ? 'warning' : 'good');
    this.setMetric('memory', this.formatBytes(latestMemory), 'good');
    this.setMetric('api-calls', totalApiCalls.toString(), 'good');
    this.setMetric('errors', totalErrors.toString(), totalErrors > 0 ? 'error' : 'good');
  }

  setMetric(id, value, status) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
      const container = element.closest('.metric');
      container.className = \`metric \${status}\`;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  setupEventListeners() {
    document.getElementById('refresh').addEventListener('click', () => {
      this.loadStoredData();
    });

    document.getElementById('export').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('clear').addEventListener('click', () => {
      this.clearData();
    });
  }

  async exportData() {
    const data = await chrome.runtime.sendMessage({ type: 'GET_STORED_DATA' });
    const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = \`performance-report-\${new Date().toISOString().slice(0, 10)}.json\`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  async clearData() {
    if (confirm('Tem certeza que deseja limpar todos os dados?')) {
      await chrome.runtime.sendMessage({ type: 'CLEAR_DATA' });
      this.data = {};
      this.updateDisplay();
    }
  }

  startAutoRefresh() {
    setInterval(() => {
      this.loadStoredData();
    }, 5000);
  }
}

new PerformancePopup();
`;

const devtoolsHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
  </style>
</head>
<body>
  <div id="app">
    <h2>React Performance Monitor</h2>
    <p>Este painel aparece nas React DevTools quando detectado.</p>
  </div>
  <script src="devtools.js"></script>
</body>
</html>
`;

const devtoolsScript = `
// DevTools script para integração com React DevTools
// Cria um painel customizado nas DevTools

chrome.devtools.panels.create(
  "React Performance",
  "icons/icon48.png",
  "panel.html",
  function(panel) {
    // Panel created
  }
);

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'REACT_DEVTOOLS_DATA') {
    // Process React DevTools data
    console.log('React DevTools data:', request.data);
  }
});
`;

const contentCSS = `
/* Styles for the performance overlay */
.performance-overlay {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  z-index: 999999;
  max-width: 300px;
}

.performance-metric {
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
}

.performance-metric.good {
  color: #10b981;
}

.performance-metric.warning {
  color: #f59e0b;
}

.performance-metric.error {
  color: #ef4444;
}

.performance-badge {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}
`;

// Export all files
export {
  manifest,
  contentScript,
  backgroundScript,
  popupHTML,
  popupScript,
  devtoolsHTML,
  devtoolsScript,
  contentCSS
};