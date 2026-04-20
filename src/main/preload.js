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
        supportEmail: branding.supportEmail,
        logoPath: branding.logoPath
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

// Development logging
if (process.argv.includes('--dev')) {
    console.log('SolveIT Support Client - Preload script loaded successfully');
    console.log('Available APIs:', {
        electronAPI: Object.keys(window.electronAPI || {}),
        systemUtils: Object.keys(window.systemUtils || {})
    });

    window.addEventListener('error', (e) => {
        console.error('Renderer error:', e.error);
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
    });
}