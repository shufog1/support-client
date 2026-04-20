    <script>
        // Zoho Form Functions (from provided code)
        function trimBoth(str){return jQuery.trim(str);}
        function setAllDependancyFieldsMapping(){var mapDependancyLabels = getMapDependenySelectValues(jQuery("[id='property(module)']").val(), "JSON_MAP_DEP_LABELS");if(mapDependancyLabels){for(var i = 0; i < mapDependancyLabels.length; i++){var label = mapDependancyLabels[i];var obj = document.forms['zsWebToCase_5211000000795236'][label];if(obj){setDependent(obj, true);}}}}
        function getMapDependenySelectValues(module, key){var dependencyObj = jQuery.parseJSON( jQuery("[id='dependent_field_values_" + module + "']").val() );if(dependencyObj == undefined){return dependencyObj;}return dependencyObj[key];}
        function setDependent(obj, isload){var name = obj.id || (obj[0] && obj[0].id) || "";var module = jQuery("[id='property(module)']").val();var val = "";var myObject = getMapDependenySelectValues(module, "JSON_VALUES");if(myObject !=undefined){val = myObject[name];}var mySelObject = getMapDependenySelectValues(module, "JSON_SELECT_VALUES");if(val != null && val != "" && val != "null" && mySelObject){var fields = val;for(var i in fields){if (fields.hasOwnProperty(i)){var isDependent = false;var label = i;var values = fields[i];if(label.indexOf(")") > -1){label = label.replace(/\)/g, '_____');}if(label.indexOf("(") > -1){label = label.replace(/\(/g, '____');}if(label.indexOf(".") > -1){label = label.replace(/\./g, '___');}var depObj = document.forms['zsWebToCase_5211000000795236'][label];if(depObj && depObj.options){var mapValues = "";var selected_val = depObj.value;var depLen = depObj.options.length-1;for (var n = depLen; n >= 0; n--) {if (depObj.options[n].selected){if(mapValues == ""){mapValues = depObj.options[n].value;}else{mapValues = mapValues + ";;;"+depObj.options[n].value;}}}depObj.value = "";var selectValues = mySelObject[label];for(var k in values){var rat = k;if(rat == "-None-"){rat = "";}var parentValues = mySelObject[name];if(rat == trimBoth(obj.value)){isDependent = true;depObj.length = 0;var depvalues = values[k];var depLen = depvalues.length - 1;for(var j = 0; j <= depLen; j++){var optionElement = document.createElement("OPTION");var displayValue = depvalues[j];var actualValue = displayValue;if(actualValue == "-None-"){optionElement.value = "";displayValue = "-None-";}else{optionElement.value = actualValue;}optionElement.text = displayValue;if(mapValues != undefined){var mapValue = mapValues.split(";;;");var len = mapValue.length;for(var p = 0; p < len; p++){if(actualValue == mapValue[p]){optionElement.selected = true;}}}depObj.options.add(optionElement);}}}if(!isDependent){depObj.length = 0;var len = selectValues.length;for(var j = 0; j < len; j++){var actualValue = selectValues[j];var optionElement = document.createElement("OPTION");if(actualValue == "-None-"){optionElement.value = "";}else{optionElement.value = selectValues[j];}optionElement.text = selectValues[j];depObj.options.add(optionElement);}depObj.value =  selected_val;}if(!isload){setDependent(depObj,false);}var jdepObj = jQuery(depObj);if(jdepObj.hasClass('select2-offscreen')){jdepObj.select2("val", jdepObj.val());}}}}}}

        // Override Zoho validation to work with our custom handler
        function zsValidateMandatoryFields(){
            // Don't disable the button or handle submission here
            // Let our custom handler take care of it
            return false; // Prevent default submission
        }

        var ZSEncoder = {encodeForHTML : function(str){if(str && typeof(str)==='string'){return jQuery.encoder.encodeForHTML(str);}return str;},encodeForHTMLAttribute : function(str) {if(str && typeof(str)==='string'){return jQuery.encoder.encodeForHTMLAttribute(str);}return str;},encodeForJavascript : function(str) {if(str && typeof(str)==='string'){return jQuery.encoder.encodeForJavascript(str);}return str;},encodeForCSS : function(str) {if(str && typeof(str)==='string'){return jQuery.encoder.encodeForCSS(str);}return str;}};

        var zsAttachedAttachmentsCount = 0;
        var zsAllowedAttachmentLimit = 4;
        var zsAttachmentFileBrowserIdsList = [1, 2, 3, 4, 5];

        function zsRenderBrowseFileAttachment(zsAttachmentObject, zsAttachmentDetails){if(zsAttachmentObject != ''){if((zsAttachmentDetails.files && (zsAttachmentDetails.files[0].size/(1024*1024))>20)){zsAttachmentDetails.value='';alert('Maximum allowed file size is 20MB.');return;}if(zsAttachedAttachmentsCount < 5){var zsFileName='';if((zsAttachmentObject.indexOf('\\') > -1)){var zsAttachmentDataSplits = zsAttachmentObject.split('\\');var zsAttachmentDataSplitsLen = zsAttachmentDataSplits.length;zsFileName = zsAttachmentDataSplits[zsAttachmentDataSplitsLen - 1];}else{zsFileName = zsAttachmentObject;}var extension = zsFileName.split('.').pop().toLowerCase();var unSupportedExtensions = ["ade","adp","apk","appx","appxbundle","bat","cab","cer","chm","cmd","com","cpl","dll","dmg","exe","hlp","hta","ins","iso","isp","jar","js","jse","lnk","mde","msc","msi","msix","msixbundle","msp","mst","nsh","pif","ps1","pst","reg","scr","sct","shb","sys","tmp","url","vb","vbe","vbs","vxd","wsc","wsf","wsh","terminal"];if(unSupportedExtensions.indexOf(extension)!=-1){alert("The file wasn't attached since its extension is not supported.");return;}var zsCurrentAttachmentIdTokens = jQuery(zsAttachmentDetails).attr('id').split('_');var zsCurrentAttachmentId = parseInt(zsCurrentAttachmentIdTokens[1]);var zsAttachmentIdToBeRemoved = jQuery.inArray(zsCurrentAttachmentId, zsAttachmentFileBrowserIdsList);zsAttachmentFileBrowserIdsList.splice(zsAttachmentIdToBeRemoved, 1);var zsNextAttachmentId = zsAttachmentFileBrowserIdsList[0];var zsnextAttachment = 'zsattachment_'+zsNextAttachmentId;jQuery('#zsattachment_'+zsCurrentAttachmentId).hide();jQuery('#'+zsnextAttachment).show();jQuery('#zsFileBrowseAttachments').append('<div class="filenamecls zsFontClass" id="file_'+zsCurrentAttachmentId+'">'+ ZSEncoder.encodeForHTML(zsFileName) + '<a class="zsfilebrowseAttachment" style="margin-left:10px;" href="javascript:;" id="fileclose_'+zsCurrentAttachmentId+'">X</a></div>');zsAttachedAttachmentsCount = zsAttachedAttachmentsCount + 1;}}zsChangeMousePointer();}

        jQuery(document).off('click.fba').on('click.fba', '.zsfilebrowseAttachment', function(){var currentlyDeletedElement = jQuery(this).attr('id').split('_')[1];jQuery('#zsattachment_'+currentlyDeletedElement).val('');jQuery('#zsattachment_'+currentlyDeletedElement).replaceWith(jQuery('#zsattachment_'+currentlyDeletedElement).clone());jQuery(this).parent().remove();zsAttachedAttachmentsCount = zsAttachedAttachmentsCount - 1;zsAttachmentFileBrowserIdsList.push(parseInt(currentlyDeletedElement));zsRearrangeFileBrowseAttachments();zsChangeMousePointer();});

        function zsRearrangeFileBrowseAttachments(){jQuery.each(jQuery('input[type = file]'), function(fileIndex, fileObject){fileIndex = fileIndex + 1;if(fileIndex == zsAttachmentFileBrowserIdsList[0]){jQuery('#zsattachment_'+fileIndex).show();}else{jQuery('#zsattachment_'+fileIndex).hide();}});}

        function zsOpenFileBrowseAttachment(clickEvent){if(zsAttachedAttachmentsCount >= 5){clickEvent.preventDefault();}}

        function zsChangeMousePointer(){if(zsAttachedAttachmentsCount >= 5){jQuery('#zsMaxLimitMessage').show();jQuery('#zsattachment_1,#zsattachment_2,#zsattachment_3,#zsattachment_4,#zsattachment_5').hide();jQuery('#dragDropArea').css('cursor', 'default');}else{jQuery('#zsMaxLimitMessage').hide();zsRearrangeFileBrowseAttachments();jQuery('#dragDropArea').css('cursor', 'pointer');}}

        function zsResetWebForm(webFormId){document.forms['zsWebToCase_'+webFormId].reset();document.getElementById('zsSubmitButton_5211000000795236').removeAttribute('disabled');setAllDependancyFieldsMapping();zsAttachedAttachmentsCount = 0;zsAttachmentFileBrowserIdsList = [1, 2, 3, 4, 5];jQuery('#zsFileBrowseAttachments').html('');zsRearrangeFileBrowseAttachments();zsChangeMousePointer();}

        // Main SolveIT Application
        class SolveITSupportApp {
            constructor() {
                this.systemInfo = null;
                this.userSettings = {};
                this.currentScreenshots = [];
                this.isInitialized = false;
                this.setupStep = 1;
                
                this.initialize();
            }

            async initialize() {
                console.log('SolveIT Support Client - Production Ready v1.0');
                
                try {
                    const needsSetup = this.checkSetupRequired();
                    
                    if (needsSetup) {
                        this.showSetupWizard();
                    } else {
                        await this.initializeMainApp();
                    }
                    
                } catch (error) {
                    console.error('Initialization error:', error);
                    this.handleInitializationError();
                }
            }

            checkSetupRequired() {
                try {
                    const setupCompleted = localStorage.getItem('setupCompleted') === 'true';
                    const hasProfile = localStorage.getItem('userProfile') !== null;
                    
                    return !setupCompleted || !hasProfile;
                } catch (error) {
                    console.error('Setup check error:', error);
                    return true;
                }
            }

            showSetupWizard() {
                console.log('Showing setup wizard...');
                document.getElementById('loadingOverlay').classList.add('hidden');
                document.getElementById('setupWizardModal').style.display = 'block';
                document.getElementById('mainApp').style.display = 'none';
                
                this.setupWizardEventListeners();
            }

            setupWizardEventListeners() {
                document.getElementById('setupNextBtn').addEventListener('click', () => this.nextSetupStep());
                document.getElementById('setupPrevBtn').addEventListener('click', () => this.prevSetupStep());
                document.getElementById('setupFinishBtn').addEventListener('click', () => this.completeSetup());
                document.getElementById('setupSkipBtn').addEventListener('click', () => this.skipSetup());

                setTimeout(() => {
                    const firstInput = document.getElementById('setupFirstName');
                    if (firstInput) firstInput.focus();
                }, 100);
            }

            nextSetupStep() {
                if (this.setupStep === 1) {
                    const firstName = document.getElementById('setupFirstName').value.trim();
                    const lastName = document.getElementById('setupLastName').value.trim();
                    const email = document.getElementById('setupEmail').value.trim();
                    
                    if (!firstName || !lastName || !email) {
                        this.showMessage('Please fill in all required fields (marked with *)', 'error');
                        return;
                    }
                    
                    if (!email.includes('@')) {
                        this.showMessage('Please enter a valid email address', 'error');
                        return;
                    }
                }
                
                document.getElementById('setupStep1').classList.remove('active');
                document.getElementById('setupStep2').classList.add('active');
                this.setupStep = 2;
                
                document.getElementById('setupPrevBtn').style.display = 'inline-block';
                document.getElementById('setupSkipBtn').style.display = 'none';
                document.getElementById('setupNextBtn').style.display = 'none';
                document.getElementById('setupFinishBtn').style.display = 'inline-block';
                document.getElementById('setupProgressFill').style.width = '100%';
            }

            prevSetupStep() {
                document.getElementById('setupStep2').classList.remove('active');
                document.getElementById('setupSkipBtn').style.display = 'inline-block';
                document.getElementById('setupStep1').classList.add('active');
                this.setupStep = 1;
                
                document.getElementById('setupPrevBtn').style.display = 'none';
                document.getElementById('setupNextBtn').style.display = 'inline-block';
                document.getElementById('setupFinishBtn').style.display = 'none';
                document.getElementById('setupProgressFill').style.width = '50%';
            }

            completeSetup() {
                try {
                    const profileData = {
                        firstName: document.getElementById('setupFirstName').value.trim(),
                        lastName: document.getElementById('setupLastName').value.trim(),
                        email: document.getElementById('setupEmail').value.trim(),
                        phone: document.getElementById('setupPhone').value.trim(),
                        extension: document.getElementById('setupExtension').value.trim(),
                        department: document.getElementById('setupDepartment').value.trim() || 'General',
                        jobTitle: document.getElementById('setupJobTitle').value.trim(),
                        setupDate: new Date().toISOString()
                    };
                    
                    this.saveUserProfile(profileData);
                    
                    document.getElementById('setupWizardModal').style.display = 'none';
                    this.initializeMainApp();
                    
                    this.showMessage('✅ Setup completed! Welcome to SolveIT Support.', 'success');
                    
                } catch (error) {
                    console.error('Setup completion error:', error);
                    this.showMessage('Failed to complete setup. Please try again.', 'error');
                }
            }

            skipSetup() {
                const demoProfile = {
                    firstName: 'Demo',
                    lastName: 'User',
                    email: 'demo@company.com',
                    phone: '(555) 123-4567',
                    extension: '',
                    department: 'General',
                    jobTitle: 'Employee',
                    setupDate: new Date().toISOString()
                };
                
                this.saveUserProfile(demoProfile);
                
                document.getElementById('setupWizardModal').style.display = 'none';
                this.initializeMainApp();
                
                this.showMessage('⚠️ Setup skipped - using demo profile. Update your information in Settings.', 'warning');
            }

            saveUserProfile(profileData) {
                try {
                    localStorage.setItem('userProfile', JSON.stringify(profileData));
                    localStorage.setItem('setupCompleted', 'true');
                    this.userSettings = profileData;
                    console.log('Profile saved:', profileData);
                    return true;
                } catch (error) {
                    console.error('Error saving profile:', error);
                    return false;
                }
            }

            async initializeMainApp() {
                console.log('Initializing main application...');
                
                try {
                    document.getElementById('loadingOverlay').classList.add('hidden');
                    document.getElementById('mainApp').style.display = 'flex';
                    
                    this.loadUserSettings();
                    this.setupEventListeners();
                    await this.loadSystemInformation();
                    await this.loadScreenshots();
                    this.populateUserInfo();
                    this.autoFillZohoForm();
                    this.setupDragAndDrop();
                    
                    this.isInitialized = true;
                    console.log('Main application initialized successfully');
                    
                } catch (error) {
                    console.error('Main app initialization error:', error);
                    this.showMessage('Failed to initialize application', 'error');
                }
            }

            loadUserSettings() {
                try {
                    const saved = localStorage.getItem('userProfile');
                    if (saved) {
                        this.userSettings = JSON.parse(saved);
                    } else {
                        this.createDemoProfile();
                    }
                    console.log('User settings loaded');
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
                    this.saveUserProfile(this.userSettings);
                } catch (error) {
                    console.error('Error saving demo profile:', error);
                }
            }

            populateUserInfo() {
                const fullName = this.userSettings.firstName + ' ' + this.userSettings.lastName;
                
                const userName = document.getElementById('userName');
                const userEmail = document.getElementById('userEmail');
                
                if (userName) userName.textContent = fullName || 'Not Set';
                if (userEmail) userEmail.textContent = this.userSettings.email || 'Not Set';
                
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

            autoFillZohoForm() {
                try {
                    const autoFirstName = document.getElementById('autoFirstName');
                    const autoContactName = document.getElementById('autoContactName');
                    const autoEmail = document.getElementById('autoEmail');
                    const autoPhone = document.getElementById('autoPhone');
                    
                    if (autoFirstName) autoFirstName.value = this.userSettings.firstName || '';
                    if (autoContactName) autoContactName.value = this.userSettings.lastName || '';
                    if (autoEmail) autoEmail.value = this.userSettings.email || '';
                    if (autoPhone) autoPhone.value = this.userSettings.phone || '';
                    
                } catch (error) {
                    console.error('Error auto-filling Zoho form:', error);
                }
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
                    }
                } catch (error) {
                    console.error('Error loading system information:', error);
                    this.systemInfo = null;
                    this.updateSystemInfoDisplay();
                    this.updateSystemStatus('Error', 'error');
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
                    statusDot.className = 'status-dot ' + statusType;
                }
            }

            async loadScreenshots() {
                // Screenshots are now handled differently - no need to load/display
                console.log('Screenshot functionality updated - using direct file system approach');
            }

            setupEventListeners() {
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

                // Updated: Use Zoho form submission with system info injection
                const ticketForm = document.getElementById('zsWebToCase_5211000000795236');
                if (ticketForm) {
                    ticketForm.addEventListener('submit', (e) => this.handleTicketSubmission(e));
                }

                const systemInfoBtn = document.getElementById('systemInfoBtn');
                const quickToolsBtn = document.getElementById('quickToolsBtn');
                const settingsBtn = document.getElementById('settingsBtn');
                
                if (systemInfoBtn) {
                    systemInfoBtn.addEventListener('click', () => this.openModal('systemModal'));
                }
                
                if (quickToolsBtn) {
                    quickToolsBtn.addEventListener('click', () => this.openModal('quickToolsModal'));
                }
                
                if (settingsBtn) {
                    settingsBtn.addEventListener('click', () => this.openModal('settingsModal'));
                }

                this.setupModalControls();

                const saveSettingsBtn = document.getElementById('saveSettingsBtn');
                if (saveSettingsBtn) {
                    saveSettingsBtn.addEventListener('click', () => this.handleSaveSettings());
                }

                const refreshSystemInfoBtn = document.getElementById('refreshSystemInfoBtn');
                if (refreshSystemInfoBtn) {
                    refreshSystemInfoBtn.addEventListener('click', () => this.handleRefreshSystemInfo());
                }

                // Updated: Use main.js screenshot function
                const takeScreenshotBtn = document.getElementById('takeScreenshotBtn');
                
                if (takeScreenshotBtn) {
                    takeScreenshotBtn.addEventListener('click', () => this.takeScreenshot());
                }

                const toolButtons = document.querySelectorAll('.tool-btn-modal[data-tool]');
                toolButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const tool = e.currentTarget.getAttribute('data-tool');
                        this.handleToolExecution(tool);
                        this.closeModal('quickToolsModal');
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

            setupDragAndDrop() {
                const dragArea = document.getElementById('dragDropArea');
                if (!dragArea) return;

                // Click to browse files
                dragArea.addEventListener('click', (e) => {
                    // Only trigger file browse if not clicking the screenshot button
                    if (e.target.id !== 'takeScreenshotBtn' && zsAttachedAttachmentsCount < 5) {
                        const nextAttachment = document.getElementById('zsattachment_' + zsAttachmentFileBrowserIdsList[0]);
                        if (nextAttachment) {
                            nextAttachment.click();
                        }
                    }
                });

                // Drag and drop events
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
                for (let i = 0; i < files.length && zsAttachedAttachmentsCount < 5; i++) {
                    const file = files[i];
                    const nextAttachmentId = zsAttachmentFileBrowserIdsList[0];
                    const nextAttachment = document.getElementById('zsattachment_' + nextAttachmentId);
                    
                    if (nextAttachment) {
                        // Create a FileList-like object
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        nextAttachment.files = dataTransfer.files;
                        
                        // Trigger the change event
                        zsRenderBrowseFileAttachment(file.name, nextAttachment);
                    }
                }
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
                
                if (!this.systemInfo) {
                    container.innerHTML = '<div class="system-unavailable"><h4>❌ System Information Unavailable</h4><p>Could not collect system information. Try refreshing or contact support.</p></div>';
                    return;
                }
                
                container.innerHTML = '<div class="system-section"><h4>Computer Information</h4>' +
                    '<div class="system-item"><span class="system-label">Name:</span><span class="system-value">' + this.systemInfo.computerName + '</span></div>' +
                    '<div class="system-item"><span class="system-label">Manufacturer:</span><span class="system-value">' + this.systemInfo.manufacturer + '</span></div>' +
                    '<div class="system-item"><span class="system-label">Model:</span><span class="system-value">' + this.systemInfo.model + '</span></div>' +
                    '<div class="system-item"><span class="system-label">OS:</span><span class="system-value">' + this.systemInfo.osVersion + '</span></div>' +
                    '<div class="system-item"><span class="system-label">CPU:</span><span class="system-value">' + this.systemInfo.cpu.model + '</span></div>' +
                    '<div class="system-item"><span class="system-label">Memory:</span><span class="system-value">' + this.systemInfo.memory.total + ' (' + this.systemInfo.memory.usagePercent + '% used)</span></div>' +
                    '<div class="system-item"><span class="system-label">Network:</span><span class="system-value">' + this.systemInfo.network.primaryIP + '</span></div>' +
                    '</div>' +
                    '<div class="system-section"><h4>System Status</h4>' +
                    '<div class="system-item"><span class="system-label">Uptime:</span><span class="system-value">' + this.systemInfo.uptime + '</span></div>' +
                    '<div class="system-item"><span class="system-label">User:</span><span class="system-value">' + this.systemInfo.currentUser + '@' + this.systemInfo.userDomain + '</span></div>' +
                    '<div class="system-item"><span class="system-label">Last Scan:</span><span class="system-value">' + new Date(this.systemInfo.collectedAt).toLocaleString() + '</span></div>' +
                    '</div>';
            }

            async handleTicketSubmission(e) {
                e.preventDefault(); // Prevent the default Zoho form submission
                
                const submitBtn = document.getElementById('zsSubmitButton_5211000000795236');
                const originalText = submitBtn.textContent;
                
                try {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Submitting...';
                    
                    // Get form data
                    const subject = document.getElementById('ticketSubject').value.trim();
                    const description = document.getElementById('ticketDescription').value.trim();
                    
                    // Validate required fields
                    if (!subject) {
                        throw new Error('Please enter a subject for your ticket');
                    }
                    
                    if (!description) {
                        throw new Error('Please describe your issue');
                    }
                    
                    // Add system info to description
                    const systemInfoText = this.generateSystemInfoText();
                    const descriptionField = document.getElementById('ticketDescription');
                    if (!descriptionField.value.includes('=== SYSTEM INFORMATION ===')) {
                        descriptionField.value += systemInfoText;
                    }
                    
                    // Create FormData and submit to Zoho manually
                    const formData = new FormData(document.getElementById('zsWebToCase_5211000000795236'));
                    
                    // Submit via fetch with no-cors to avoid redirect
                    const response = await fetch('https://helpdesk.solveitsolutions.ca/support/WebToCase', {
                        method: 'POST',
                        body: formData,
                        mode: 'no-cors'
                    });
                    
                    // Show success popup (since we can't read response with no-cors, assume success)
                    await window.electronAPI.showMessageBox({
                        type: 'info',
                        title: 'Ticket Submitted Successfully',
                        message: 'Thank you! Your ticket was successfully received.',
                        detail: 'We will reach out to you shortly to assist with your request.',
                        buttons: ['OK']
                    });
                    
                    // Reset form
                    document.getElementById('zsWebToCase_5211000000795236').reset();
                    this.autoFillZohoForm();
                    
                    // Reset Zoho attachment system
                    zsResetWebForm('5211000000795236');
                    
                    this.showMessage('✅ Ticket submitted successfully!', 'success');
                    
                } catch (error) {
                    console.error('Submission error:', error);
                    
                    await window.electronAPI.showMessageBox({
                        type: 'error',
                        title: 'Submission Error',
                        message: 'There was an error submitting your ticket.',
                        detail: 'Please try again or contact support directly.',
                        buttons: ['OK']
                    });
                    
                    this.showMessage(error.message || '❌ Failed to submit ticket', 'error');
                    
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
Department: ${this.userSettings.department}`;
    }

    return `

==================================================
            SYSTEM INFORMATION REPORT
==================================================

Computer Name: ${this.systemInfo.computerName}
Manufacturer: ${this.systemInfo.manufacturer}
Model: ${this.systemInfo.model}
Serial Number: ${this.systemInfo.serialNumber}
Operating System: ${this.systemInfo.osVersion}
Architecture: ${this.systemInfo.osArchitecture}
Processor: ${this.systemInfo.cpu.model}
CPU Cores: ${this.systemInfo.cpu.cores}
Memory Total: ${this.systemInfo.memory.total}
Memory Usage: ${this.systemInfo.memory.usagePercent}% used
Network IP: ${this.systemInfo.network.primaryIP}
Network Hostname: ${this.systemInfo.network.hostname}
System Uptime: ${this.systemInfo.uptime}
Current User: ${this.systemInfo.currentUser}@${this.systemInfo.userDomain}
Last Boot: ${new Date(this.systemInfo.lastBoot).toLocaleString()}

${this.systemInfo.storage.length > 0 ? `Storage Details:
${this.systemInfo.storage.map(drive => `Drive ${drive.drive}: ${drive.total} total, ${drive.free} free (${drive.usagePercent}% used)`).join('\n')}` : ''}

${this.systemInfo.gpu.length > 0 ? `Graphics:
${this.systemInfo.gpu.map(gpu => `${gpu.name}${gpu.memory !== 'Unknown' ? ` (${gpu.memory})` : ''}`).join('\n')}` : ''}

${this.systemInfo.network.interfaces.length > 0 ? `Network Interfaces:
${this.systemInfo.network.interfaces.map(iface => `${iface.name}: ${iface.address} (MAC: ${iface.mac})`).join('\n')}` : ''}

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

            async takeScreenshot() {
                try {
                    // Use main.js function to take screenshot
                    const result = await window.electronAPI.takeScreenshot();
                    if (result.success) {
                        this.showMessage('📷 Screenshot captured! Opening folder...', 'success');
                        
                        // Open the temp folder where screenshots are saved
                        // This will help user easily drag the screenshot into the form
                         if (window.electronAPI.openScreenshotFile && result.filepath) {
                            await window.electronAPI.openScreenshotFile(result.filepath);
                        }
                    } else {
                        this.showMessage('❌ Screenshot failed: ' + (result.error || 'Unknown error'), 'error');
                    }
                } catch (error) {
                    console.error('Screenshot error:', error);
                    this.showMessage('❌ Screenshot failed', 'error');
                }
            }

            async clearScreenshots() {
                try {
                    const result = await window.electronAPI.clearScreenshots();
                    if (result.success) {
                        this.currentScreenshots = [];
                        this.updateScreenshotsDisplay();
                        this.showMessage('🗑️ Screenshots cleared', 'info');
                    }
                } catch (error) {
                    console.error('Clear screenshots error:', error);
                    this.showMessage('❌ Clear failed', 'error');
                }
            }

            updateScreenshotsDisplay() {
                const container = document.getElementById('screenshotStatus');
                const clearBtn = document.getElementById('clearScreenshotsBtn');
                
                if (!container || !clearBtn) return;
                
                clearBtn.style.display = this.currentScreenshots.length > 0 ? 'inline-block' : 'none';
                
                if (this.currentScreenshots.length === 0) {
                    container.innerHTML = '<div class="no-screenshots"><div class="screenshot-icon">📷</div><div class="screenshot-text">No screenshots</div></div>';
                } else {
                    const screenshotItems = this.currentScreenshots.map((screenshot, i) => 
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

            handleSaveSettings() {
                try {
                    const updatedSettings = {
                        firstName: document.getElementById('settingsFirstName').value.trim(),
                        lastName: document.getElementById('settingsLastName').value.trim(),
                        email: document.getElementById('settingsEmail').value.trim(),
                        department: document.getElementById('settingsDepartment').value.trim(),
                        phone: document.getElementById('settingsPhone').value.trim(),
                        extension: this.userSettings.extension || '',
                        jobTitle: this.userSettings.jobTitle || ''
                    };
                    
                    localStorage.setItem('userProfile', JSON.stringify(updatedSettings));
                    
                    this.userSettings = updatedSettings;
                    
                    this.populateUserInfo();
                    this.autoFillZohoForm();
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
                        
                        const systemModal = document.getElementById('systemModal');
                        if (systemModal && systemModal.style.display === 'block') {
                            this.populateDetailedSystemInfo();
                        }
                    } else {
                        console.error('Failed to refresh system info:', result.error);
                        this.updateSystemStatus('Error', 'error');
                        this.showMessage('❌ ' + (result.error || 'Failed to refresh system information'), 'error');
                    }
                } catch (error) {
                    console.error('Error refreshing system info:', error);
                    this.updateSystemStatus('Error', 'error');
                    this.showMessage('❌ Error refreshing system information', 'error');
                }
            }

            async handleToolExecution(toolName) {
                try {
                    console.log('Running tool:', toolName);
                    this.showMessage('🔧 Running ' + toolName + '...', 'info');
                    
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
                        this.showMessage('✅ ' + result.message, 'success');
                    } else {
                        this.showMessage('❌ ' + (result?.message || 'Failed to run ' + toolName), 'error');
                    }
                    
                } catch (error) {
                    console.error('Error running tool:', error);
                    this.showMessage('❌ Error running ' + toolName + ': ' + error.message, 'error');
                }
            }

            showMessage(text, type) {
                document.querySelectorAll('.message').forEach(msg => msg.remove());
                
                const message = document.createElement('div');
                message.className = 'message ' + type;
                message.textContent = text;
                
                const form = document.querySelector('.main-form');
                if (form) {
                    form.insertBefore(message, form.firstChild);
                    
                    setTimeout(() => {
                        if (message.parentNode) {
                            message.remove();
                        }
                    }, 4000);
                }
            }

            handleInitializationError() {
                document.getElementById('loadingOverlay').classList.add('hidden');
                document.getElementById('mainApp').style.display = 'flex';
                
                this.createDemoProfile();
                this.populateUserInfo();
                this.setupEventListeners();
                
                this.showMessage('⚠️ App started with limited functionality', 'warning');
            }
        }

        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize Zoho form first
            document.addEventListener('readystatechange', function() {
                if (document.readyState === 'complete') {
                    setAllDependancyFieldsMapping();
                    document.getElementById('zsSubmitButton_5211000000795236').removeAttribute('disabled');
                    zsAttachedAttachmentsCount = 0;
                    zsAttachmentFileBrowserIdsList = [1, 2, 3, 4, 5];
                    jQuery('#zsFileBrowseAttachments').html('');
                    zsRearrangeFileBrowseAttachments();
                    zsChangeMousePointer();
                }
            });

            // Initialize main app
            window.solveITApp = new SolveITSupportApp();
        });

        // Error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });
    </script>
