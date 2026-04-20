// Global variables
let systemInfo = {};
let userSettings = {};
let currentScreenshot = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('IT Support Client renderer started');
    
    // Initialize immediately
    initializeApp();
    setupEventListeners();
    loadSystemInformation();
    hideLoadingOverlay();
    
    // Auto-fill Zoho form after a short delay to ensure form is ready
    setTimeout(() => {
        autoFillZohoForm();
        appendSystemInfoToDescription();
    }, 500);
});

// Initialize the application
function initializeApp() {
    console.log('Initializing app...');
    loadUserSettings();
    populateUserInfo();
    console.log('App initialized successfully');
}

// Load system information (demo mode)
function loadSystemInformation() {
    console.log('Loading system information...');
    
    // Use demo data immediately
    systemInfo = {
        computerName: 'DEMO-PC-01',
        osVersion: 'Windows 11 Pro (Demo)',
        osArchitecture: 'x64',
        cpu: {
            model: 'Intel Core i7-12700K @ 3.60GHz',
            cores: 12,
            usage: '15%'
        },
        memory: { 
            total: '16 GB', 
            free: '12.3 GB',
            used: '3.7 GB',
            usagePercent: 23
        },
        storage: [{ 
            drive: 'C:',
            total: '500 GB', 
            free: '342 GB',
            used: '158 GB',
            usagePercent: 32
        }],
        network: { 
            hostname: 'DEMO-PC-01',
            primaryIP: '192.168.1.105',
            interfaces: [{
                name: 'Ethernet',
                address: '192.168.1.105',
                netmask: '255.255.255.0',
                mac: '00:1B:44:11:3A:B7'
            }]
        },
        currentUser: 'demo.user',
        userDomain: 'DEMO.LOCAL',
        uptime: '5 days, 3 hours, 22 minutes',
        lastBoot: '2025-05-21 09:15:00',
        nodeVersion: 'v18.17.0',
        windowsUpdates: '3 days ago',
        installedSoftware: ['Microsoft Office', 'Google Chrome', 'Adobe Reader'],
        collectedAt: new Date().toISOString()
    };
    
    updateSystemInfoDisplay();
    updateSystemStatus('Demo Mode - Ready', 'demo');
    updateRecentActivity('System scan completed');
    
    console.log('System info loaded');
}

// Update system information display
function updateSystemInfoDisplay() {
    document.getElementById('computerName').textContent = systemInfo.computerName;
    document.getElementById('osVersion').textContent = systemInfo.osVersion;
    document.getElementById('ramInfo').textContent = `${systemInfo.memory.total} (${systemInfo.memory.free} free)`;
    document.getElementById('storageInfo').textContent = `${systemInfo.storage[0].total} (${systemInfo.storage[0].free} free)`;
    document.getElementById('ipAddress').textContent = systemInfo.network.primaryIP;
    document.getElementById('systemUptime').textContent = systemInfo.uptime;
}

// Update system status
function updateSystemStatus(statusText, statusType) {
    const statusElement = document.getElementById('systemStatusText');
    const indicator = document.getElementById('systemStatusIndicator');
    
    if (statusElement) statusElement.textContent = statusText;
    
    if (indicator) {
        const colors = {
            'demo': '#9b59b6',
            'healthy': '#27ae60',
            'warning': '#f39c12',
            'error': '#e74c3c'
        };
        indicator.style.background = colors[statusType] || '#3498db';
    }
}

// Load user settings
function loadUserSettings() {
    try {
        const saved = localStorage.getItem('userSettings');
        userSettings = saved ? JSON.parse(saved) : {
            firstName: 'John',
            lastName: 'Smith',
            name: 'John Smith',
            email: 'john.smith@company.com',
            department: 'IT Department',
            phone: '(555) 123-4567'
        };
    } catch (error) {
        console.error('Error loading settings:', error);
        userSettings = {
            firstName: 'Demo',
            lastName: 'User',
            name: 'Demo User',
            email: 'demo@company.com',
            phone: '(555) 123-4567'
        };
    }
}

