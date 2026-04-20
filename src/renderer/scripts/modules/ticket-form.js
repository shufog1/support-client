export class TicketForm {
    constructor(state, toast, config) {
        this.state = state;
        this.toast = toast;
        this.config = config;
    }

    // Called once at boot — sets the form action URL and injects the Zoho token
    // hidden field values that were left blank in index.html (sourced from config).
    initZohoFormTokens() {
        const zoho = this.config.zoho;
        const form = document.getElementById('zsWebToCase_' + zoho.formId);
        if (form) {
            form.action = zoho.webToCaseUrl;
        }

        const xnQs = document.getElementById('zohoXnQsjsdp');
        const xmIwt = document.getElementById('zohoXmIwtLD');
        if (xnQs) xnQs.value = zoho.tokens.xnQsjsdp;
        if (xmIwt) xmIwt.value = zoho.tokens.xmIwtLD;
    }

    autoFillZohoForm() {
        try {
            const autoFirstName = document.getElementById('autoFirstName');
            const autoContactName = document.getElementById('autoContactName');
            const autoEmail = document.getElementById('autoEmail');
            const autoPhone = document.getElementById('autoPhone');

            if (autoFirstName) autoFirstName.value = this.state.userSettings.firstName || '';
            if (autoContactName) autoContactName.value = this.state.userSettings.lastName || '';
            if (autoEmail) autoEmail.value = this.state.userSettings.email || '';
            if (autoPhone) autoPhone.value = this.state.userSettings.phone || '';
        } catch (error) {
            // ignore
        }
    }

    setupDragAndDrop() {
        const dragArea = document.getElementById('dragDropArea');
        if (!dragArea) return;

        dragArea.addEventListener('click', (e) => {
            if (e.target.id !== 'takeScreenshotBtn' && window.zsAttachedAttachmentsCount < this.config.attachments.maxCount) {
                const nextAttachment = document.getElementById('zsattachment_' + window.zsAttachmentFileBrowserIdsList[0]);
                if (nextAttachment) {
                    nextAttachment.click();
                }
            }
        });

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dragArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dragArea.addEventListener(eventName, () => dragArea.classList.add('drag-over'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dragArea.addEventListener(eventName, () => dragArea.classList.remove('drag-over'), false);
        });

        dragArea.addEventListener('drop', (e) => this.handleFileDrop(e), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleFileDrop(e) {
        const files = e.dataTransfer.files;
        this.handleFileSelection([...files]);
    }

    handleFileSelection(files) {
        for (let i = 0; i < files.length && window.zsAttachedAttachmentsCount < this.config.attachments.maxCount; i++) {
            const file = files[i];
            const nextAttachmentId = window.zsAttachmentFileBrowserIdsList[0];
            const nextAttachment = document.getElementById('zsattachment_' + nextAttachmentId);

            if (nextAttachment) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                nextAttachment.files = dataTransfer.files;

                window.zsRenderBrowseFileAttachment(file.name, nextAttachment);
            }
        }
    }

    async handleTicketSubmission(e) {
        e.preventDefault();

        const formId = this.config.zoho.formId;
        const submitBtn = document.getElementById('zsSubmitButton_' + formId);
        const originalText = submitBtn.textContent;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            const subject = document.getElementById('ticketSubject').value.trim();
            const description = document.getElementById('ticketDescription').value.trim();

            if (!subject) {
                throw new Error('Please enter a subject for your ticket');
            }

            if (!description) {
                throw new Error('Please describe your issue');
            }

            const systemInfoText = this.generateSystemInfoText();
            const descriptionField = document.getElementById('ticketDescription');
            if (!descriptionField.value.includes('=== SYSTEM INFORMATION ===')) {
                descriptionField.value += systemInfoText;
            }

            const formData = new FormData(document.getElementById('zsWebToCase_' + formId));

            await fetch(this.config.zoho.webToCaseUrl, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            });

            await this.state.dialog.success(
                'Submission received',
                'Your submission has been received. Someone will reach out to you shortly.'
            );

            document.getElementById('zsWebToCase_' + formId).reset();
            this.autoFillZohoForm();

            window.zsResetWebForm(formId);

        } catch (error) {
            await this.state.dialog.error(
                'Couldn\'t submit',
                'Something went wrong sending your request. Please try again, or contact support directly at support@solveitsolutions.ca.'
            );

            this.toast.showMessage(error.message || '❌ Failed to submit ticket', 'error');

        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    generateSystemInfoText() {
        if (!this.state.systemInfo) {
            return `

==================================================
            SYSTEM INFORMATION
==================================================

STATUS: System information not available
NOTE: Could not collect system details for this ticket.

==================================================
              USER INFORMATION
==================================================

Name: ${this.state.userSettings.firstName} ${this.state.userSettings.lastName}
Email: ${this.state.userSettings.email}
Phone: ${this.state.userSettings.phone}${this.state.userSettings.extension ? ' ext. ' + this.state.userSettings.extension : ''}
Department: ${this.state.userSettings.department}`;
        }

        return `

==================================================
            SYSTEM INFORMATION REPORT
==================================================

Computer Name: ${this.state.systemInfo.computerName}
Manufacturer: ${this.state.systemInfo.manufacturer}
Model: ${this.state.systemInfo.model}
Serial Number: ${this.state.systemInfo.serialNumber}
Operating System: ${this.state.systemInfo.osVersion}
Architecture: ${this.state.systemInfo.osArchitecture}
Processor: ${this.state.systemInfo.cpu.model}
CPU Cores: ${this.state.systemInfo.cpu.cores}
Memory Total: ${this.state.systemInfo.memory.total}
Memory Usage: ${this.state.systemInfo.memory.usagePercent}% used
Network IP: ${this.state.systemInfo.network.primaryIP}
Network Hostname: ${this.state.systemInfo.network.hostname}
System Uptime: ${this.state.systemInfo.uptime}
Current User: ${this.state.systemInfo.currentUser}@${this.state.systemInfo.userDomain}
Last Boot: ${new Date(this.state.systemInfo.lastBoot).toLocaleString()}

${this.state.systemInfo.storage.length > 0 ? `Storage Details:\n${this.state.systemInfo.storage.map(drive => `Drive ${drive.drive}: ${drive.total} total, ${drive.free} free (${drive.usagePercent}% used)`).join('\n')}` : ''}

${this.state.systemInfo.gpu.length > 0 ? `Graphics:\n${this.state.systemInfo.gpu.map(gpu => `${gpu.name}${gpu.memory !== 'Unknown' ? ` (${gpu.memory})` : ''}`).join('\n')}` : ''}

${this.state.systemInfo.network.interfaces.length > 0 ? `Network Interfaces:\n${this.state.systemInfo.network.interfaces.map(iface => `${iface.name}: ${iface.address} (MAC: ${iface.mac})`).join('\n')}` : ''}

==================================================
              USER INFORMATION
==================================================

Name: ${this.state.userSettings.firstName} ${this.state.userSettings.lastName}
Email: ${this.state.userSettings.email}
Phone: ${this.state.userSettings.phone}${this.state.userSettings.extension ? ' ext. ' + this.state.userSettings.extension : ''}
Department: ${this.state.userSettings.department}
Job Title: ${this.state.userSettings.jobTitle}

==================================================
            SCREENSHOTS ATTACHED
==================================================

${this.state.currentScreenshots.length > 0 ?
    this.state.currentScreenshots.map((screenshot, index) =>
        `Screenshot ${index + 1}: ${screenshot.filename} (${screenshot.dimensions.width}x${screenshot.dimensions.height})`
    ).join('\n') : 'No screenshots attached'}

Data Collected: ${new Date().toLocaleString()}`;
    }

    async takeScreenshot() {
        try {
            const result = await window.electronAPI.takeScreenshot();
            if (result.success) {
                this.toast.showMessage('📷 Screenshot saved to disk', 'success');

                this.attachScreenshot({
                    bytesBase64: result.bytesBase64,
                    filename: result.filename,
                    mimeType: result.mimeType || 'image/png'
                });
            } else {
                this.toast.showMessage('❌ Screenshot failed: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            this.toast.showMessage('❌ Screenshot failed', 'error');
        }
    }

    attachScreenshot({ bytesBase64, filename, mimeType }) {
        if (!bytesBase64 || !filename) return;

        const maxCount = this.config.attachments.maxCount;
        if (window.zsAttachedAttachmentsCount >= maxCount) {
            this.toast.showMessage(`Max ${maxCount} attachments — remove one to add screenshot`, 'warning');
            return;
        }

        try {
            const binaryStr = atob(bytesBase64);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }
            const file = new File([bytes], filename, { type: mimeType });

            const nextId = window.zsAttachmentFileBrowserIdsList[0];
            const inputEl = document.getElementById('zsattachment_' + nextId);

            if (!inputEl) {
                this.toast.showMessage(`Max ${maxCount} attachments — remove one to add screenshot`, 'warning');
                return;
            }

            const dt = new DataTransfer();
            dt.items.add(file);
            inputEl.files = dt.files;

            inputEl.dispatchEvent(new Event('change', { bubbles: true }));

            this.toast.showMessage('📎 Screenshot attached to ticket', 'success');
        } catch (err) {
            this.toast.showMessage('❌ Could not attach screenshot', 'error');
        }
    }

    async clearScreenshots() {
        try {
            const result = await window.electronAPI.clearScreenshots();
            if (result.success) {
                this.state.currentScreenshots = [];
                this.updateScreenshotsDisplay();
                this.toast.showMessage('🗑️ Screenshots cleared', 'info');
            }
        } catch (error) {
            this.toast.showMessage('❌ Clear failed', 'error');
        }
    }

    updateScreenshotsDisplay() {
        const container = document.getElementById('screenshotStatus');
        const clearBtn = document.getElementById('clearScreenshotsBtn');

        if (!container || !clearBtn) return;

        clearBtn.style.display = this.state.currentScreenshots.length > 0 ? 'inline-block' : 'none';

        if (this.state.currentScreenshots.length === 0) {
            container.innerHTML = '<div class="no-screenshots"><div class="screenshot-icon">📷</div><div class="screenshot-text">No screenshots</div></div>';
        } else {
            const screenshotItems = this.state.currentScreenshots.map((screenshot, i) =>
                '<div class="screenshot-item">' +
                '<div class="screenshot-preview">' +
                '<img src="' + (screenshot.preview?.dataUrl || 'data:image/png;base64,' + screenshot.preview?.base64) + '" alt="Screenshot ' + (i+1) + '" />' +
                '</div>' +
                '<div class="screenshot-info">' +
                '<div class="screenshot-name">Screenshot ' + (i+1) + '</div>' +
                '<div class="screenshot-details">' + (screenshot.dimensions?.width || 'Unknown') + 'x' + (screenshot.dimensions?.height || 'Unknown') + '</div>' +
                '</div>' +
                '</div>'
            ).join('');

            container.innerHTML = '<div class="screenshots-list">' + screenshotItems + '</div>';
        }
    }
}
