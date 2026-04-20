import { loadConfig } from './config-loader.js';
import { Toast } from './modules/toast.js';
import { ProfileStore } from './modules/profile-store.js';
import { SystemInfoController } from './modules/system-info-controller.js';
import { Modals } from './modules/modals.js';
import { TicketForm } from './modules/ticket-form.js';
import { Tools } from './modules/tools.js';
import { SetupWizard } from './modules/setup-wizard.js';
import { Dialog } from './modules/dialog.js';

document.addEventListener('DOMContentLoaded', () => {
    // Load config once — all modules that need config receive it as a constructor arg
    const config = loadConfig();

    // Expose Zoho form ID globally so zoho-form-helpers.js (non-module) can access it
    window.__zohoFormId = config.zoho.formId;

    // Shared state object — all modules read/write this
    const state = {
        systemInfo: null,
        userSettings: {},
        currentScreenshots: [],
        isInitialized: false
    };

    // Construct modules in dependency order
    const toast = new Toast(config);
    const dialog = new Dialog();
    const profileStore = new ProfileStore(state, toast, config);
    const systemInfoController = new SystemInfoController(state, toast);
    const modals = new Modals(state, toast);
    const ticketForm = new TicketForm(state, toast, config);
    const tools = new Tools(toast);

    // Cross-references: modules that need siblings wired after construction
    state.modals = modals;
    state.dialog = dialog;

    const setupWizard = new SetupWizard(
        state,
        profileStore,
        toast,
        () => initializeMainApp(),
        config
    );

    function checkSetupRequired() {
        try {
            const setupCompleted = localStorage.getItem('setupCompleted') === 'true';
            const hasProfile = localStorage.getItem('userProfile') !== null;
            return !setupCompleted || !hasProfile;
        } catch (error) {
            return true;
        }
    }

    async function initializeMainApp() {
        try {
            document.getElementById('loadingOverlay').classList.add('hidden');
            document.getElementById('mainApp').style.display = 'flex';

            // Set logo src from branding config
            const logoImg = document.getElementById('brandLogoImg');
            if (logoImg) logoImg.src = config.branding.logoPath;

            profileStore.loadUserSettings();
            ticketForm.initZohoFormTokens();
            setupEventListeners();
            await systemInfoController.loadSystemInformation();
            await systemInfoController.loadScreenshots();
            modals.populateUserInfo();
            ticketForm.autoFillZohoForm();
            ticketForm.setupDragAndDrop();

            state.isInitialized = true;
        } catch (error) {
            toast.showMessage('Failed to initialize application', 'error');
        }
    }

    function setupEventListeners() {
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

        const ticketFormEl = document.getElementById('zsWebToCase_' + config.zoho.formId);
        if (ticketFormEl) {
            ticketFormEl.addEventListener('submit', (e) => ticketForm.handleTicketSubmission(e));
        }

        const systemInfoBtn = document.getElementById('systemInfoBtn');
        const quickToolsBtn = document.getElementById('quickToolsBtn');
        const settingsBtn = document.getElementById('settingsBtn');

        if (systemInfoBtn) {
            systemInfoBtn.addEventListener('click', () => modals.openModal('systemModal'));
        }

        if (quickToolsBtn) {
            quickToolsBtn.addEventListener('click', () => modals.openModal('quickToolsModal'));
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => modals.openModal('settingsModal'));
        }

        modals.setupModalControls();

        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => handleSaveSettings());
        }

        const refreshSystemInfoBtn = document.getElementById('refreshSystemInfoBtn');
        if (refreshSystemInfoBtn) {
            refreshSystemInfoBtn.addEventListener('click', () => systemInfoController.handleRefreshSystemInfo());
        }

        const takeScreenshotBtn = document.getElementById('takeScreenshotBtn');
        if (takeScreenshotBtn) {
            takeScreenshotBtn.addEventListener('click', () => ticketForm.takeScreenshot());
        }

        const toolButtons = document.querySelectorAll('.tool-btn-modal[data-tool]');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.getAttribute('data-tool');
                tools.handleToolExecution(tool);
                modals.closeModal('quickToolsModal');
            });
        });

        const textarea = document.getElementById('ticketDescription');
        if (textarea) {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
            });

            setTimeout(() => textarea.focus(), 500);
        }
    }

    function handleSaveSettings() {
        try {
            const updatedSettings = {
                firstName: document.getElementById('settingsFirstName').value.trim(),
                lastName: document.getElementById('settingsLastName').value.trim(),
                email: document.getElementById('settingsEmail').value.trim(),
                department: document.getElementById('settingsDepartment').value.trim(),
                phone: document.getElementById('settingsPhone').value.trim(),
                extension: state.userSettings.extension || '',
                jobTitle: state.userSettings.jobTitle || ''
            };

            localStorage.setItem('userProfile', JSON.stringify(updatedSettings));
            state.userSettings = updatedSettings;

            modals.populateUserInfo();
            ticketForm.autoFillZohoForm();
            modals.closeModal('settingsModal');

            toast.showMessage('⚙️ Settings saved successfully!', 'success');
        } catch (error) {
            toast.showMessage('Failed to save settings', 'error');
        }
    }

    function handleInitializationError() {
        document.getElementById('loadingOverlay').classList.add('hidden');
        document.getElementById('mainApp').style.display = 'flex';

        profileStore.createDemoProfile();
        modals.populateUserInfo();
        setupEventListeners();

        toast.showMessage('⚠️ App started with limited functionality', 'warning');
    }

    // Zoho form readystatechange boot (runs after jqueryandencoder.js is loaded)
    document.addEventListener('readystatechange', function() {
        if (document.readyState === 'complete') {
            window.setAllDependancyFieldsMapping();
            document.getElementById('zsSubmitButton_' + config.zoho.formId).removeAttribute('disabled');
            window.zsAttachedAttachmentsCount = 0;
            window.zsAllowedAttachmentLimit = config.attachments.maxCount;
            window.zsAttachmentFileBrowserIdsList = [1, 2, 3, 4, 5];
            jQuery('#zsFileBrowseAttachments').html('');
            window.zsRearrangeFileBrowseAttachments();
            window.zsChangeMousePointer();
        }
    });

    // Boot: decide setup wizard or main app
    try {
        const needsSetup = checkSetupRequired();
        if (needsSetup) {
            setupWizard.showSetupWizard();
        } else {
            initializeMainApp();
        }
    } catch (error) {
        handleInitializationError();
    }

    // Global error handlers
    window.addEventListener('error', (_e) => {
        // intentionally left empty — errors surface through normal UI feedback
    });

    window.addEventListener('unhandledrejection', (_e) => {
        // intentionally left empty — errors surface through normal UI feedback
    });

    // Expose app for any legacy references
    window.solveITApp = { state, toast, dialog, profileStore, systemInfoController, modals, ticketForm, tools, setupWizard };
});
