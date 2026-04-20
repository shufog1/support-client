const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const appConfig = require('../../config/app.config.json');

const execAsync = promisify(exec);

class SystemInfoCollector {
    constructor() {
        // Use AppData for persistent storage — folder name sourced from config
        this.appDataDir = path.join(os.homedir(), 'AppData', 'Roaming', appConfig.paths.appDataFolderName);
        this.systemInfoPath = path.join(this.appDataDir, 'system-info.json');
        this.logPath = path.join(this.appDataDir, 'system-info.log');
    }

    async log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        console.log(`[SystemInfo] ${message}`);
        
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

    async runCommand(command, description, timeout = appConfig.timeouts.execMs) {
        try {
            await this.log(`Running: ${description}`);
            
            const startTime = Date.now();
            const { stdout, stderr } = await execAsync(command, { timeout });
            const duration = Date.now() - startTime;
            
            await this.log(`Completed in ${duration}ms - Output length: ${stdout.length}`);
            await this.log(`Raw output: ${stdout.substring(0, 300)}`);
            
            if (stderr) {
                await this.log(`Warning: ${stderr}`);
            }
            
            return stdout.trim();
            
        } catch (error) {
            await this.log(`Error in ${description}: ${error.message}`);
            return null;
        }
    }

    async collectSystemInfo() {
        await this.log('=== System Information Collection Started ===');
        
        try {
            // Handle .asar packaging - extract script to temp location
            let scriptPath = path.join(__dirname, 'system-info.ps1');
            
            // Check if we're running from .asar (packaged app)
            if (scriptPath.includes('.asar')) {
                await this.log('Running from packaged app - extracting PowerShell script...');
                
                // Create temp script in a writable location — dir name from config
                const tempDir = path.join(os.tmpdir(), appConfig.paths.psScriptTempDir);
                const tempScriptPath = path.join(tempDir, 'system-info.ps1');
                
                try {
                    await fs.mkdir(tempDir, { recursive: true });
                    
                    // Read the script content from the .asar and write to temp location
                    const scriptContent = await fs.readFile(scriptPath, 'utf8');
                    await fs.writeFile(tempScriptPath, scriptContent, 'utf8');
                    
                    scriptPath = tempScriptPath;
                    await this.log(`Script extracted to: ${scriptPath}`);
                } catch (extractError) {
                    await this.log(`Failed to extract script: ${extractError.message}`);
                    throw new Error('Could not extract PowerShell script from package');
                }
            }
            
            await this.log(`Running PowerShell script: ${scriptPath}`);
            
            const psCommand = `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`;
            const { stdout, stderr } = await execAsync(psCommand, { timeout: appConfig.timeouts.psScriptMs });
            
            if (stderr) {
                await this.log(`PowerShell warnings: ${stderr}`);
            }
            
            // Parse the JSON output
            let systemInfo;
            try {
                systemInfo = JSON.parse(stdout);
                await this.log('Successfully parsed PowerShell JSON output');
            } catch (parseError) {
                await this.log(`JSON parse error: ${parseError.message}`);
                await this.log(`Raw output: ${stdout.substring(0, 500)}...`);
                throw new Error('Failed to parse PowerShell output as JSON');
            }
            
            // Add collection metadata
            systemInfo.collectionInfo = {
                timestamp: new Date().toISOString(),
                method: 'PowerShell Script',
                version: appConfig.collectionMetadataVersion
            };
            
            // Calculate additional memory info using Node.js
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            
            // Enhance memory information with current usage
            systemInfo.hardware.memory.free = this.formatBytes(freeMem);
            systemInfo.hardware.memory.used = this.formatBytes(usedMem);
            systemInfo.hardware.memory.usagePercent = Math.round((usedMem / totalMem) * 100);
            
            // Ensure we have the total memory from our calculation if PowerShell failed
            if (systemInfo.hardware.memory.totalBytes === 0) {
                systemInfo.hardware.memory.total = this.formatBytes(totalMem);
                systemInfo.hardware.memory.totalBytes = totalMem;
            }
            
            await this.log('=== System Collection Completed Successfully ===');
            return systemInfo;
            
        } catch (error) {
            await this.log(`Error during PowerShell collection: ${error.message}`);
            
            // Fallback to basic Node.js info if PowerShell fails
            await this.log('Falling back to basic Node.js system info...');
            
            const fallbackInfo = {
                collectionInfo: {
                    timestamp: new Date().toISOString(),
                    method: 'Node.js Fallback',
                    version: appConfig.collectionMetadataVersion
                },
                computer: {
                    name: os.hostname(),
                    manufacturer: 'Unknown',
                    model: 'Unknown',
                    serialNumber: 'Unknown'
                },
                operatingSystem: {
                    name: `${os.type()} ${os.release()}`,
                    version: os.release(),
                    architecture: os.arch()
                },
                hardware: {
                    processor: {
                        name: os.cpus()[0]?.model || 'Unknown CPU',
                        cores: os.cpus().length,
                        maxSpeed: 'Unknown'
                    },
                    memory: {
                        total: this.formatBytes(os.totalmem()),
                        free: this.formatBytes(os.freemem()),
                        used: this.formatBytes(os.totalmem() - os.freemem()),
                        usagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
                        totalBytes: os.totalmem(),
                        slots: {
                            total: 'Unknown',
                            used: 'Unknown',
                            details: []
                        }
                    },
                    gpu: [{ name: 'Unknown', memory: 'Unknown' }],
                    storage: {
                        drives: []
                    }
                },
                network: {
                    hostname: os.hostname(),
                    interfaces: this.getNetworkInterfaces()
                },
                user: {
                    username: os.userInfo().username,
                    domain: process.env.USERDOMAIN || 'Unknown',
                    homedir: os.userInfo().homedir
                },
                status: {
                    uptime: this.formatUptime(os.uptime()),
                    lastBoot: new Date(Date.now() - (os.uptime() * 1000)).toISOString(),
                    currentTime: new Date().toISOString(),
                    platform: os.platform(),
                    nodeVersion: process.version,
                    collectedAt: new Date().toISOString()
                }
            };
            
            await this.log('Fallback system info created');
            return fallbackInfo;
        }
    }

