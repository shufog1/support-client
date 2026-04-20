const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const log = require('./logger');
const appConfig = require('../../config/app.config.json');

const execAsync = promisify(exec);

class SystemInfoCollector {
  constructor() {
    // Use AppData for persistent system info cache — folder name sourced from config
    this.appDataDir = path.join(
      os.homedir(),
      'AppData',
      'Roaming',
      appConfig.paths.appDataFolderName
    );
    this.systemInfoPath = path.join(this.appDataDir, 'system-info.json');

    // In-memory cache for the extracted PowerShell script path.
    // Re-extraction only happens when the source file's mtime changes
    // (i.e. after an app update). Avoids redundant disk writes on every collection.
    this._cachedScriptPath = null;
    this._cachedScriptMtime = null;
  }

  async log(message) {
    log.info(`[SystemInfo] ${message}`);
  }

  async ensureAppDataDirectory() {
    try {
      await fs.mkdir(this.appDataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async getScriptPath() {
    const sourcePath = path.join(__dirname, 'system-info.ps1');

    if (!sourcePath.includes('.asar')) {
      return sourcePath;
    }

    // Running from a packaged .asar — script must be extracted to a writable temp dir.
    // Cache the extracted path in memory and only re-extract when the source mtime changes
    // (which happens after an app update rebuilds the .asar).
    let sourceMtime;
    try {
      const stat = await fs.stat(sourcePath);
      sourceMtime = stat.mtimeMs;
    } catch (err) {
      await this.log(`Cannot stat script source: ${err.message}`);
      throw new Error('Could not access PowerShell script in package');
    }

    if (this._cachedScriptPath && this._cachedScriptMtime === sourceMtime) {
      await this.log('Using cached extracted script path');
      return this._cachedScriptPath;
    }

    await this.log('Extracting PowerShell script from package...');
    const tempDir = path.join(os.tmpdir(), appConfig.paths.psScriptTempDir);
    const tempScriptPath = path.join(tempDir, 'system-info.ps1');

    try {
      await fs.mkdir(tempDir, { recursive: true });
      const scriptContent = await fs.readFile(sourcePath, 'utf8');
      await fs.writeFile(tempScriptPath, scriptContent, 'utf8');

      this._cachedScriptPath = tempScriptPath;
      this._cachedScriptMtime = sourceMtime;

      await this.log(`Script extracted to: ${tempScriptPath}`);
      return tempScriptPath;
    } catch (err) {
      await this.log(`Failed to extract script: ${err.message}`);
      throw new Error('Could not extract PowerShell script from package');
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
      const scriptPath = await this.getScriptPath();
      await this.log(`Running PowerShell script: ${scriptPath}`);

      const psCommand = `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`;
      const { stdout, stderr } = await execAsync(psCommand, {
        timeout: appConfig.timeouts.psScriptMs,
      });

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
        version: appConfig.collectionMetadataVersion,
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
          version: appConfig.collectionMetadataVersion,
        },
        computer: {
          name: os.hostname(),
          manufacturer: 'Unknown',
          model: 'Unknown',
          serialNumber: 'Unknown',
        },
        operatingSystem: {
          name: `${os.type()} ${os.release()}`,
          version: os.release(),
          architecture: os.arch(),
        },
        hardware: {
          processor: {
            name: os.cpus()[0]?.model || 'Unknown CPU',
            cores: os.cpus().length,
            maxSpeed: 'Unknown',
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
              details: [],
            },
          },
          gpu: [{ name: 'Unknown', memory: 'Unknown' }],
          storage: {
            drives: [],
          },
        },
        network: {
          hostname: os.hostname(),
          interfaces: this.getNetworkInterfaces(),
        },
        user: {
          username: os.userInfo().username,
          domain: process.env.USERDOMAIN || 'Unknown',
          homedir: os.userInfo().homedir,
        },
        status: {
          uptime: this.formatUptime(os.uptime()),
          lastBoot: new Date(Date.now() - os.uptime() * 1000).toISOString(),
          currentTime: new Date().toISOString(),
          platform: os.platform(),
          nodeVersion: process.version,
          collectedAt: new Date().toISOString(),
        },
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
            family: addr.family,
          });
        }
      }
    }

    return result;
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
      const currentBootTime = new Date(Date.now() - currentUptime * 1000);
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
      if (forceRefresh || (await this.needsRefresh())) {
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
