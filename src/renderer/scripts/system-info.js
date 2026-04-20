// System Information Functions
class SystemInfoHelper {
    constructor() {
        // System info will be managed by main app
        this.lastRefreshTime = null;
    }

    // Format system info for display
    formatSystemInfoForDisplay(systemInfo) {
        if (!systemInfo) {
            return {
                computerName: 'Unavailable',
                shortStatus: 'System info not available',
                detailedStatus: 'Could not collect system information'
            };
        }

        return {
            computerName: systemInfo.computerName || 'Unknown',
            shortStatus: `${systemInfo.osVersion} • ${systemInfo.memory.total} RAM`,
            detailedStatus: `${systemInfo.cpu.model} • ${systemInfo.network.primaryIP}`,
            lastUpdated: systemInfo.collectedAt
        };
    }

    // Generate comprehensive system report for tickets
    generateSystemReport(systemInfo, userInfo) {
        const timestamp = new Date().toISOString();
        
        if (!systemInfo) {
            return this.generateFailureReport(userInfo, timestamp);
        }

        return this.generateSuccessReport(systemInfo, userInfo, timestamp);
    }

    generateSuccessReport(systemInfo, userInfo, timestamp) {
        return `
╔══════════════════════════════════════════════════════════════╗
║                    SOLVEIT SUPPORT TICKET                     ║
║                   System Information Report                   ║
╚══════════════════════════════════════════════════════════════╝

📅 Generated: ${new Date(timestamp).toLocaleString()}
🎫 Ticket Type: Automated Support Request

╔══════════════════════════════════════════════════════════════╗
║                      USER INFORMATION                        ║
╚══════════════════════════════════════════════════════════════╝

👤 Contact Details:
   • Name: ${userInfo.firstName} ${userInfo.lastName}
   • Email: ${userInfo.email}
   • Phone: ${userInfo.phone}${userInfo.extension ? ' ext. ' + userInfo.extension : ''}
   • Department: ${userInfo.department || 'Not specified'}
   • Job Title: ${userInfo.jobTitle || 'Not specified'}

╔══════════════════════════════════════════════════════════════╗
║                    COMPUTER INFORMATION                      ║
╚══════════════════════════════════════════════════════════════╝

🖥️ System Overview:
   • Computer Name: ${systemInfo.computerName}
   • Manufacturer: ${systemInfo.manufacturer}
   • Model: ${systemInfo.model}
   • Serial Number: ${systemInfo.serialNumber}
   • Current User: ${systemInfo.currentUser}@${systemInfo.userDomain}

💻 Operating System:
   • OS: ${systemInfo.osVersion}
   • Architecture: ${systemInfo.osArchitecture}
   • System Uptime: ${systemInfo.uptime}
   • Last Boot: ${new Date(systemInfo.lastBoot).toLocaleString()}

╔══════════════════════════════════════════════════════════════╗
║                    HARDWARE SPECIFICATIONS                   ║
╚══════════════════════════════════════════════════════════════╝

🔧 Processor:
   • CPU: ${systemInfo.cpu.model}
   • Cores: ${systemInfo.cpu.cores}

🧠 Memory:
   • Total RAM: ${systemInfo.memory.total}
   • Available: ${systemInfo.memory.free}
   • Usage: ${systemInfo.memory.usagePercent}% used

${systemInfo.storage.length > 0 ? `💾 Storage:
${systemInfo.storage.map(drive => `   • Drive ${drive.drive}: ${drive.total} total, ${drive.free} free (${drive.usagePercent}% used)`).join('\n')}` : ''}

${systemInfo.gpu.length > 0 ? `🎮 Graphics:
${systemInfo.gpu.map(gpu => `   • ${gpu.name}${gpu.memory !== 'Unknown' ? ` (${gpu.memory})` : ''}`).join('\n')}` : ''}

╔══════════════════════════════════════════════════════════════╗
║                    NETWORK CONFIGURATION                     ║
╚══════════════════════════════════════════════════════════════╝

🌐 Network Details:
   • Hostname: ${systemInfo.network.hostname}
   • Primary IP: ${systemInfo.network.primaryIP}
   • Active Interfaces: ${systemInfo.network.interfaces.length}

${systemInfo.network.interfaces.length > 0 ? `📡 Network Interfaces:
${systemInfo.network.interfaces.map(iface => `   • ${iface.name}: ${iface.address} (MAC: ${iface.mac})`).join('\n')}` : ''}

╔══════════════════════════════════════════════════════════════╗
║                      SYSTEM STATUS                          ║
╚══════════════════════════════════════════════════════════════╝

⚡ Current Status:
   • Node.js Version: ${systemInfo.nodeVersion}
   • Data Collection: ${new Date(systemInfo.collectedAt).toLocaleString()}
   • Browser: ${typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').pop() : 'Unknown'}
   • Screen Resolution: ${typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'Unknown'}
   • Language: ${typeof navigator !== 'undefined' ? navigator.language : 'Unknown'}

╔══════════════════════════════════════════════════════════════╗
║                         END REPORT                          ║
╚══════════════════════════════════════════════════════════════╝

This report was automatically generated by SolveIT Quick Support Tool.
For technical support, contact: support@solveitsolutions.ca
        `;
    }

