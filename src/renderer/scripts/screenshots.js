// Screenshot Management Functions
class ScreenshotManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Take screenshot button
        const takeBtn = document.getElementById('takeScreenshotBtn');
        if (takeBtn) {
            takeBtn.addEventListener('click', () => this.takeScreenshot());
        }

        // Clear screenshots button
        const clearBtn = document.getElementById('clearScreenshotsBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllScreenshots());
        }
    }

    async takeScreenshot() {
        try {
            console.log('Taking screenshot...');
            
            // Show loading state
            this.setScreenshotButtonState('loading');
            
            const result = await window.electronAPI.takeScreenshot();
            
            if (result.success) {
                // Update global screenshots array
                if (window.app) {
                    window.app.currentScreenshots.push(result.screenshot);
                    this.updateScreenshotsDisplay(window.app.currentScreenshots);
                }
                
                console.log('Screenshot captured:', result.screenshot.filename);
                
                if (window.app) {
                    window.app.showMessage(`📷 Screenshot captured! (${result.totalScreenshots} total)`, 'success');
                }
            } else {
                throw new Error(result.error || result.message || 'Failed to capture screenshot');
            }
            
        } catch (error) {
            console.error('Error taking screenshot:', error);
            if (window.app) {
                window.app.showMessage(`❌ ${error.message}`, 'error');
            }
        } finally {
            this.setScreenshotButtonState('normal');
        }
    }

    async removeScreenshot(screenshotId) {
        try {
            console.log('Removing screenshot:', screenshotId);
            
            const result = await window.electronAPI.removeScreenshot(screenshotId);
            
            if (result.success) {
                // Update global screenshots array
                if (window.app) {
                    window.app.currentScreenshots = window.app.currentScreenshots.filter(s => s.id !== screenshotId);
                    this.updateScreenshotsDisplay(window.app.currentScreenshots);
                    window.app.showMessage('🗑️ Screenshot removed', 'info');
                }
            } else {
                throw new Error(result.error || result.message || 'Failed to remove screenshot');
            }
            
        } catch (error) {
            console.error('Error removing screenshot:', error);
            if (window.app) {
                window.app.showMessage(`❌ ${error.message}`, 'error');
            }
        }
    }

    async clearAllScreenshots() {
        try {
            console.log('Clearing all screenshots...');
            
            const result = await window.electronAPI.clearScreenshots();
            
            if (result.success) {
                // Update global screenshots array
                if (window.app) {
                    window.app.currentScreenshots = [];
                    this.updateScreenshotsDisplay([]);
                    window.app.showMessage('🗑️ All screenshots cleared', 'info');
                }
            } else {
                throw new Error(result.error || result.message || 'Failed to clear screenshots');
            }
            
        } catch (error) {
            console.error('Error clearing screenshots:', error);
            if (window.app) {
                window.app.showMessage(`❌ ${error.message}`, 'error');
            }
        }
    }

    updateScreenshotsDisplay(screenshots) {
        const statusContainer = document.getElementById('screenshotStatus');
        const clearBtn = document.getElementById('clearScreenshotsBtn');
        const screenshotSection = document.querySelector('.screenshot-section');
        
        if (!statusContainer) return;

        // Show/hide clear button
        if (clearBtn) {
            clearBtn.style.display = screenshots.length > 0 ? 'inline-block' : 'none';
        }

        // Update section styling
        if (screenshotSection) {
            if (screenshots.length > 0) {
                screenshotSection.classList.add('has-screenshots');
            } else {
                screenshotSection.classList.remove('has-screenshots');
            }
        }

        if (screenshots.length === 0) {
            // Show no screenshots state
            statusContainer.innerHTML = `
                <div class="no-screenshots">
                    <div class="screenshot-icon">📷</div>
                    <div class="screenshot-text">No screenshots</div>
                </div>
            `;
        } else {
            // Show screenshots list
            statusContainer.innerHTML = `
                <div class="screenshots-list">
                    ${screenshots.map((screenshot, index) => this.createScreenshotItem(screenshot, index + 1)).join('')}
                </div>
            `;
        }
    }

    createScreenshotItem(screenshot, number) {
        return `
            <div class="screenshot-item">
                <div class="screenshot-preview">
                    <img src="${screenshot.preview.dataUrl}" alt="Screenshot ${number}" />
                </div>
                <div class="screenshot-info">
                    <div class="screenshot-name">Screenshot ${number}</div>
                    <div class="screenshot-details">
                        ${screenshot.dimensions.width}x${screenshot.dimensions.height} • ${this.formatFileSize(screenshot.fileSize)}
                    </div>
                </div>
                <div class="screenshot-actions">
                    <button type="button" class="btn-screenshot-action remove" onclick="window.screenshotManager.removeScreenshot('${screenshot.id}')" title="Remove Screenshot">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    setScreenshotButtonState(state) {
        const takeBtn = document.getElementById('takeScreenshotBtn');
        if (!takeBtn) return;

        switch (state) {
            case 'loading':
                takeBtn.disabled = true;
                takeBtn.textContent = '📷 Taking...';
                break;
            case 'normal':
            default:
                takeBtn.disabled = false;
                takeBtn.textContent = '📷 Capture';
                break;
        }
    }
}

// Global function for updating screenshots display (called from main app)
window.updateScreenshotsDisplay = (screenshots) => {
    if (window.screenshotManager) {
        window.screenshotManager.updateScreenshotsDisplay(screenshots);
    }
};

// Initialize screenshot manager
window.screenshotManager = new ScreenshotManager();