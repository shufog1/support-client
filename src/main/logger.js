const log = require('electron-log');
const path = require('path');
const fs = require('fs');

// Rotation config: max 5 MB per file, keep last 3 archives.
// Log file lands in %APPDATA%\solveit-support-client\logs\main.log
// (electron-log resolves the userData path automatically in the main process).
log.transports.file.maxSize = 5 * 1024 * 1024;

log.transports.file.archiveLogFn = (oldLogFile) => {
    const dir = path.dirname(oldLogFile.toString());
    const base = path.basename(oldLogFile.toString(), path.extname(oldLogFile.toString()));
    const ext = path.extname(oldLogFile.toString());
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archivePath = path.join(dir, `${base}-${timestamp}${ext}`);

    try {
        fs.renameSync(oldLogFile.toString(), archivePath);
    } catch {
        // If rename fails, electron-log falls back to its default behavior
    }

    // Prune archives: keep only the 3 most recent, delete the rest
    try {
        const archives = fs.readdirSync(dir)
            .filter(f => f.startsWith(base + '-') && f.endsWith(ext))
            .map(f => path.join(dir, f))
            .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

        archives.slice(3).forEach(old => {
            try { fs.unlinkSync(old); } catch { /* ignore */ }
        });
    } catch {
        // Prune failure is non-fatal
    }

    return archivePath;
};

// Format: [timestamp] [level] message
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
log.transports.console.format = '[{h}:{i}:{s}] [{level}] {text}';

// In production, suppress info/debug from the console — they go to file only.
// Errors and warnings still appear in the console for visibility.
if (!process.argv.includes('--dev')) {
    log.transports.console.level = 'warn';
}

log.transports.file.level = 'info';

module.exports = log;
