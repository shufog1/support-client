const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;

const execAsync = promisify(exec);

class SystemToolsManager {
    constructor() {
        // Use AppData for logging
        this.appDataDir = path.join(os.homedir(), 'AppData', 'Roaming', 'IT Support Client');
        this.logPath = path.join(this.appDataDir, 'system-tools.log');
    }

    async log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        console.log(`[SystemTools] ${message}`);
        
        try {
            await this.ensureAppDataDirectory();
            await fs.appendFile(this.logPath, logMessage);
        } catch (error) {
            // Ignore log file errors
        }
    }

    async ensureAppDataDirectory() {
        try {
            await fs.mkdir(this.appDataDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
    }

    async runPowerShellCommand(command, description, timeout = 10000) {
        try {
            await this.log(`Running: ${description} - Command: ${command}`);
            
            const startTime = Date.now();
            const { stdout, stderr } = await execAsync(`powershell.exe -Command "${command}"`, { 
                timeout,
                windowsHide: true 
            });
            const duration = Date.now() - startTime;
            
            await this.log(`Completed in ${duration}ms`);
            
            if (stderr) {
                await this.log(`Warning: ${stderr}`);
            }
            
            return {
                success: true,
                output: stdout.trim(),
                message: `${description} completed successfully`
            };
            
        } catch (error) {
            await this.log(`Error in ${description}: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: `Failed to ${description.toLowerCase()}`
            };
        }
    }

    async runWindowsCommand(command, description, timeout = 10000) {
        try {
            await this.log(`Running: ${description} - Command: ${command}`);
            
            const startTime = Date.now();
            const { stdout, stderr } = await execAsync(command, { 
                timeout,
                windowsHide: true 
            });
            const duration = Date.now() - startTime;
            
            await this.log(`Completed in ${duration}ms`);
            
            if (stderr) {
                await this.log(`Warning: ${stderr}`);
            }
            
            return {
                success: true,
                output: stdout.trim(),
                message: `${description} completed successfully`
            };
            
        } catch (error) {
            await this.log(`Error in ${description}: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: `Failed to ${description.toLowerCase()}`
            };
        }
    }

    // Tool 1: Restart Computer (with confirmation handled by main process)
    async restartComputer() {
        try {
            await this.log('Initiating system restart...');
            
            // Use shutdown command with 30 second delay for safety
            const result = await this.runWindowsCommand(
                'shutdown /r /t 30 /c "System restart initiated by IT Support Client"',
                'Schedule system restart'
            );
            
            if (result.success) {
                await this.log('System restart scheduled successfully');
                return {
                    success: true,
                    message: 'System will restart in 30 seconds. Save your work!',
                    action: 'restart_scheduled'
                };
            } else {
                return result;
            }
            
        } catch (error) {
            await this.log(`Restart error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Failed to schedule system restart'
            };
        }
    }

    // Tool 2: Open Windows Update Settings
    async openWindowsUpdate() {
        try {
            await this.log('Opening Windows Update settings...');
            
            const result = await this.runPowerShellCommand(
                'Start-Process ms-settings:windowsupdate',
                'Open Windows Update settings'
            );
            
            return result;
            
        } catch (error) {
            await this.log(`Windows Update error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Failed to open Windows Update settings'
            };
        }
    }

    // Tool 3: Open Network Settings
    async openNetworkSettings() {
        try {
            await this.log('Opening Network & Internet settings...');
            
            const result = await this.runPowerShellCommand(
                'Start-Process ms-settings:network',
                'Open Network & Internet settings'
            );
            
            return result;
            
        } catch (error) {
            await this.log(`Network settings error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Failed to open Network settings'
            };
        }
    }

    // Tool 4: Launch Disk Cleanup
    async runDiskCleanup() {
        try {
            await this.log('Launching Disk Cleanup utility...');
            
            // Launch cleanmgr for C: drive
            const result = await this.runWindowsCommand(
                'cleanmgr /d C:',
                'Launch Disk Cleanup utility'
            );
            
            return result;
            
        } catch (error) {
            await this.log(`Disk cleanup error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Failed to launch Disk Cleanup'
            };
        }
    }

    // Tool 5: Open Display Settings
    async openDisplaySettings() {
        try {
            await this.log('Opening Display settings...');
            
            const result = await this.runPowerShellCommand(
                'Start-Process ms-settings:display',
                'Open Display settings'
            );
            
            return result;
            
        } catch (error) {
            await this.log(`Display settings error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Failed to open Display settings'
            };
        }
    }

    // Tool 6: Open Device Manager
    async openDeviceManager() {
        try {
            await this.log('Opening Device Manager...');
            
            const result = await this.runWindowsCommand(
                'devmgmt.msc',
                'Open Device Manager'
            );
            
            return result;
            
        } catch (error) {
            await this.log(`Device Manager error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Failed to open Device Manager'
            };
        }
    }

    // Tool 7: Open Printer Settings
    async openPrinterSettings() {
        try {
            await this.log('Opening Printers & Scanners settings...');
            
            const result = await this.runPowerShellCommand(
                'Start-Process ms-settings:printers',
                'Open Printers & Scanners settings'
            );
            
            return result;
            
        } catch (error) {
            await this.log(`Printer settings error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Failed to open Printer settings'
            };
        }
    }

    // Tool 8: Open Sound Settings
    async openSoundSettings() {
        try {
            await this.log('Opening Sound settings...');
            
            const result = await this.runPowerShellCommand(
                'Start-Process ms-settings:sound',
                'Open Sound settings'
            );
            
            return result;
            
        } catch (error) {
            await this.log(`Sound settings error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Failed to open Sound settings'
            };
        }
    }

    // Tool 9: Network Reset/Troubleshooter
    async runNetworkReset() {
        try {
            await this.log('Running Network troubleshooter...');
            
            // Launch Windows Network troubleshooter
            const result = await this.runPowerShellCommand(
                'Start-Process msdt.exe -ArgumentList "/id NetworkDiagnosticsDA"',
                'Launch Network troubleshooter'
            );
            
            return result;
            
        } catch (error) {
            await this.log(`Network reset error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Failed to run Network troubleshooter'
            };
        }
    }

    // Cancel restart if needed
    async cancelRestart() {
        try {
            await this.log('Cancelling scheduled restart...');
            
            const result = await this.runWindowsCommand(
                'shutdown /a',
                'Cancel scheduled restart'
            );
            
            if (result.success) {
                await this.log('Restart cancelled successfully');
                return {
                    success: true,
                    message: 'System restart has been cancelled',
                    action: 'restart_cancelled'
                };
            } else {
                return result;
            }
            
        } catch (error) {
            await this.log(`Cancel restart error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'Failed to cancel restart'
            };
        }
    }

    // Health check - test if PowerShell is available
    async checkSystemToolsHealth() {
        try {
            await this.log('Checking system tools health...');
            
            // Test PowerShell availability
            const psTest = await this.runPowerShellCommand(
                'Write-Output "PowerShell OK"',
                'Test PowerShell availability',
                5000
            );
            
            // Test basic command availability
            const cmdTest = await this.runWindowsCommand(
                'echo Command OK',
                'Test Command prompt availability',
                5000
            );
            
            return {
                success: true,
                powerShell: psTest.success,
                commandPrompt: cmdTest.success,
                message: 'System tools health check completed'
            };
            
        } catch (error) {
            await this.log(`Health check error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                message: 'System tools health check failed'
            };
        }
    }
}

module.exports = SystemToolsManager;