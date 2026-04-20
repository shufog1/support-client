export class Tools {
    constructor(toast) {
        this.toast = toast;
    }

    async handleToolExecution(toolName) {
        try {
            this.toast.showMessage('🔧 Running ' + toolName + '...', 'info');

            let result;

            switch(toolName.toLowerCase()) {
                case 'restart':
                    result = await window.systemUtils.restartComputer();
                    break;
                case 'updates':
                    result = await window.systemUtils.checkWindowsUpdates();
                    break;
                case 'network':
                    result = await window.systemUtils.runNetworkReset();
                    break;
                case 'cleanup':
                    result = await window.systemUtils.runDiskCleanup();
                    break;
                case 'display':
                    result = await window.systemUtils.openDisplaySettings();
                    break;
                case 'device':
                    result = await window.systemUtils.openDeviceManager();
                    break;
                default:
                    result = { success: false, message: 'Unknown tool: ' + toolName };
            }

            if (result && result.success) {
                this.toast.showMessage('✅ ' + result.message, 'success');
            } else {
                this.toast.showMessage('❌ ' + (result?.message || 'Failed to run ' + toolName), 'error');
            }
        } catch (error) {
            this.toast.showMessage('❌ Error running ' + toolName + ': ' + error.message, 'error');
        }
    }
}
