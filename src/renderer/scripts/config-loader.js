// Config loader — calls electronAPI.getConfig() once at startup and caches the result.
// All renderer modules should import from here rather than calling getConfig() directly.
// This file is a regular ES module; import it at the top of app.js.

let _config = null;

export function loadConfig() {
  if (_config) return _config;

  if (window.electronAPI && typeof window.electronAPI.getConfig === 'function') {
    _config = window.electronAPI.getConfig();
  } else {
    // Fallback for browser dev mode (no Electron context)
    _config = {
      zoho: {
        salesiqWidgetToken: '',
        salesiqWidgetBaseUrl: 'https://salesiq.zohopublic.ca/widget',
        webToCaseUrl: '',
        formId: '',
        tokens: { xnQsjsdp: '', xmIwtLD: '' },
        cdn: { jqueryEncoderUrl: '' },
      },
      branding: {
        productName: 'SolveIT Support Tool',
        tagline: '',
        supportEmail: '',
        logoPath: '../../assets/icons/Logo.png',
      },
      attachments: { maxCount: 5, maxSizeMb: 20, blockedExtensions: [] },
      toast: { durationMs: 4000 },
      demo: {
        firstName: 'Demo',
        lastName: 'User',
        email: '',
        phone: '',
        extension: '',
        department: 'General',
        jobTitle: 'Employee',
      },
    };
  }

  return _config;
}

export function getConfig() {
  return loadConfig();
}