    generateFailureReport(userInfo, timestamp) {
        return `
╔══════════════════════════════════════════════════════════════╗
║                    SOLVEIT SUPPORT TICKET                     ║
║                   System Information Report                   ║
╚══════════════════════════════════════════════════════════════╝

📅 Generated: ${new Date(timestamp).toLocaleString()}
🎫 Ticket Type: Automated Support Request
⚠️  Status: System information collection failed

╔══════════════════════════════════════════════════════════════╗
║                      USER INFORMATION                        ║
╚══════════════════════════════════════════════════════════════╝

👤 Contact Details:
   • Name: ${userInfo.firstName} ${userInfo.lastName}
   • Email: ${userInfo.email}
   • Phone: ${userInfo.phone}${userInfo.extension ? ' ext. ' + userInfo.extension : ''}
   • Department: ${userInfo.department || 'Not specified'}
   • Job Title: ${userInfo.jobTitle || 'Not specified'}

╔══════════════════════════════════════════════════════════════╗
║                    SYSTEM INFORMATION                        ║
╚══════════════════════════════════════════════════════════════╝

❌ System Collection Status: FAILED
   • Reason: Could not access system information
   • Recommendation: Manual system details may be required
   • Browser: ${typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').pop() : 'Unknown'}
   • Screen: ${typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'Unknown'}

╔══════════════════════════════════════════════════════════════╗
║                         END REPORT                          ║
╚══════════════════════════════════════════════════════════════╝

Note: This ticket was created without automatic system information.
Please provide relevant system details manually in your description.

For technical support, contact: support@solveitsolutions.ca
        `;
    }

    // Check if system info needs refresh (every 30 minutes)
    needsRefresh(systemInfo) {
        if (!systemInfo || !systemInfo.collectedAt) {
            return true;
        }

        const lastCollection = new Date(systemInfo.collectedAt);
        const thirtyMinutesAgo = new Date(Date.now() - (30 * 60 * 1000));
        
        return lastCollection < thirtyMinutesAgo;
    }

    // Get system health status
    getSystemHealth(systemInfo) {
        if (!systemInfo) {
            return {
                status: 'error',
                message: 'System info unavailable',
                color: '#e74c3c'
            };
        }

        // Check memory usage
        if (systemInfo.memory.usagePercent > 90) {
            return {
                status: 'warning',
                message: 'High memory usage',
                color: '#f39c12'
            };
        }

        // Check storage usage
        const highStorageUsage = systemInfo.storage.some(drive => drive.usagePercent > 90);
        if (highStorageUsage) {
            return {
                status: 'warning',
                message: 'Low disk space',
                color: '#f39c12'
            };
        }

        return {
            status: 'healthy',
            message: 'System ready',
            color: '#27ae60'
        };
    }

    // Format uptime in a more readable way
    formatUptime(uptime) {
        if (!uptime || uptime === 'Unknown') {
            return 'Unknown';
        }

        // If uptime is already formatted, return as is
        if (typeof uptime === 'string' && uptime.includes('day')) {
            return uptime;
        }

        // If uptime is in seconds, convert it
        if (typeof uptime === 'number') {
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);

            if (days > 0) {
                return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
            } else if (hours > 0) {
                return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`;
            } else {
                return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
            }
        }

        return uptime;
    }

    // Get system summary for compact display
    getSystemSummary(systemInfo) {
        if (!systemInfo) {
            return 'System information unavailable';
        }

        const items = [];
        
        if (systemInfo.osVersion) {
            items.push(systemInfo.osVersion.split(' ')[0]); // Just "Windows" instead of full version
        }
        
        if (systemInfo.memory.total) {
            items.push(systemInfo.memory.total);
        }
        
        if (systemInfo.cpu.cores) {
            items.push(`${systemInfo.cpu.cores} cores`);
        }

        return items.length > 0 ? items.join(' • ') : 'System info available';
    }

    // Export system info to clipboard
    async exportSystemInfo(systemInfo, userInfo) {
        const report = this.generateSystemReport(systemInfo, userInfo);
        
        try {
            await navigator.clipboard.writeText(report);
            if (window.showToast) {
                window.showToast('System report copied to clipboard', 'success');
            }
            return true;
        } catch (error) {
            console.error('Failed to copy system report:', error);
            if (window.showToast) {
                window.showToast('Failed to copy system report', 'error');
            }
            return false;
        }
    }

    // Get critical system alerts
    getCriticalAlerts(systemInfo) {
        const alerts = [];

        if (!systemInfo) {
            alerts.push({
                type: 'error',
                message: 'System information not available',
                severity: 'high'
            });
            return alerts;
        }

        // Check memory usage
        if (systemInfo.memory.usagePercent > 95) {
            alerts.push({
                type: 'error',
                message: 'Critical memory usage detected',
                severity: 'high'
            });
        } else if (systemInfo.memory.usagePercent > 85) {
            alerts.push({
                type: 'warning',
                message: 'High memory usage detected',
                severity: 'medium'
            });
        }

        // Check disk usage
        systemInfo.storage.forEach(drive => {
            if (drive.usagePercent > 95) {
                alerts.push({
                    type: 'error',
                    message: `Drive ${drive.drive} critically low on space`,
                    severity: 'high'
                });
            } else if (drive.usagePercent > 85) {
                alerts.push({
                    type: 'warning',
                    message: `Drive ${drive.drive} low on space`,
                    severity: 'medium'
                });
            }
        });

        return alerts;
    }
}

// Global system info helper
window.systemInfoHelper = new SystemInfoHelper();

// Export commonly used functions
window.formatSystemSummary = (systemInfo) => window.systemInfoHelper.getSystemSummary(systemInfo);
window.getSystemHealth = (systemInfo) => window.systemInfoHelper.getSystemHealth(systemInfo);
window.exportSystemInfo = (systemInfo, userInfo) => window.systemInfoHelper.exportSystemInfo(systemInfo, userInfo);