// Save user settings
function saveUserSettings() {
    try {
        localStorage.setItem('userSettings', JSON.stringify(userSettings));
        console.log('Settings saved');
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

// Populate user info
function populateUserInfo() {
    document.getElementById('userName').textContent = userSettings.name;
    document.getElementById('userEmail').textContent = userSettings.email;
    
    // Update display in form area
    if (document.getElementById('displayUserName')) {
        document.getElementById('displayUserName').textContent = userSettings.name;
    }
    if (document.getElementById('displayUserEmail')) {
        document.getElementById('displayUserEmail').textContent = userSettings.email;
    }
    if (document.getElementById('displayComputerName')) {
        document.getElementById('displayComputerName').textContent = systemInfo.computerName || 'Loading...';
    }
}

// Auto-fill Zoho form with user data
function autoFillZohoForm() {
    try {
        // Fill hidden fields for Zoho submission
        const firstNameField = document.getElementById('autoFirstName');
        const contactNameField = document.getElementById('autoContactName');
        const emailField = document.getElementById('autoEmail');
        const phoneField = document.getElementById('autoPhone');

        if (firstNameField) firstNameField.value = userSettings.firstName || 'John';
        if (contactNameField) contactNameField.value = userSettings.lastName || 'Smith';
        if (emailField) emailField.value = userSettings.email || 'john.smith@company.com';
        if (phoneField) phoneField.value = userSettings.phone || '(555) 123-4567';

        console.log('Zoho form auto-filled with user data');
    } catch (error) {
        console.error('Error auto-filling Zoho form:', error);
    }
}

// Append system information to description
function appendSystemInfoToDescription() {
    const descriptionField = document.getElementById('ticketDescription');
    if (descriptionField && systemInfo) {
        // Store original placeholder
        const originalPlaceholder = descriptionField.placeholder;
        
        // Update placeholder to show system info will be included
        descriptionField.placeholder = originalPlaceholder + '\n\n(System information will be automatically included)';
        
        // Add event listener to append system info when form is submitted
        const form = document.getElementById('zsWebToCase_5211000000795236');
        if (form) {
            // Remove any existing listeners to avoid duplicates
            form.removeEventListener('submit', appendSystemInfoHandler);
            form.addEventListener('submit', appendSystemInfoHandler);
        }
    }
}

// System info handler function
function appendSystemInfoHandler(e) {
    const descriptionField = document.getElementById('ticketDescription');
    const systemInfoText = `

--- SYSTEM INFORMATION (Auto-attached) ---
Computer: ${systemInfo.computerName}
OS: ${systemInfo.osVersion}
CPU: ${systemInfo.cpu.model}
RAM: ${systemInfo.memory.total} (${systemInfo.memory.free} free)
Storage: ${systemInfo.storage[0].total} (${systemInfo.storage[0].free} free)
IP: ${systemInfo.network.primaryIP}
Uptime: ${systemInfo.uptime}
User: ${systemInfo.currentUser}@${systemInfo.userDomain}
Last Boot: ${systemInfo.lastBoot}
Collected: ${new Date().toLocaleString()}`;

    // Append system info to description before submission
    if (descriptionField && descriptionField.value.trim() && !descriptionField.value.includes('--- SYSTEM INFORMATION')) {
        descriptionField.value += systemInfoText;
    }
}

// Set up event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Screenshot button
    const screenshotBtn = document.getElementById('screenshotBtn');
    if (screenshotBtn) {
        screenshotBtn.addEventListener('click', handleScreenshot);
    }
    
    // Chat buttons
    document.querySelectorAll('#startChatBtn, #liveChatBtn').forEach(btn => {
        btn.addEventListener('click', handleStartChat);
    });
    
    // Modal buttons
    const systemBtn = document.getElementById('systemInfoBtn');
    const toolsBtn = document.getElementById('toolsBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    if (systemBtn) systemBtn.addEventListener('click', () => openModal('systemModal'));
    if (toolsBtn) toolsBtn.addEventListener('click', () => openModal('toolsModal'));
    if (settingsBtn) settingsBtn.addEventListener('click', () => openModal('settingsModal'));
    
    // Close modal buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modalId = e.target.getAttribute('data-modal');
            if (modalId) closeModal(modalId);
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Settings save button
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveSettings);
    }
    
    // Tool buttons
    document.querySelectorAll('.tool-btn, [data-tool]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tool = e.target.getAttribute('data-tool') || e.target.textContent.toLowerCase();
            handleToolExecution(tool);
        });
    });
    
    // Auto-resize textarea
    const textarea = document.getElementById('ticketDescription');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
        
        // Focus on load
        setTimeout(() => textarea.focus(), 1000);
    }
    
    console.log('Event listeners set up');
}

