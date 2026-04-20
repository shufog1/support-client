export class Modals {
  constructor(state, toast) {
    this.state = state;
    this.toast = toast;
  }

  setupModalControls() {
    document.querySelectorAll('.close').forEach((closeBtn) => {
      closeBtn.addEventListener('click', (e) => {
        const modalId = e.target.getAttribute('data-modal');
        if (modalId) {
          this.closeModal(modalId);
        }
      });
    });

    document.querySelectorAll('.modal').forEach((modal) => {
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

    container.textContent = '';

    if (!this.state.systemInfo) {
      const unavail = document.createElement('div');
      unavail.className = 'system-unavailable';
      const h = document.createElement('h4');
      h.textContent = 'System Information Unavailable';
      const p = document.createElement('p');
      p.textContent = 'Could not collect system information. Try refreshing or contact support.';
      unavail.appendChild(h);
      unavail.appendChild(p);
      container.appendChild(unavail);
      return;
    }

    const info = this.state.systemInfo;

    const computerRows = [
      ['Name', info.computerName],
      ['Manufacturer', info.manufacturer],
      ['Model', info.model],
      ['OS', info.osVersion],
      ['CPU', info.cpu.model],
      ['Memory', `${info.memory.total} (${info.memory.usagePercent}% used)`],
      ['Network', info.network.primaryIP],
    ];

    const statusRows = [
      ['Uptime', info.uptime],
      ['User', `${info.currentUser}@${info.userDomain}`],
      ['Last Scan', new Date(info.collectedAt).toLocaleString()],
    ];

    container.appendChild(this._buildInfoSection('Computer Information', computerRows));
    container.appendChild(this._buildInfoSection('System Status', statusRows));
  }

  _buildInfoSection(title, rows) {
    const section = document.createElement('div');
    section.className = 'system-section';

    const heading = document.createElement('h4');
    heading.textContent = title;
    section.appendChild(heading);

    rows.forEach(([label, value]) => {
      const item = document.createElement('div');
      item.className = 'system-item';

      const labelEl = document.createElement('span');
      labelEl.className = 'system-label';
      labelEl.textContent = label + ':';

      const valueEl = document.createElement('span');
      valueEl.className = 'system-value';
      valueEl.textContent = value || 'Unknown';

      item.appendChild(labelEl);
      item.appendChild(valueEl);
      section.appendChild(item);
    });

    return section;
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
      settingsFirstName: this.state.userSettings.firstName,
      settingsLastName: this.state.userSettings.lastName,
      settingsEmail: this.state.userSettings.email,
      settingsDepartment: this.state.userSettings.department,
      settingsPhone: this.state.userSettings.phone,
    };

    Object.entries(fields).forEach(([fieldId, value]) => {
      const field = document.getElementById(fieldId);
      if (field && value) {
        field.value = value;
      }
    });
  }
}
