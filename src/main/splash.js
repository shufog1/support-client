const { BrowserWindow, screen } = require('electron');
const path = require('path');

function createSplashWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    const splashWidth = 320;
    const splashHeight = 280;

    const splashWindow = new BrowserWindow({
        width: splashWidth,
        height: splashHeight,
        x: Math.round((screenWidth - splashWidth) / 2),
        y: Math.round((screenHeight - splashHeight) / 2),
        frame: false,
        transparent: false,
        resizable: false,
        backgroundColor: '#667eea',
        alwaysOnTop: true,
        skipTaskbar: true,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    splashWindow.loadFile(path.join(__dirname, '../renderer/splash.html'));

    splashWindow.once('ready-to-show', () => {
        splashWindow.show();
    });

    return splashWindow;
}

module.exports = { createSplashWindow };
