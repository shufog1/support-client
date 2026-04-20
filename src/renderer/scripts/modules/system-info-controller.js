export class SystemInfoController {
    constructor(state, toast) {
        this.state = state;
        this.toast = toast;
        this._loaderInjected = false;
    }

    _ensureLoader() {
        if (this._loaderInjected) return;
        this._loaderInjected = true;

        const userInfo = document.querySelector('.user-info');
        if (!userInfo) return;

        const loader = document.createElement('div');
        loader.id = 'sysInfoLoader';
        loader.className = 'sys-info-loader';
        loader.innerHTML = '<div class="sys-info-spinner"></div><span>Collecting system info...</span>';
        loader.style.display = 'none';
        userInfo.appendChild(loader);
    }

    _showLoader() {
        this._ensureLoader();
        const loader = document.getElementById('sysInfoLoader');
        const details = document.querySelector('.user-details');
        if (loader) loader.style.display = 'flex';
        if (details) details.style.opacity = '0';
    }

    _hideLoader() {
        const loader = document.getElementById('sysInfoLoader');
        const details = document.querySelector('.user-details');
        if (loader) loader.style.display = 'none';
        if (details) {
            details.style.transition = 'opacity 0.3s ease';
            details.style.opacity = '1';
        }
    }

    async loadSystemInformation() {
        try {
            this._showLoader();
            this.updateSystemStatus('Collecting...', 'loading');

            const result = await window.electronAPI.getSystemInfo();

            if (result.success && result.data) {
                this.state.systemInfo = this.transformSystemInfo(result.data);
                this.updateSystemInfoDisplay();
                this.updateSystemStatus('Ready', 'healthy');
            } else {
                this.state.systemInfo = null;
                this.updateSystemInfoDisplay();
                this.updateSystemStatus('Unavailable', 'error');
            }
        } catch (error) {
            this.state.systemInfo = null;
            this.updateSystemInfoDisplay();
            this.updateSystemStatus('Error', 'error');
        } finally {
            this._hideLoader();
        }
    }

    transformSystemInfo(data) {
        return {
            computerName: data.computer?.name || 'Unknown',
            manufacturer: data.computer?.manufacturer || 'Unknown',
            model: data.computer?.model || 'Unknown',
            serialNumber: data.computer?.serialNumber || 'Unknown',
            osVersion: data.operatingSystem?.name || 'Unknown',
            osArchitecture: data.operatingSystem?.architecture || 'Unknown',
            cpu: {
                model: data.hardware?.processor?.name || 'Unknown',
                cores: data.hardware?.processor?.cores || 'Unknown'
            },
            memory: {
                total: data.hardware?.memory?.total || 'Unknown',
                free: data.hardware?.memory?.free || 'Unknown',
                used: data.hardware?.memory?.used || 'Unknown',
                usagePercent: data.hardware?.memory?.usagePercent || 0
            },
            gpu: data.hardware?.gpu || [{ name: 'Unknown', memory: 'Unknown' }],
            storage: data.storage?.drives || [],
            network: {
                hostname: data.network?.hostname || 'Unknown',
                primaryIP: data.network?.interfaces?.[0]?.address || 'Unknown',
                interfaces: data.network?.interfaces || []
            },
            currentUser: data.user?.username || 'Unknown',
            userDomain: data.user?.domain || 'Unknown',
            uptime: data.status?.uptime || 'Unknown',
            lastBoot: data.status?.lastBoot || 'Unknown',
            nodeVersion: data.status?.nodeVersion || 'Unknown',
            collectedAt: data.collectionInfo?.timestamp || new Date().toISOString()
        };
    }

    updateSystemInfoDisplay() {
        try {
            const computerNameEl = document.getElementById('computerName');

            if (!this.state.systemInfo) {
                if (computerNameEl) computerNameEl.textContent = 'Unavailable';
                return;
            }

            if (computerNameEl) {
                computerNameEl.textContent = this.state.systemInfo.computerName || 'Unknown';
            }
        } catch (error) {
            // ignore
        }
    }

    updateSystemStatus(statusText, statusType) {
        const statusTextEl = document.getElementById('systemStatusText');
        const statusDot = document.getElementById('systemStatusDot');

        if (statusTextEl) {
            statusTextEl.textContent = statusText;
        }

        if (statusDot) {
            statusDot.className = 'status-dot ' + statusType;
        }
    }

    async loadScreenshots() {
        // Screenshots are now handled differently - no need to load/display
    }

    async handleRefreshSystemInfo() {
        try {
            this.toast.showMessage('Refreshing system information...', 'info');
            this._showLoader();
            this.updateSystemStatus('Refreshing...', 'loading');

            const result = await window.electronAPI.refreshSystemInfo();

            if (result.success && result.data) {
                this.state.systemInfo = this.transformSystemInfo(result.data);
                this.updateSystemInfoDisplay();
                this.updateSystemStatus('Ready', 'healthy');
                this.toast.showMessage('System information refreshed!', 'success');

                const systemModal = document.getElementById('systemModal');
                if (systemModal && systemModal.style.display === 'block') {
                    this.state.modals.populateDetailedSystemInfo();
                }
            } else {
                this.updateSystemStatus('Error', 'error');
                this.toast.showMessage(result.error || 'Failed to refresh system information', 'error');
            }
        } catch (error) {
            this.updateSystemStatus('Error', 'error');
            this.toast.showMessage('Error refreshing system information', 'error');
        } finally {
            this._hideLoader();
        }
    }
}
