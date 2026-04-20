const { desktopCapturer } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class ScreenshotManager {
    constructor() {
        // Use temp directory for screenshot files
        this.tempDir = path.join(os.tmpdir(), 'IT-Support-Screenshots');
        this.appDataDir = path.join(os.homedir(), 'AppData', 'Roaming', 'IT Support Client');
        this.logPath = path.join(this.appDataDir, 'screenshot.log');
        this.screenshots = []; // Array to store multiple screenshots
    }

    async log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        console.log(`[Screenshot] ${message}`);
        
        try {
            await this.ensureDirectories();
            await fs.appendFile(this.logPath, logMessage);
        } catch (error) {
            // Ignore log file errors
        }
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.appDataDir, { recursive: true });
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            // Directories might already exist
        }
    }

    async captureFullScreen() {
        try {
            await this.log('Starting full screen capture...');
            
            // Get all available screens
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: { width: 1920, height: 1080 }
            });
console.log('Sources found:', sources.length, sources);
            if (sources.length === 0) {
                throw new Error('No screens available for capture');
            }

            // Capture the primary screen (first one)
            const primaryScreen = sources[0];
            await this.log(`Capturing screen: ${primaryScreen.name}`);

            // Get the full-size screenshot
            const fullSources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1920, height: 1080 } // Use fixed size instead
});
            });
console.log('Full sources found:', fullSources.length, fullSources);
            const fullScreen = fullSources.find(s => s.id === primaryScreen.id);
            console.log('Full screen object:', fullScreen);
console.log('Has thumbnail?', fullScreen && fullScreen.thumbnail);
            if (!fullScreen || !fullScreen.thumbnail) {
                throw new Error('Failed to capture full screen');
            }

            // Convert to PNG buffer
            const imageBuffer = fullScreen.thumbnail.toPNG();
            
            // Create unique filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `screenshot-${timestamp}.png`;
            const filepath = path.join(this.tempDir, filename);
            
            // Save screenshot to file
            await this.ensureDirectories();
            await fs.writeFile(filepath, imageBuffer);
            
            // Create thumbnail for preview (200x150)
            const previewThumbnail = fullScreen.thumbnail.resize({ width: 200, height: 150 });
            const previewBase64 = previewThumbnail.toPNG().toString('base64');

            // Create screenshot object
            const screenshot = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                filename: filename,
                filepath: filepath,
                screenName: fullScreen.name,
                preview: {
                    base64: previewBase64,
                    dataUrl: `data:image/png;base64,${previewBase64}`,
                    width: 200,
                    height: 150
                },
                dimensions: {
                    width: fullScreen.thumbnail.getSize().width,
                    height: fullScreen.thumbnail.getSize().height
                },
                fileSize: imageBuffer.length
            };

            // Add to screenshots array
            this.screenshots.push(screenshot);

            await this.log(`Screenshot saved: ${filepath} (${this.formatBytes(imageBuffer.length)})`);
            
            return {
                success: true,
                screenshot: screenshot,
                message: 'Screenshot captured and saved successfully',
                totalScreenshots: this.screenshots.length
            };

        } catch (error) {
            await this.log(`Error capturing screenshot: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Failed to capture screenshot'
            };
        }
    }

    // Get all current screenshots
    getScreenshots() {
        return {
            success: true,
            screenshots: this.screenshots,
            count: this.screenshots.length
        };
    }

    // Remove a specific screenshot
    async removeScreenshot(screenshotId) {
        try {
            const index = this.screenshots.findIndex(s => s.id === screenshotId);
            if (index === -1) {
                return {
                    success: false,
                    message: 'Screenshot not found'
                };
            }

            const screenshot = this.screenshots[index];
            
            // Delete the file
            try {
                await fs.unlink(screenshot.filepath);
                await this.log(`Screenshot file deleted: ${screenshot.filepath}`);
            } catch (error) {
                await this.log(`Warning: Could not delete file ${screenshot.filepath}: ${error.message}`);
            }

            // Remove from array
            this.screenshots.splice(index, 1);

            return {
                success: true,
                message: 'Screenshot removed successfully',
                totalScreenshots: this.screenshots.length
            };

        } catch (error) {
            await this.log(`Error removing screenshot: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Failed to remove screenshot'
            };
        }
    }

    // Clear all screenshots
    async clearAllScreenshots() {
        try {
            // Delete all files
            for (const screenshot of this.screenshots) {
                try {
                    await fs.unlink(screenshot.filepath);
                } catch (error) {
                    await this.log(`Warning: Could not delete ${screenshot.filepath}: ${error.message}`);
                }
            }

            const count = this.screenshots.length;
            this.screenshots = [];

            await this.log(`Cleared ${count} screenshots`);
            
            return {
                success: true,
                message: `Cleared ${count} screenshots`,
                totalScreenshots: 0
            };

        } catch (error) {
            await this.log(`Error clearing screenshots: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Failed to clear screenshots'
            };
        }
    }

    // Get screenshot file paths for form attachment
    getScreenshotFilePaths() {
        return this.screenshots.map(s => s.filepath);
    }

    // Clean up old screenshot files (call on app start)
    async cleanupOldScreenshots() {
        try {
            await this.ensureDirectories();
            
            const files = await fs.readdir(this.tempDir);
            let cleanedCount = 0;
            
            for (const file of files) {
                if (file.startsWith('screenshot-') && file.endsWith('.png')) {
                    const filepath = path.join(this.tempDir, file);
                    try {
                        // Delete files older than 24 hours
                        const stats = await fs.stat(filepath);
                        const age = Date.now() - stats.mtime.getTime();
                        const hours = age / (1000 * 60 * 60);
                        
                        if (hours > 24) {
                            await fs.unlink(filepath);
                            cleanedCount++;
                        }
                    } catch (error) {
                        // Ignore individual file errors
                    }
                }
            }

            if (cleanedCount > 0) {
                await this.log(`Cleaned up ${cleanedCount} old screenshot files`);
            }

            return {
                success: true,
                cleanedCount: cleanedCount
            };

        } catch (error) {
            await this.log(`Error during cleanup: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility function to format bytes
    formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Get temp directory path (for external access)
    getTempDirectory() {
        return this.tempDir;
    }

    // Health check
    async checkCapabilities() {
        try {
            const sources = await desktopCapturer.getSources({
                types: ['screen'],
                thumbnailSize: { width: 1, height: 1 }
            });

            await this.ensureDirectories();

            return {
                success: true,
                screensAvailable: sources.length,
                tempDirectory: this.tempDir,
                capabilities: {
                    fullScreen: true,
                    multiScreen: sources.length > 1,
                    fileSaving: true,
                    multipleScreenshots: true
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                capabilities: {
                    fullScreen: false,
                    multiScreen: false,
                    fileSaving: false,
                    multipleScreenshots: false
                }
            };
        }
    }
}

module.exports = ScreenshotManager;