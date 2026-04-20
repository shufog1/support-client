export class ProfileStore {
  constructor(state, toast, config) {
    this.state = state;
    this.toast = toast;
    this.config = config;
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
    const demo = this.config && this.config.demo ? this.config.demo : {};
    this.state.userSettings = {
      firstName: demo.firstName,
      lastName: demo.lastName,
      email: demo.email,
      phone: demo.phone,
      extension: demo.extension,
      department: demo.department,
      jobTitle: demo.jobTitle,
    };

    try {
      this.saveUserProfile(this.state.userSettings);
    } catch (error) {
      // ignore
    }
  }
}
