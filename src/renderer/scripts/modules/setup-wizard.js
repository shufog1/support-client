export class SetupWizard {
    constructor(state, profileStore, toast, onComplete) {
        this.state = state;
        this.profileStore = profileStore;
        this.toast = toast;
        this.onComplete = onComplete;
        this.setupStep = 1;
    }

    showSetupWizard() {
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
                this.toast.showMessage('Please fill in all required fields (marked with *)', 'error');
                return;
            }

            if (!email.includes('@')) {
                this.toast.showMessage('Please enter a valid email address', 'error');
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

            this.profileStore.saveUserProfile(profileData);

            document.getElementById('setupWizardModal').style.display = 'none';
            this.onComplete();

            this.toast.showMessage('✅ Setup completed! Welcome to SolveIT Support.', 'success');
        } catch (error) {
            this.toast.showMessage('Failed to complete setup. Please try again.', 'error');
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

        this.profileStore.saveUserProfile(demoProfile);

        document.getElementById('setupWizardModal').style.display = 'none';
        this.onComplete();

        this.toast.showMessage('⚠️ Setup skipped - using demo profile. Update your information in Settings.', 'warning');
    }
}
