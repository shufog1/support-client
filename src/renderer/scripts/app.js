// Main Application Logic
class ITSupportApp {
    constructor() {
        this.systemInfo = null;
        this.userSettings = {};
        this.currentScreenshots = [];
        this.isInitialized = false;
        
        // Initialize app when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    async initialize() {
        console.log('SolveIT Support Client V31 starting - Compact & Modular');
        
        try {
            // Check if first-run setup is needed
            const needsSetup = await this.checkFirstRunSetup();
            
            if (needsSetup) {
                await this.loadSetupWizard();
                return; // Setup wizard will call initializeApp when complete
            }
            
            await this.initializeApp();
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showMessage('Failed to initialize application', 'error');
        }
    }

    async checkFirstRunSetup() {
        try {
            const setupCompleted = localStorage.getItem('setupCompleted') === 'true';
            const hasProfile = localStorage.getItem('userProfile') !== null;
            
            return !setupCompleted || !hasProfile;
        } catch (error) {
            console.error('Error checking setup status:', error);
            return true; // Default to showing setup on error
        }
    }

    async loadSetupWizard() {
        try {
            console.log('Loading setup wizard...');
            
            // Load setup wizard HTML
            const response = await fetch('components/setup-wizard.html');
            const setupHTML = await response.text();
            
            // Insert into setup container
            const setupContainer = document.getElementById('setupContainer');
            setupContainer.innerHTML = setupHTML;
            
            // Setup wizard will auto-initialize and show itself
            // It will call window.appSetupComplete when done
            
        } catch (error) {
            console.error('Error loading setup wizard:', error);
            // Fallback - initialize with demo profile
            this.createDemoProfile();
            await this.initializeApp();
        }
    }

    async initializeApp() {
        try {
            console.log('Initializing main application...');
            
            // Load user settings
            this.loadUserSettings();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load system information
            await this.loadSystemInformation();
            
            // Load existing screenshots
            await this.loadScreenshots();
            
            // Update UI
            this.populateUserInfo();
            this.hideLoadingOverlay();
            
            this.isInitialized = true;
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.showMessage('Application initialization failed', 'error');
        }
    }

    // Setup completion handler (called by setup wizard)
    setupComplete(profileData, skipped = false) {
        console.log('Setup completed:', skipped ? 'skipped' : 'completed', profileData);
        
        // Update user settings
        this.userSettings = profileData;
        
        // Initialize main app
        this.initializeApp();
    }

    loadUserSettings() {
        try {
            const saved = localStorage.getItem('userProfile');
            if (saved) {
                this.userSettings = JSON.parse(saved);
            } else {
                // Fallback to demo profile
                this.createDemoProfile();
            }
            console.log('User settings loaded:', this.userSettings);
        } catch (error) {
            console.error('Error loading user settings:', error);
            this.createDemoProfile();
        }
    }

    createDemoProfile() {
        this.userSettings = {
            firstName: 'Demo',
            lastName: 'User',
            email: 'demo@company.com',
            phone: '(555) 123-4567',
            extension: '',
            department: 'General',
            jobTitle: 'Employee'
        };
        
        try {
            localStorage.setItem('userProfile', JSON.stringify(this.userSettings));
            localStorage.setItem('setupCompleted', 'true');
        } catch (error) {
            console.error('Error saving demo profile:', error);
        }
    }

    populateUserInfo() {
        const fullName = `${this.userSettings.firstName} ${this.userSettings.lastName}`;
        
        // Update main UI
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        
        if (userName) userName.textContent = fullName || 'Not Set';
        if (userEmail) userEmail.textContent = this.userSettings.email || 'Not Set';
        
        // Update settings form if it exists
        this.populateSettingsForm();
    }

