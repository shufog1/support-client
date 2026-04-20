const { contextBridge, ipcRenderer } = require('electron');
const appConfig = require('../../config/app.config.json');
const branding = require('../../config/branding.config.json');
const zohoConfig = require('../../config/zoho.config.json');

// Sanitized config subset for the renderer — only what the UI actually needs.
// Nothing sensitive lives here; Zoho tokens are public-facing form identifiers
// (see docs/DECISIONS.md D4 and audit report S1-S6).
const rendererConfig = Object.freeze({
    zoho: {
        salesiqWidgetToken: zohoConfig.salesiqWidgetToken,
        salesiqWidgetBaseUrl: zohoConfig.salesiqWidgetBaseUrl,
        webToCaseUrl: zohoConfig.webToCaseUrl,
        formId: zohoConfig.formId,
        tokens: {
            xnQsjsdp: zohoConfig.tokens.xnQsjsdp,
            xmIwtLD: zohoConfig.tokens.xmIwtLD
        },
        cdn: { jqueryEncoderUrl: zohoConfig.cdn.jqueryEncoderUrl }
    },
    branding: {
        productName: branding.productName,
        tagline: branding.tagline,
        supportEmail: branding.supportEmail
    },
    attachments: {
        maxCount: appConfig.attachments.maxCount,
        maxSizeMb: appConfig.attachments.maxSizeMb,
        blockedExtensions: appConfig.attachments.blockedExtensions
    },
    toast: { durationMs: appConfig.toast.durationMs },
    demo: appConfig.demo
});

// Security: Only expose specific, safe methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // System information
    getSystemInfo: (forceRefresh = false) => ipcRenderer.invoke('get-system-info', forceRefresh),
    refreshSystemInfo: () => ipcRenderer.invoke('refresh-system-info'),
    checkSystemInfoStatus: () => ipcRenderer.invoke('check-system-info-status'),
    
    // Listen for system info loading events
    onSystemInfoLoading: (callback) => {
        const subscription = (event, isLoading) => callback(event, isLoading);
        ipcRenderer.on('system-info-loading', subscription);
        
        // Return cleanup function
        return () => ipcRenderer.removeListener('system-info-loading', subscription);
    },
    
    // App control
    closeWindow: () => ipcRenderer.invoke('close-window'),
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    
    // Screenshot functionality - WORKING IMPLEMENTATION
takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
openScreenshotFile: (filePath) => ipcRenderer.invoke('show-screenshot-in-folder', filePath),

    // Dialog boxes
    showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
    
    // App information
    getAppVersion: () => {
        try {
            return process.env.npm_package_version || '1.0.0';
        } catch {
            return '1.0.0';
        }
    },
    
    // Platform information
    getPlatform: () => {
        try {
            return process.platform;
        } catch {
            return 'unknown';
        }
    },
    
    // Development mode check
    isDev: () => {
        try {
            return process.argv.includes('--dev');
        } catch {
            return false;
        }
    },

    // Config bridge — returns a frozen, sanitized config subset for the renderer.
    // Values come from config/*.json files loaded in the main process context.
    getConfig: () => rendererConfig
});

// Expose system utilities with proper error handling
contextBridge.exposeInMainWorld('systemUtils', {
    // Core system commands
    restartComputer: () => ipcRenderer.invoke('restart-computer'),
    checkWindowsUpdates: () => ipcRenderer.invoke('check-windows-updates'),
    runNetworkReset: () => ipcRenderer.invoke('network-reset'),
    runDiskCleanup: () => ipcRenderer.invoke('disk-cleanup'),
    openDisplaySettings: () => ipcRenderer.invoke('open-display-settings'),
    runPrinterTroubleshooter: () => ipcRenderer.invoke('printer-troubleshooter'),
    
    // Additional system utilities
    openDeviceManager: () => ipcRenderer.invoke('open-device-manager'),
    openSystemInfo: () => ipcRenderer.invoke('open-system-info'),
    runSystemFileChecker: () => ipcRenderer.invoke('run-system-file-checker'),
    flushDNS: () => ipcRenderer.invoke('flush-dns')
});

// Expose Zoho integrations (for future expansion)
contextBridge.exposeInMainWorld('zohoAPI', {
    // Initialize SalesIQ chat (handled by external script)
    initializeChat: (config) => {
        console.log('SalesIQ chat initialization requested:', config);
        return Promise.resolve({ success: true, message: 'SalesIQ handled by external script' });
    },
    
    // Send chat message (handled by external script)
    sendChatMessage: (message) => {
        console.log('SalesIQ message send requested:', message);
        return Promise.resolve({ success: true, message: 'Message handled by SalesIQ widget' });
    }
});

// Expose app utilities for renderer
contextBridge.exposeInMainWorld('appUtils', {
    // Console logging for development
    log: (message, ...args) => {
        if (process.argv.includes('--dev')) {
            console.log(`[Renderer] ${message}`, ...args);
        }
    },
    
    // Error logging
    error: (message, ...args) => {
        console.error(`[Renderer Error] ${message}`, ...args);
    },
    
    // Get user data path (for potential future use)
    getUserDataPath: () => {
        try {
            return require('electron').remote?.app?.getPath('userData') || 'unknown';
        } catch {
            return 'unknown';
        }
    },
    
    // Check if running in development
    isDevelopment: () => {
        try {
            return process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
        } catch {
            return false;
        }
    }
});

// Security: Prevent access to Node.js APIs from renderer
delete window.require;
delete window.exports;
delete window.module;

// Development logging
if (process.argv.includes('--dev')) {
    console.log('SolveIT Support Client - Preload script loaded successfully');
    console.log('Available APIs:', {
        electronAPI: Object.keys(window.electronAPI || {}),
        systemUtils: Object.keys(window.systemUtils || {}),
        zohoAPI: Object.keys(window.zohoAPI || {}),
        appUtils: Object.keys(window.appUtils || {})
    });
    
    // Log any errors that occur
    window.addEventListener('error', (e) => {
        console.error('Renderer error:', e.error);
    });
    
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
    });
}

// Production ready indicator
console.log('SolveIT Support Client - Production Ready v1.0 with Working Screenshots');