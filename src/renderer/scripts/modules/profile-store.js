export class ProfileStore {
    constructor(state, toast) {
        this.state = state;
        this.toast = toast;
    }

    saveUserProfile(profileData) {
        try {
            localStorage.setItem('userProfile', JSON.stringify(profileData));
            localStorage.setItem('setupCompleted', 'true');
            this.state.userSettings = profileData;
            return true;
        } catch (error) {
            return false;
        }
    }

    loadUserSettings() {
        try {
            const saved = localStorage.getItem('userProfile');
            if (saved) {
                this.state.userSettings = JSON.parse(saved);
            } else {
                this.createDemoProfile();
            }
        } catch (error) {
            this.createDemoProfile();
        }
    }

    createDemoProfile() {
        this.state.userSettings = {
            firstName: 'Demo',
            lastName: 'User',
            email: 'demo@company.com',
            phone: '(555) 123-4567',
            extension: '',
            department: 'General',
            jobTitle: 'Employee'
        };

        try {
            this.saveUserProfile(this.state.userSettings);
        } catch (error) {
            // ignore
        }
    }
}