// Handle screenshot
function handleScreenshot() {
    console.log('Taking screenshot...');
    
    // In demo mode, simulate screenshot
    currentScreenshot = 'demo_screenshot_' + Date.now();
    updateScreenshotButton(true);
    showMessage('📷 Screenshot captured (demo mode)', 'success');
    
    // In production, this would actually take a screenshot
    // and attach it to the first available file input
    updateRecentActivity('Screenshot captured');
}

// Update screenshot button
function updateScreenshotButton(hasScreenshot = false) {
    const btn = document.getElementById('screenshotBtn');
    if (btn) {
        if (hasScreenshot) {
            btn.innerHTML = `
                <div style="font-size: 20px; margin-bottom: 5px;">✅</div>
                <div style="font-size: 12px; color: #27ae60;">Screenshot captured</div>
            `;
            btn.classList.add('has-screenshot');
        } else {
            btn.innerHTML = `
                <div style="font-size: 20px; margin-bottom: 5px;">📷</div>
                <div style="font-size: 12px; color: #7f8c8d;">Click to add screenshot</div>
            `;
            btn.classList.remove('has-screenshot');
        }
    }
}

// Handle chat
function handleStartChat() {
    showMessage('💬 Live chat opening... (demo mode)', 'warning');
    updateRecentActivity('Live chat requested');
    
    // In production, this would trigger SalesIQ chat
    setTimeout(() => {
        showMessage('💬 SalesIQ chat widget should appear', 'info');
    }, 1500);
}

// Handle tool execution
function handleToolExecution(toolName) {
    showMessage(`🔧 ${toolName} tool executed (demo mode)`, 'warning');
    updateRecentActivity(`${toolName} tool executed`);
    
    // In production, these would execute actual system commands
    setTimeout(() => {
        showMessage(`✅ ${toolName} completed successfully (demo)`, 'success');
    }, 2000);
}