    getNetworkInterfaces() {
        const interfaces = os.networkInterfaces();
        const result = [];
        
        for (const [name, addresses] of Object.entries(interfaces)) {
            for (const addr of addresses) {
                if (!addr.internal && addr.family === 'IPv4') {
                    result.push({
                        name: name,
                        address: addr.address,
                        netmask: addr.netmask,
                        mac: addr.mac,
                        family: addr.family
                    });
                }
            }
        }
        
        return result;
    }

    parseWMICValue(output) {
        if (!output) return null;
        
        console.log('Parsing WMI output:', output.substring(0, 200)); // Debug line
        
        const lines = output.split('\n');
        for (const line of lines) {
            if (line.includes('=')) {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const value = parts[1].trim();
                    if (value && value !== '' && value !== 'null') {
                        console.log('Found WMI value:', value); // Debug line
                        return value;
                    }
                }
            }
        }
        return null;
    }

    // Helper function to parse multiple WMIC /value records
    parseWMICMultipleValues(output) {
        if (!output) return [];
        
        const records = [];
        let currentRecord = {};
        
        const lines = output.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine === '') {
                if (Object.keys(currentRecord).length > 0) {
                    records.push(currentRecord);
                    currentRecord = {};
                }
            } else if (trimmedLine.includes('=')) {
                const [key, value] = trimmedLine.split('=');
                if (key && value !== undefined) {
                    currentRecord[key.trim()] = value.trim();
                }
            }
        }
        
        if (Object.keys(currentRecord).length > 0) {
            records.push(currentRecord);
        }
        
        return records;
    }

    // Parse RAM slot information
    parseRAMSlots(output) {
        if (!output) return { totalSlots: 'Unknown', usedSlots: 'Unknown', details: [] };
        
        const slots = this.parseWMICMultipleValues(output);
        const usedSlots = slots.filter(slot => slot.Capacity && parseInt(slot.Capacity) > 0);
        
        return {
            totalSlots: slots.length || 'Unknown',
            usedSlots: usedSlots.length || 'Unknown',
            details: usedSlots.map(slot => ({
                location: slot.DeviceLocator || 'Unknown',
                capacity: this.formatBytes(parseInt(slot.Capacity) || 0)
            }))
        };
    }

    // Parse GPU information
    parseGPUInfo(output) {
        if (!output) return [{ name: 'Unknown', memory: 'Unknown' }];
        
        const gpus = this.parseWMICMultipleValues(output);
        const validGPUs = gpus.filter(gpu => gpu.Name && gpu.Name.trim() !== '');
        
        if (validGPUs.length === 0) {
            return [{ name: 'Unknown', memory: 'Unknown' }];
        }
        
        return validGPUs.map(gpu => ({
            name: gpu.Name || 'Unknown GPU',
            memory: gpu.AdapterRAM && parseInt(gpu.AdapterRAM) > 0 ? 
                this.formatBytes(parseInt(gpu.AdapterRAM)) : 'Unknown'
        }));
    }

    formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) {
            return `${days} days, ${hours} hours, ${minutes} minutes`;
        } else if (hours > 0) {
            return `${hours} hours, ${minutes} minutes`;
        } else {
            return `${minutes} minutes`;
        }
    }

    async saveSystemInfo(systemInfo) {
        try {
            await this.ensureAppDataDirectory();
            await fs.writeFile(this.systemInfoPath, JSON.stringify(systemInfo, null, 2));
            await this.log(`System info saved to: ${this.systemInfoPath}`);
            return true;
        } catch (error) {
            await this.log(`Error saving system info: ${error.message}`);
            return false;
        }
    }

    async loadSystemInfo() {
        try {
            const data = await fs.readFile(this.systemInfoPath, 'utf8');
            const systemInfo = JSON.parse(data);
            await this.log('System info loaded from cache');
            return systemInfo;
        } catch (error) {
            await this.log(`Error loading system info: ${error.message}`);
            return null;
        }
    }

    async needsRefresh() {
        try {
            const cachedInfo = await this.loadSystemInfo();
            if (!cachedInfo) {
                await this.log('No cached system info found - refresh needed');
                return true;
            }

            // Check if system was restarted since last scan
            const currentUptime = os.uptime();
            const currentBootTime = new Date(Date.now() - (currentUptime * 1000));
            const lastScanTime = new Date(cachedInfo.collectionInfo.timestamp);
            
            if (currentBootTime > lastScanTime) {
                await this.log('System restart detected - refresh needed');
                return true;
            }

            await this.log('System info is current - no refresh needed');
            return false;
        } catch (error) {
            await this.log(`Error checking refresh status: ${error.message}`);
            return true; // Default to refresh on error
        }
    }

    async collectAndSave() {
        try {
            await this.log('Starting system info collection and save...');
            const systemInfo = await this.collectSystemInfo();
            const saved = await this.saveSystemInfo(systemInfo);
            
            if (saved) {
                await this.log('System info collected and saved successfully');
                return systemInfo;
            } else {
                throw new Error('Failed to save system info');
            }
        } catch (error) {
            await this.log(`Failed to collect and save system info: ${error.message}`);
            throw error;
        }
    }

    async getSystemInfo(forceRefresh = false) {
        try {
            if (forceRefresh || await this.needsRefresh()) {
                await this.log('Collecting fresh system info...');
                return await this.collectAndSave();
            } else {
                await this.log('Using cached system info...');
                return await this.loadSystemInfo();
            }
        } catch (error) {
            await this.log(`Error getting system info: ${error.message}`);
            throw error;
        }
    }
}

module.exports = SystemInfoCollector;