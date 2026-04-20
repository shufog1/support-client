const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell, screen, desktopCapturer } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs').promises;
const os = require('os');
const SystemInfoCollector = require('./system-info-collector');
const appConfig = require('../../config/app.config.json');
const branding = require('../../config/branding.config.json');
const zohoConfig = require('../../config/zoho.config.json');

// Disable hardware acceleration — GPU process can crash in some environments
// (RDP, integrated graphics, virtualized hosts), and the failed-GPU fallback to
// software rendering adds 1-2s of latency on every BrowserWindow creation.
// This tray app doesn't need GPU acceleration; software rendering is plenty.
app.disableHardwareAcceleration();

const isDev = process.argv.includes('--dev');

let mainWindow;
let tray;
let systemInfoCollector;

// Screenshot output directory — name sourced from config
const outputDir = path.join(os.tmpdir(), appConfig.paths.screenshotDirName);

// Initialize collectors
systemInfoCollector = new SystemInfoCollector();

async function ensureScreenshotDirectory() {
    try {
        await fs.mkdir(outputDir, { recursive: true });
        console.log('Screenshot directory ensured:', outputDir);
    } catch (error) {
        console.error('Failed to create screenshot directory:', error);
    }
}

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    mainWindow = new BrowserWindow({
        width: appConfig.window.width,
        height: appConfig.window.height,
        minWidth: appConfig.window.minWidth,
        minHeight: appConfig.window.minHeight,
        maxWidth: appConfig.window.maxWidth,
        maxHeight: appConfig.window.maxHeight,
        resizable: true,
        icon: path.join(__dirname, branding.logoPath),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'hidden',
        show: false,
        autoHideMenuBar: true,
        frame: false,
        backgroundColor: branding.ui.windowBackgroundColor,
        x: screenWidth - appConfig.window.xOffset,
        y: Math.max(50, (screenHeight - appConfig.window.yTarget) / 2),
        transparent: false,
        hasShadow: true
        // (no vibrancy — mac-only and caused repaint glitches on Windows)
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);

        if (parsedUrl.origin !== 'file://') {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

function createTray() {
    try {
        const trayIconPath = path.join(__dirname, branding.trayIconPath);

        let iconPath = trayIconPath;
        try {
            require('fs').accessSync(trayIconPath);
        } catch {
            iconPath = path.join(__dirname, branding.logoPath);
        }

        tray = new Tray(iconPath);

        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show SolveIT Support',
                click: () => {
                    if (mainWindow) {
                        mainWindow.show();
                        mainWindow.focus();
                    } else {
                        createWindow();
                    }
                }
            },
            {
                label: 'Quick Screenshot',
                click: async () => {
                    try {
                        const result = await captureScreenshot();
                        if (result.success && result.filepath) {
                            console.log('Quick screenshot captured from tray');
                            shell.showItemInFolder(result.filepath);
                        } else {
                            console.error('Screenshot failed:', result.error || 'Unknown error');
                        }
                    } catch (error) {
                        console.error('Quick screenshot error:', error);
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Exit',
                click: () => {
                    app.isQuiting = true;
                    app.quit();
                }
            }
        ]);

        tray.setToolTip(branding.trayTooltip);
        tray.setContextMenu(contextMenu);

        tray.on('click', () => {
            if (mainWindow) {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            } else {
                createWindow();
            }
        });

        tray.on('double-click', () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            } else {
                createWindow();
            }
        });

    } catch (error) {
        console.error('Failed to create tray:', error);
    }
}