// Handle save settings
function handleSaveSettings() {
    try {
        // Get values from settings form
        const firstName = document.getElementById('settingsFirstName').value.trim();
        const lastName = document.getElementById('settingsLastName').value.trim();
        const email = document.getElementById('settingsEmail').value.trim();
        const department = document.getElementById('settingsDepartment').value.trim();
        const phone = document.getElementById('settingsPhone').value.trim();
        
        // Update userSettings object
        if (firstName) userSettings.firstName = firstName;
        if (lastName) userSettings.lastName = lastName;
        if (firstName && lastName) userSettings.name = `${firstName} ${lastName}`;
        if (email) userSettings.email = email;
        if (department) userSettings.department = department;
        if (phone) userSettings.phone = phone;
        
        // Save to localStorage
        saveUserSettings();
        
        // Update UI displays
        populateUserInfo();
        autoFillZohoForm();
        
        // Close modal
        closeModal('settingsModal');
        
        showMessage('⚙️ Settings saved successfully!', 'success');
        updateRecentActivity('Settings updated');
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showMessage('Failed to save settings', 'error');
    }
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        
        // Special handling for different modals
        if (modalId === 'systemModal') {
            populateDetailedSystemInfo();
        } else if (modalId === 'settingsModal') {
            populateSettingsForm();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Populate settings form with current values
function populateSettingsForm() {
    const fields = {
        'settingsFirstName': userSettings.firstName,
        'settingsLastName': userSettings.lastName,
        'settingsEmail': userSettings.email,
        'settingsDepartment': userSettings.department,
        'settingsPhone': userSettings.phone
    };
    
    for (const [fieldId, value] of Object.entries(fields)) {
        const field = document.getElementById(fieldId);
        if (field && value) {
            field.value = value;
        }
    }
}

// Populate detailed system info modal
function populateDetailedSystemInfo() {
    const container = document.getElementById('detailedSystemInfo');
    if (!container) return;
    
    container.innerHTML = `
        <div class="detail-card">
            <h5>Computer Overview</h5>
            <div class="detail-item">
                <span class="detail-label">Computer Name:</span>
                <span class="detail-value">${systemInfo.computerName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Domain:</span>
                <span class="detail-value">${systemInfo.userDomain}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Current User:</span>
                <span class="detail-value">${systemInfo.currentUser}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">System Uptime:</span>
                <span class="detail-value">${systemInfo.uptime}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Last Boot:</span>
                <span class="detail-value">${systemInfo.lastBoot}</span>
            </div>
        </div>

        <div class="detail-card">
            <h5>Hardware Information</h5>
            <div class="detail-item">
                <span class="detail-label">Processor:</span>
                <span class="detail-value">${systemInfo.cpu.model}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">CPU Cores:</span>
                <span class="detail-value">${systemInfo.cpu.cores}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Memory Total:</span>
                <span class="detail-value">${systemInfo.memory.total}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Memory Available:</span>
                <span class="detail-value">${systemInfo.memory.free}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Memory Usage:</span>
                <span class="detail-value">${systemInfo.memory.usagePercent}%</span>
            </div>
        </div>

        <div class="detail-card">
            <h5>Network Information</h5>
            <div class="detail-item">
                <span class="detail-label">Hostname:</span>
                <span class="detail-value">${systemInfo.network.hostname}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Primary IP:</span>
                <span class="detail-value">${systemInfo.network.primaryIP}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">MAC Address:</span>
                <span class="detail-value">${systemInfo.network.interfaces[0].mac}</span>
            </div>
        </div>

        <div class="detail-card">
            <h5>Software Information</h5>
            <div class="detail-item">
                <span class="detail-label">Operating System:</span>
                <span class="detail-value">${systemInfo.osVersion}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Architecture:</span>
                <span class="detail-value">${systemInfo.osArchitecture}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Last Windows Update:</span>
                <span class="detail-value">${systemInfo.windowsUpdates}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Node.js Version:</span>
                <span class="detail-value">${systemInfo.nodeVersion}</span>
            </div>
        </div>
    `;
}

// Update recent activity
function updateRecentActivity(activity) {
    const container = document.querySelector('.recent-activity');
    if (container) {
        const newItem = document.createElement('div');
        newItem.className = 'activity-item';
        newItem.textContent = `• ${activity}`;
        
        const header = container.querySelector('strong');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(newItem, header.nextSibling);
        } else if (header) {
            container.appendChild(newItem);
        }
        
        // Keep only 3 items
        const items = container.querySelectorAll('.activity-item');
        if (items.length > 3) {
            items[items.length - 1].remove();
        }
    }
}

// Show message
function showMessage(text, type = 'info') {
    // Remove existing messages
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    const form = document.querySelector('.main-form');
    if (form) {
        form.insertBefore(message, form.firstChild);
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    }
}

// Hide loading overlay
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }
}

// Export for debugging
window.appDebug = {
    systemInfo,
    userSettings,
    loadSystemInformation,
    showMessage,
    autoFillZohoForm
};

console.log('Renderer script loaded - Zoho integration ready');