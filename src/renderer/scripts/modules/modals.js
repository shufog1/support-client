export class Modals {
    constructor(state, toast) {
        this.state = state;
        this.toast = toast;
    }

    setupModalControls() {
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                if (modalId) {
                    this.closeModal(modalId);
                }
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';

            if (modalId === 'systemModal') {
                this.populateDetailedSystemInfo();
            } else if (modalId === 'settingsModal') {
                this.populateSettingsForm();
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    populateDetailedSystemInfo() {
        const container = document.getElementById('detailedSystemInfo');
        if (!container) return;

        if (!this.state.systemInfo) {
            container.innerHTML = '<div class="system-unavailable"><h4>❌ System Information Unavailable</h4><p>Could not collect system information. Try refreshing or contact support.</p></div>';
            return;
        }

        container.innerHTML = '<div class="system-section"><h4>Computer Information</h4>' +
            '<div class="system-item"><span class="system-label">Name:</span><span class="system-value">' + this.state.systemInfo.computerName + '</span></div>' +
            '<div class="system-item"><span class="system-label">Manufacturer:</span><span class="system-value">' + this.state.systemInfo.manufacturer + '</span></div>' +
            '<div class="system-item"><span class="system-label">Model:</span><span class="system-value">' + this.state.systemInfo.model + '</span></div>' +
            '<div class="system-item"><span class="system-label">OS:</span><span class="system-value">' + this.state.systemInfo.osVersion + '</span></div>' +
            '<div class="system-item"><span class="system-label">CPU:</span><span class="system-value">' + this.state.systemInfo.cpu.model + '</span></div>' +
            '<div class="system-item"><span class="system-label">Memory:</span><span class="system-value">' + this.state.systemInfo.memory.total + ' (' + this.state.systemInfo.memory.usagePercent + '% used)</span></div>' +
            '<div class="system-item"><span class="system-label">Network:</span><span class="system-value">' + this.state.systemInfo.network.primaryIP + '</span></div>' +
            '</div>' +
            '<div class="system-section"><h4>System Status</h4>' +
            '<div class="system-item"><span class="system-label">Uptime:</span><span class="system-value">' + this.state.systemInfo.uptime + '</span></div>' +
            '<div class="system-item"><span class="system-label">User:</span><span class="system-value">' + this.state.systemInfo.currentUser + '@' + this.state.systemInfo.userDomain + '</span></div>' +
            '<div class="system-item"><span class="system-label">Last Scan:</span><span class="system-value">' + new Date(this.state.systemInfo.collectedAt).toLocaleString() + '</span></div>' +
            '</div>';
    }

    populateUserInfo() {
        const fullName = this.state.userSettings.firstName + ' ' + this.state.userSettings.lastName;

        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');

        if (userName) userName.textContent = fullName || 'Not Set';
        if (userEmail) userEmail.textContent = this.state.userSettings.email || 'Not Set';

        this.populateSettingsForm();
    }

    populateSettingsForm() {
        const fields = {
            'settingsFirstName': this.state.userSettings.firstName,
            'settingsLastName': this.state.userSettings.lastName,
            'settingsEmail': this.state.userSettings.email,
            'settingsDepartment': this.state.userSettings.department,
            'settingsPhone': this.state.userSettings.phone
        };

        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
            }
        });
    }
}