async function captureScreenshot() {
    try {
        // Step 1: Get all screen sources
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 1920, height: 1080 }
        });

        if (!sources || sources.length === 0) {
            throw new Error('No screens found');
        }

        // Step 2: Get the primary screen
        const primaryScreen = sources[0];
        console.log('Primary screen selected:', primaryScreen.name);

        // Step 3: Try different resolutions (sourced from config)
        const resolutions = appConfig.screenshot.resolutions;

        let successfulCapture = null;

        for (const res of resolutions) {
            try {
                console.log(`\nTrying ${res.name} (${res.width}x${res.height})...`);

                const captureResult = await desktopCapturer.getSources({
                    types: ['screen'],
                    thumbnailSize: { width: res.width, height: res.height }
                });

                const screenSource = captureResult.find(s => s.id === primaryScreen.id);
                if (!screenSource || !screenSource.thumbnail) {
                    console.log(`${res.name}: No thumbnail`);
                    continue;
                }

                const buffer = screenSource.thumbnail.toPNG();
                console.log(`${res.name}: Buffer size = ${buffer.length} bytes`);

                if (buffer.length > 0) {
                    // Save the screenshot
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const filename = `SolveIT-Screenshot-${timestamp}.png`;
                    const filepath = path.join(outputDir, filename);

                    await fs.writeFile(filepath, buffer);

                    // Verify file was written
                    const stats = await fs.stat(filepath);
                    console.log(`${res.name}: File saved! Size on disk = ${stats.size} bytes`);

                    successfulCapture = {
                        resolution: res,
                        filename: filename,
                        filepath: filepath,
                        bufferSize: buffer.length,
                        fileSizeOnDisk: stats.size,
                        dimensions: screenSource.thumbnail.getSize(),
                        bytesBase64: buffer.toString('base64')
                    };

                    break; // Stop on first successful capture
                }

            } catch (error) {
                console.log(`${res.name}: Failed -`, error.message);
            }
        }

        if (successfulCapture) {
            console.log('\n=== SCREENSHOT SUCCESS ===');
            console.log('Successful capture:', successfulCapture);

            return {
                success: true,
                message: 'Screenshot captured successfully!',
                filepath: successfulCapture.filepath,
                filename: successfulCapture.filename,
                mimeType: 'image/png',
                bytesBase64: successfulCapture.bytesBase64,
                data: successfulCapture,
                screenshot: {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    filename: successfulCapture.filename,
                    filepath: successfulCapture.filepath,
                    dimensions: successfulCapture.dimensions,
                    fileSize: successfulCapture.fileSizeOnDisk
                }
            };
        } else {
            throw new Error('All resolution attempts failed');
        }

    } catch (error) {
        console.error('\n=== SCREENSHOT FAILED ===');
        console.error('Error:', error.message);

        return {
            success: false,
            error: error.message,
            message: 'Screenshot failed'
        };
    }
}
// Single instance lock - add this after your variable declarations
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // Another instance is already running, quit this one
    app.quit();
} else {
    // This is the first instance, set up the second-instance handler
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, focus our existing window instead
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            if (!mainWindow.isVisible()) mainWindow.show();
            mainWindow.focus();
        }
    });
}