    populateSettingsForm() {
        const fields = {
            'settingsFirstName': this.userSettings.firstName,
            'settingsLastName': this.userSettings.lastName,
            'settingsEmail': this.userSettings.email,
            'settingsDepartment': this.userSettings.department,
            'settingsPhone': this.userSettings.phone
        };
        
        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
            }
        });
    }

    async loadSystemInformation() {
        console.log('Loading system information...');
        
        try {
            this.updateSystemStatus('Loading...', 'loading');
            
            const result = await window.electronAPI.getSystemInfo();
            
            if (result.success && result.data) {
                this.systemInfo = this.transformSystemInfo(result.data);
                this.updateSystemInfoDisplay();
                this.updateSystemStatus('Ready', 'healthy');
                console.log('System info loaded successfully');
            } else {
                console.error('Failed to load system info:', result.error);
                this.systemInfo = null;
                this.updateSystemInfoDisplay();
                this.updateSystemStatus('Unavailable', 'error');
                this.showMessage('⚠️ System information unavailable', 'warning');
            }
        } catch (error) {
            console.error('Error loading system information:', error);
            this.systemInfo = null;
            this.updateSystemInfoDisplay();
            this.updateSystemStatus('Error', 'error');
        }
    }

    transformSystemInfo(data) {
        // Transform collected data to UI format
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
            
            if (!this.systemInfo) {
                if (computerNameEl) computerNameEl.textContent = 'Unavailable';
                return;
            }

            if (computerNameEl) {
                computerNameEl.textContent = this.systemInfo.computerName || 'Unknown';
            }
            
        } catch (error) {
            console.error('Error updating system info display:', error);
        }
    }

    updateSystemStatus(statusText, statusType) {
        const statusTextEl = document.getElementById('systemStatusText');
        const statusDot = document.getElementById('systemStatusDot');
        
        if (statusTextEl) {
            statusTextEl.textContent = statusText;
        }
        
        if (statusDot) {
            // Remove existing status classes
            statusDot.classList.remove('loading', 'error', 'healthy');
            
            // Add appropriate class
            if (statusType) {
                statusDot.classList.add(statusType);
            }
        }
    }

    async loadScreenshots() {
        try {
            const result = await window.electronAPI.getScreenshots();
            if (result.success) {
                this.currentScreenshots = result.screenshots || [];
                window.updateScreenshotsDisplay(this.currentScreenshots);
            }
        } catch (error) {
            console.error('Error loading screenshots:', error);
            this.currentScreenshots = [];
        }
    }

    setupEventListeners() {
        // Close button
        const closeBtn = document.getElementById('closeBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (window.electronAPI && window.electronAPI.closeWindow) {
                    window.electronAPI.closeWindow();
                } else {
                    window.close();
                }
            });
        }

        // Form submission
        const ticketForm = document.getElementById('ticketForm');
        if (ticketForm) {
            ticketForm.addEventListener('submit', (e) => {
    e.preventDefault(); // ← Add this FIRST!
    this.handleTicketSubmission(e);
});
        }

        // Header buttons
        const systemInfoBtn = document.getElementById('systemInfoBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        
        if (systemInfoBtn) {
            systemInfoBtn.addEventListener('click', () => this.openModal('systemModal'));
        }
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openModal('settingsModal'));
        }

        // Modal controls
        this.setupModalControls();

        // Settings save
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.handleSaveSettings());
        }

        // System info refresh
        const refreshSystemInfoBtn = document.getElementById('refreshSystemInfoBtn');
        if (refreshSystemInfoBtn) {
            refreshSystemInfoBtn.addEventListener('click', () => this.handleRefreshSystemInfo());
        }

        // Chat button
        const startChatBtn = document.getElementById('startChatBtn');
        if (startChatBtn) {
            startChatBtn.addEventListener('click', () => this.handleStartChat());
        }

        // Tool buttons
        const toolButtons = document.querySelectorAll('.tool-btn[data-tool]');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.getAttribute('data-tool');
                this.handleToolExecution(tool);
            });
        });

        // Auto-resize textarea
        const textarea = document.getElementById('issueDescription');
        if (textarea) {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
            });
            // Focus on the textarea
            setTimeout(() => textarea.focus(), 500);
        }
    }

    setupModalControls() {
        // Close modal buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                if (modalId) {
                    this.closeModal(modalId);
                }
            });
        });
        
        // Close modal when clicking outside
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
        
        if (!this.systemInfo) {
            container.innerHTML = `
                <div class="system-unavailable">
                    <h4>❌ System Information Unavailable</h4>
                    <p>Could not collect system information. Try refreshing or contact support.</p>
                </div>
            `;
            return;
        }
        
        // Create detailed system info display
        container.innerHTML = `
            <div class="system-section">
                <h4>Computer Information</h4>
                <div class="system-item">
                    <span class="system-label">Memory:</span>
                    <span class="system-value">${this.systemInfo.memory.total} (${this.systemInfo.memory.usagePercent}% used)</span>
                </div>
                <div class="system-item">
                    <span class="system-label">Network:</span>
                    <span class="system-value">${this.systemInfo.network.primaryIP}</span>
                </div>
            </div>
            
            <div class="system-section">
                <h4>System Status</h4>
                <div class="system-item">
                    <span class="system-label">Uptime:</span>
                    <span class="system-value">${this.systemInfo.uptime}</span>
                </div>
                <div class="system-item">
                    <span class="system-label">User:</span>
                    <span class="system-value">${this.systemInfo.currentUser}@${this.systemInfo.userDomain}</span>
                </div>
                <div class="system-item">
                    <span class="system-label">Last Scan:</span>
                    <span class="system-value">${new Date(this.systemInfo.collectedAt).toLocaleString()}</span>
                </div>
            </div>
        `;
    }

    async handleTicketSubmission(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitTicketBtn');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            // Get form data
            const ticketData = {
                subject: document.getElementById('ticketSubject').value.trim(),
                description: document.getElementById('issueDescription').value.trim(),
                category: document.getElementById('issueCategory').value,
                priority: document.getElementById('issuePriority').value,
                userInfo: this.userSettings,
                systemInfo: this.systemInfo,
                screenshots: this.currentScreenshots,
                timestamp: new Date().toISOString()
            };
            
            // Validate required fields
            if (!ticketData.subject) {
                throw new Error('Please enter a subject for your ticket');
            }
            
            if (!ticketData.description) {
                throw new Error('Please describe your issue');
            }
            
            console.log('Submitting ticket:', ticketData);
            
            // Generate system info text for ticket
            const systemInfoText = this.generateSystemInfoText();
            
            // Create Zoho submission data
            const zohoData = {
                'First Name': this.userSettings.firstName || 'Demo',
                'Contact Name': this.userSettings.lastName || 'User',
                'Email': this.userSettings.email || 'demo@company.com',
                'Phone': this.userSettings.phone + (this.userSettings.extension ? ' ext. ' + this.userSettings.extension : ''),
                'Subject': ticketData.subject,
                'Description': ticketData.description + systemInfoText
            };
            
            // Get screenshot files for attachment if any
            let screenshotFiles = [];
            if (this.currentScreenshots.length > 0) {
                const filesResult = await window.electronAPI.getScreenshotFiles();
                if (filesResult.success) {
                    screenshotFiles = filesResult.filePaths;
                }
            }
            
            console.log('Screenshot files for attachment:', screenshotFiles);
            
            // Simulate successful submission (replace with real Zoho integration)
            const ticketId = 'ST-' + Math.floor(Math.random() * 90000) + 10000;
            
            this.showMessage(
                `✅ Ticket #${ticketId} created successfully! ${this.currentScreenshots.length > 0 ? `(${this.currentScreenshots.length} screenshots attached)` : ''}`, 
                'success'
            );
            
            // Reset form
            document.getElementById('ticketForm').reset();
            
            // Clear screenshots after successful submission
            if (this.currentScreenshots.length > 0) {
                await this.clearAllScreenshots();
            }
            
        } catch (error) {
            console.error('Error submitting ticket:', error);
            this.showMessage(error.message || 'Failed to submit ticket', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    generateSystemInfoText() {
        if (!this.systemInfo) {
            return `

==================================================
            SYSTEM INFORMATION
==================================================

STATUS: System information not available
NOTE: Could not collect system details for this ticket.

==================================================
              USER INFORMATION
==================================================

Name: ${this.userSettings.firstName} ${this.userSettings.lastName}
Email: ${this.userSettings.email}
Phone: ${this.userSettings.phone}${this.userSettings.extension ? ' ext. ' + this.userSettings.extension : ''}
Department: ${this.userSettings.department}
Job Title: ${this.userSettings.jobTitle}`;
        }

        return `

==================================================
            SYSTEM INFORMATION REPORT
==================================================

Computer Name: ${this.systemInfo.computerName}
Manufacturer: ${this.systemInfo.manufacturer}
Model: ${this.systemInfo.model}
Operating System: ${this.systemInfo.osVersion}
Processor: ${this.systemInfo.cpu.model}
Memory: ${this.systemInfo.memory.total} (${this.systemInfo.memory.usagePercent}% used)
Network IP: ${this.systemInfo.network.primaryIP}
System Uptime: ${this.systemInfo.uptime}
Current User: ${this.systemInfo.currentUser}@${this.systemInfo.userDomain}

==================================================
              USER INFORMATION
==================================================

Name: ${this.userSettings.firstName} ${this.userSettings.lastName}
Email: ${this.userSettings.email}
Phone: ${this.userSettings.phone}${this.userSettings.extension ? ' ext. ' + this.userSettings.extension : ''}
Department: ${this.userSettings.department}
Job Title: ${this.userSettings.jobTitle}

==================================================
            SCREENSHOTS ATTACHED
==================================================

${this.currentScreenshots.length > 0 ? 
    this.currentScreenshots.map((screenshot, index) => 
        `Screenshot ${index + 1}: ${screenshot.filename} (${screenshot.dimensions.width}x${screenshot.dimensions.height})`
    ).join('\n') : 'No screenshots attached'}

Data Collected: ${new Date().toLocaleString()}`;
    }

    async clearAllScreenshots() {
        try {
            const result = await window.electronAPI.clearScreenshots();
            if (result.success) {
                this.currentScreenshots = [];
                if (window.updateScreenshotsDisplay) {
                    window.updateScreenshotsDisplay(this.currentScreenshots);
                }
            }
        } catch (error) {
            console.error('Error clearing screenshots:', error);
        }
    }

    handleSaveSettings() {
        try {
            // Get values from settings form
            const updatedSettings = {
                firstName: document.getElementById('settingsFirstName').value.trim(),
                lastName: document.getElementById('settingsLastName').value.trim(),
                email: document.getElementById('settingsEmail').value.trim(),
                department: document.getElementById('settingsDepartment').value.trim(),
                phone: document.getElementById('settingsPhone').value.trim(),
                extension: this.userSettings.extension || '',
                jobTitle: this.userSettings.jobTitle || ''
            };
            
            // Save updated profile
            localStorage.setItem('userProfile', JSON.stringify(updatedSettings));
            
            // Update current settings
            this.userSettings = updatedSettings;
            
            // Update UI
            this.populateUserInfo();
            this.closeModal('settingsModal');
            
            this.showMessage('⚙️ Settings saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showMessage('Failed to save settings', 'error');
        }
    }

    async handleRefreshSystemInfo() {
        try {
            console.log('Manual system info refresh requested...');
            this.showMessage('🔄 Refreshing system information...', 'info');
            this.updateSystemStatus('Refreshing...', 'loading');
            
            const result = await window.electronAPI.refreshSystemInfo();
            
            if (result.success && result.data) {
                this.systemInfo = this.transformSystemInfo(result.data);
                this.updateSystemInfoDisplay();
                this.updateSystemStatus('Ready', 'healthy');
                this.showMessage('✅ System information refreshed!', 'success');
                
                // Update modal if open
                const systemModal = document.getElementById('systemModal');
                if (systemModal && systemModal.style.display === 'block') {
                    this.populateDetailedSystemInfo();
                }
            } else {
                console.error('Failed to refresh system info:', result.error);
                this.updateSystemStatus('Error', 'error');
                this.showMessage(`❌ ${result.error || 'Failed to refresh system information'}`, 'error');
            }
        } catch (error) {
            console.error('Error refreshing system info:', error);
            this.updateSystemStatus('Error', 'error');
            this.showMessage('❌ Error refreshing system information', 'error');
        }
    }

    handleStartChat() {
        try {
            console.log('Starting live chat...');
            this.showMessage('💬 Starting live chat...', 'info');
            
            // Try to trigger SalesIQ chat
            if (window.$zoho && window.$zoho.salesiq) {
                window.$zoho.salesiq.chat.start();
                this.showMessage('💬 Live chat opened!', 'success');
            } else {
                this.showMessage('💬 Chat temporarily unavailable', 'warning');
            }
        } catch (error) {
            console.error('Error starting chat:', error);
            this.showMessage('Failed to start live chat', 'error');
        }
    }

    async handleToolExecution(toolName) {
        try {
            console.log('Running tool:', toolName);
            this.showMessage(`🔧 Running ${toolName}...`, 'info');
            
            let result;
            
            // Map tool names to systemUtils functions
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
                default:
                    result = { success: false, message: `Unknown tool: ${toolName}` };
            }
            
            // Handle the result
            if (result && result.success) {
                this.showMessage(`✅ ${result.message}`, 'success');
            } else {
                this.showMessage(`❌ ${result?.message || `Failed to run ${toolName}`}`, 'error');
            }
            
        } catch (error) {
            console.error('Error running tool:', error);
            this.showMessage(`❌ Error running ${toolName}: ${error.message}`, 'error');
        }
    }

    showMessage(text, type = 'info') {
        // Remove existing messages
        document.querySelectorAll('.message').forEach(msg => msg.remove());
        
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        const form = document.querySelector('.main-form');
        if (form) {
            form.insertBefore(message, form.firstChild);
            
            // Auto-remove after 4 seconds
            setTimeout(() => {
                if (message.parentNode) {
                    message.remove();
                }
            }, 4000);
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
}

// Global setup completion handler
window.appSetupComplete = (profileData, skipped = false) => {
    if (window.app) {
        window.app.setupComplete(profileData, skipped);
    }
};

// Initialize app
window.app = new ITSupportApp();