// App event handlers
app.whenReady().then(async () => {
    createWindow();
    createTray();

    // Ensure screenshot directory is ready immediately — fast, no blocking
    await ensureScreenshotDirectory();

    // Defer system info collection until after the window has fully loaded.
    // The renderer triggers get-system-info via IPC on its own, but we also
    // kick off a background pre-warm here so the cache is ready when the
    // renderer asks. Using did-finish-load ensures the window is visible first.
    mainWindow.webContents.once('did-finish-load', () => {
        systemInfoCollector.getSystemInfo().catch(() => {});
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    app.isQuiting = true;
});

// ===== IPC HANDLERS =====

// Window controls
ipcMain.handle('close-window', async () => {
    try {
        if (mainWindow) {
            mainWindow.hide();
            return { success: true };
        }
        return { success: false, message: 'No window to close' };
    } catch (error) {
        console.error('Close window error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('minimize-window', async () => {
    try {
        if (mainWindow) {
            mainWindow.minimize();
            return { success: true };
        }
        return { success: false, message: 'No window to minimize' };
    } catch (error) {
        console.error('Minimize window error:', error);
        return { success: false, error: error.message };
    }
});

// System info handlers
ipcMain.handle('get-system-info', async (event, forceRefresh = false) => {
    try {
        console.log(`Getting system info (forceRefresh: ${forceRefresh})...`);

        if (mainWindow) {
            mainWindow.webContents.send('system-info-loading', true);
        }

        const systemInfo = await systemInfoCollector.getSystemInfo(forceRefresh);

        if (mainWindow) {
            mainWindow.webContents.send('system-info-loading', false);
        }

        console.log('System info retrieved successfully');
        return { success: true, data: systemInfo };

    } catch (error) {
        console.error('Error getting system info:', error);

        if (mainWindow) {
            mainWindow.webContents.send('system-info-loading', false);
        }

        return {
            success: false,
            error: 'Could not read system info',
            message: error.message
        };
    }
});

ipcMain.handle('refresh-system-info', async () => {
    try {
        console.log('Manual system info refresh requested...');

        if (mainWindow) {
            mainWindow.webContents.send('system-info-loading', true);
        }

        const systemInfo = await systemInfoCollector.getSystemInfo(true);

        if (mainWindow) {
            mainWindow.webContents.send('system-info-loading', false);
        }

        console.log('System info refreshed successfully');
        return { success: true, data: systemInfo, message: 'System info refreshed successfully' };

    } catch (error) {
        console.error('Error refreshing system info:', error);

        if (mainWindow) {
            mainWindow.webContents.send('system-info-loading', false);
        }

        return {
            success: false,
            error: 'Failed to refresh system info',
            message: error.message
        };
    }
});

// Screenshot handler
ipcMain.handle('take-screenshot', async () => {
    try {
        console.log('Screenshot requested from renderer...');
        const result = await captureScreenshot();
        console.log('Screenshot result:', result.success ? 'Success' : result.error);
        return result;
    } catch (error) {
        console.error('Screenshot error:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to capture screenshot'
        };
    }
});

// Show screenshot in folder handler
ipcMain.handle('show-screenshot-in-folder', async (event, screenshotFilePath) => {
    try {
        shell.showItemInFolder(screenshotFilePath);
        return { success: true };
    } catch (error) {
        console.error('Error showing screenshot in folder:', error);
        return { success: false, error: error.message };
    }
});


// System tools (existing functionality)
ipcMain.handle('restart-computer', async () => {
    try {
        console.log('Initiating system restart...');

        const restartDialog = branding.dialogs.restart;
        const result = await dialog.showMessageBox(mainWindow, {
            type: 'warning',
            buttons: ['Restart Now', 'Cancel'],
            defaultId: 1,
            title: restartDialog.title,
            message: restartDialog.message,
            detail: restartDialog.detail
        });

        if (result.response === 0) {
            exec(`shutdown /r /t 30 /c "Restarting computer via ${branding.productName} - Type '${restartDialog.cancelCommand}' to cancel"`, (error) => {
                if (error) {
                    console.error('Restart error:', error);
                }
            });
            return { success: true, message: `Computer will restart in 30 seconds. ${restartDialog.cancelNote}` };
        } else {
            return { success: false, message: 'Restart cancelled by user' };
        }
    } catch (error) {
        console.error('Restart error:', error);
        return { success: false, message: 'Failed to restart computer: ' + error.message };
    }
});

ipcMain.handle('check-windows-updates', async () => {
    try {
        console.log('Opening Windows Update...');

        exec('start ms-settings:windowsupdate', (error) => {
            if (error) {
                console.error('Windows Update settings error:', error);
                exec('wuauclt /detectnow && control /name Microsoft.WindowsUpdate', (fallbackError) => {
                    if (fallbackError) {
                        console.error('Windows Update fallback error:', fallbackError);
                    }
                });
            }
        });

        return { success: true, message: 'Windows Update settings opened' };
    } catch (error) {
        console.error('Windows Update error:', error);
        return { success: false, message: 'Failed to open Windows Update: ' + error.message };
    }
});

ipcMain.handle('network-reset', async () => {
    try {
        console.log('Opening Network settings...');

        exec('start ms-settings:network', (error) => {
            if (error) {
                console.error('Network settings error:', error);
                exec('ncpa.cpl', (fallbackError) => {
                    if (fallbackError) {
                        console.error('Network fallback error:', fallbackError);
                    }
                });
            }
        });

        return { success: true, message: 'Network settings opened' };
    } catch (error) {
        console.error('Network error:', error);
        return { success: false, message: 'Failed to open network settings: ' + error.message };
    }
});

ipcMain.handle('disk-cleanup', async () => {
    try {
        console.log('Starting disk cleanup...');

        exec('cleanmgr /sagerun:1', (error) => {
            if (error) {
                console.error('Disk cleanup error:', error);
                exec('cleanmgr', (fallbackError) => {
                    if (fallbackError) {
                        console.error('Disk cleanup fallback error:', fallbackError);
                        exec('explorer.exe ::{20D04FE0-3AEA-1069-A2D8-08002B30309D}', () => { });
                    }
                });
            }
        });

        return { success: true, message: 'Disk cleanup utility started' };
    } catch (error) {
        console.error('Disk cleanup error:', error);
        return { success: false, message: 'Failed to start disk cleanup: ' + error.message };
    }
});

// Dialog handler
ipcMain.handle('show-message-box', async (event, options) => {
    try {
        const result = await dialog.showMessageBox(mainWindow, options);
        return result;
    } catch (error) {
        console.error('Message box error:', error);
        return { response: 0 };
    }
});

// Additional system utilities
ipcMain.handle('open-display-settings', async () => {
    try {
        console.log('Opening display settings...');

        exec('start ms-settings:display', (error) => {
            if (error) {
                console.error('Display settings error:', error);
                exec('desk.cpl', (fallbackError) => {
                    if (fallbackError) {
                        console.error('Display fallback error:', fallbackError);
                    }
                });
            }
        });

        return { success: true, message: 'Display settings opened' };
    } catch (error) {
        console.error('Display error:', error);
        return { success: false, message: 'Failed to open display settings: ' + error.message };
    }
});

ipcMain.handle('printer-troubleshooter', async () => {
    try {
        console.log('Opening printer settings...');

        exec('start ms-settings:printers', (error) => {
            if (error) {
                console.error('Printer settings error:', error);
                exec('control printers', (fallbackError) => {
                    if (fallbackError) {
                        console.error('Printer fallback error:', fallbackError);
                    }
                });
            }
        });

        return { success: true, message: 'Printer settings opened' };
    } catch (error) {
        console.error('Printer error:', error);
        return { success: false, message: 'Failed to open printer settings: ' + error.message };
    }
});

ipcMain.handle('open-device-manager', async () => {
    try {
        exec('devmgmt.msc', (error) => {
            if (error) console.error('Device Manager error:', error);
        });
        return { success: true, message: 'Device Manager opened' };
    } catch (error) {
        return { success: false, message: 'Failed to open Device Manager: ' + error.message };
    }
});

ipcMain.handle('open-system-info', async () => {
    try {
        exec('msinfo32', (error) => {
            if (error) console.error('System Info error:', error);
        });
        return { success: true, message: 'System Information opened' };
    } catch (error) {
        return { success: false, message: 'Failed to open System Information: ' + error.message };
    }
});

ipcMain.handle('run-system-file-checker', async () => {
    try {
        exec('powershell -Command "Start-Process cmd -ArgumentList \'/c sfc /scannow & pause\' -Verb RunAs"', (error) => {
            if (error) console.error('SFC error:', error);
        });
        return { success: true, message: 'System File Checker started (admin approval may be required)' };
    } catch (error) {
        return { success: false, message: 'Failed to run System File Checker: ' + error.message };
    }
});

ipcMain.handle('flush-dns', async () => {
    try {
        exec('ipconfig /flushdns', (error, stdout) => {
            if (error) {
                console.error('DNS flush error:', error);
            } else {
                console.log('DNS flushed:', stdout);
            }
        });
        return { success: true, message: 'DNS cache flushed successfully' };
    } catch (error) {
        return { success: false, message: 'Failed to flush DNS cache: ' + error.message };
    }
});

// Auto-updater setup (for production builds)
if (!isDev) {
    try {
        const { autoUpdater } = require('electron-updater');

        autoUpdater.checkForUpdatesAndNotify();

        autoUpdater.on('update-available', () => {
            console.log('Update available');
            if (mainWindow) {
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: branding.dialogs.updateAvailable.title,
                    message: branding.dialogs.updateAvailable.message,
                    buttons: ['OK']
                });
            }
        });

        autoUpdater.on('update-downloaded', () => {
            console.log('Update downloaded');
            if (mainWindow) {
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: branding.dialogs.updateReady.title,
                    message: branding.dialogs.updateReady.message,
                    buttons: ['Restart Now', 'Later']
                }).then((result) => {
                    if (result.response === 0) {
                        autoUpdater.quitAndInstall();
                    }
                });
            }
        });

    } catch (error) {
        console.log('Auto-updater not available:', error.message);
    }
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log(`${branding.productName} - Production Ready with Working Screenshots`);
console.log('Development mode:', isDev);
console.log('App path:', app.getAppPath());
console.log('User data path:', app.getPath('userData'));
console.log('Screenshot directory:', outputDir);