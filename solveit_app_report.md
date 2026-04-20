# SolveIT Support Client - Technical Documentation

## **Application Overview**

The SolveIT Support Client is a desktop application built with Electron that streamlines IT support ticket creation and system management. It automatically collects system information, captures screenshots, and submits support tickets to Zoho Desk while providing quick access to common Windows system tools.

## **Core Functionality**

### **Primary Features**
- **Automated Ticket Creation**: Creates support tickets with auto-filled user info and system details
- **System Information Collection**: Automatically gathers comprehensive hardware/software information
- **Screenshot Capture**: Takes and manages screenshots for ticket attachments
- **Live Chat Integration**: Embedded SalesIQ chat widget for real-time support
- **System Tools**: Quick access to Windows utilities (restart, updates, network settings, etc.)
- **User Profile Management**: Setup wizard and settings management

### **Target Use Case**
Deployed to client computers in an MSP (Managed Service Provider) environment, allowing end users to easily create detailed support tickets without technical knowledge while providing IT staff with comprehensive system information.

---

## **Application Architecture**

### **Technology Stack**
- **Framework**: Electron (Node.js + Chromium)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js with Windows system commands
- **Integration**: Zoho Desk API, SalesIQ Chat Widget
- **Packaging**: Electron Builder

### **Process Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Main Process  │◄──►│ Renderer Process │◄──►│  Zoho Services  │
│   (Backend)     │    │   (Frontend)     │    │  (External)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ System Commands │    │   User Interface │    │ Ticket Submission│
│ File Management │    │ Form Handling    │    │ Live Chat       │
│ Screenshot API  │    │ Screenshot UI    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## **File Structure & Dependencies**

### **Project Structure**
```
IT-Support-Client/
├── package.json                    # Project configuration
├── build/                         # Build assets
│   ├── icon.ico                   # Windows app icon
│   └── icon.png                   # Linux app icon
├── assets/                        # Runtime assets
│   └── icons/                     # Application icons
│       ├── Logo.png               # Main logo
│       └── tray-icon.png          # System tray icon
├── src/
│   ├── main/                      # Main Process (Backend)
│   │   ├── main.js                # Entry point & window management
│   │   ├── preload.js             # Secure IPC bridge
│   │   ├── system-info-collector.js # Hardware/software data collection
│   │   └── screenshot-manager.js  # Screenshot capture & management
│   └── renderer/                  # Renderer Process (Frontend)
│       ├── index.html             # Main UI & embedded JavaScript
│       ├── styles/                # CSS files (if separated)
│       │   ├── main.css           # Main layout styles
│       │   ├── form.css           # Form-specific styles
│       │   └── components.css     # Modal & component styles
│       └── scripts/               # JavaScript files (if separated)
│           ├── ui.js              # UI helper functions
│           ├── screenshots.js     # Screenshot UI management
│           └── system-info.js     # System info display logic
└── dist/                          # Build output directory
    ├── SolveIT Support Client Setup 1.0.0.exe  # NSIS installer
    ├── SolveIT Support Client 1.0.0.msi        # MSI installer
    └── win-unpacked/              # Portable executable
```

---

## **File Dependencies & Data Flow**

### **Startup Sequence**
1. **`package.json`** → **`main.js`** (Application entry point)
2. **`main.js`** → **`preload.js`** (Loads security bridge)
3. **`main.js`** → **`index.html`** (Creates main window)
4. **`index.html`** → **Embedded JavaScript** (Initializes UI)
5. **JavaScript** → **System Info Collector** (via IPC)
6. **JavaScript** → **Screenshot Manager** (via IPC)

### **Inter-Process Communication (IPC)**
```
Renderer Process          Main Process
     │                         │
     ├── User Actions ─────────┼── Window Controls
     ├── Form Submission ──────┼── Ticket Processing
     ├── Screenshot Request ───┼── Screenshot Manager
     ├── System Tool Request ──┼── Windows Commands
     └── Settings Changes ─────┼── Data Persistence
```

### **Key File Relationships**

#### **`main.js` (Main Process Controller)**
- **Uses**: `system-info-collector.js`, `screenshot-manager.js`, `preload.js`
- **Manages**: Window creation, IPC handlers, system commands, tray functionality
- **Communicates with**: Renderer process via IPC, Windows OS via exec commands

#### **`preload.js` (Security Bridge)**
- **Used by**: `main.js` (loaded into renderer context)
- **Exposes**: Safe API methods to renderer (electronAPI, systemUtils, zohoAPI)
- **Purpose**: Secure communication between main and renderer processes

#### **`system-info-collector.js` (Data Collection)**
- **Used by**: `main.js` via IPC handlers
- **Collects**: Hardware specs, OS info, network details, user information
- **Stores**: Data in AppData/Roaming for caching
- **Commands**: Windows WMI queries, system commands

#### **`screenshot-manager.js` (Screenshot Handling)**
- **Used by**: `main.js` via IPC handlers
- **Uses**: Electron desktopCapturer API
- **Manages**: Screen capture, file storage, thumbnail generation
- **Storage**: Temporary files in system temp directory

#### **`index.html` (Main UI)**
- **Contains**: Complete application UI, embedded CSS, embedded JavaScript
- **Integrates**: SalesIQ chat widget, Zoho form submission
- **Communicates**: With main process via exposed APIs in preload.js

---

## **Data Flow Diagrams**

### **Ticket Submission Flow**
```
User fills form → JavaScript validation → System info collection
                                                   ↓
Screenshot attachment ← Form data compilation ← User profile data
        ↓
Zoho Desk API ← Complete ticket submission
        ↓
Success confirmation → Form reset → Screenshot cleanup
```

### **System Information Collection**
```
App startup → Check cached data → System info collector
                    ↓                      ↓
            Cache valid? ──NO──► Collect fresh data
                    ↓                      ↓
                   YES              Save to cache
                    ↓                      ↓
            Load cached data ◄─────────────┘
                    ↓
            Transform for UI display
```

### **Screenshot Workflow**
```
User clicks screenshot → Desktop capturer API → Image processing
                                ↓                      ↓
                        Temporary file ←─── Thumbnail generation
                                ↓
                        UI preview update → Form attachment ready
```

---

## **External Integrations**

### **Zoho Desk Integration**
- **Method**: Direct HTTP POST to WebToCase endpoint
- **Data**: Form fields, system information, user profile
- **URL**: `https://helpdesk.solveitsolutions.ca/support/WebToCase`
- **Authentication**: Hidden form tokens embedded in HTML

### **SalesIQ Chat Widget**
- **Integration**: JavaScript widget embedded in HTML
- **Trigger**: Manual activation via chat button
- **Purpose**: Real-time support alternative to ticket creation

### **Windows System Integration**
- **Registry**: App installation, shortcuts, file associations
- **System Tray**: Persistent background presence
- **Auto-start**: Option to start with Windows
- **Temp Files**: Screenshot storage in system temp directory

---

## **Security & Permissions**

### **Electron Security**
- **Context Isolation**: Enabled (prevents renderer from accessing Node.js)
- **Node Integration**: Disabled in renderer
- **Preload Script**: Secure API exposure via contextBridge
- **Content Security**: Prevents external script execution

### **System Permissions**
- **File System**: Read/write access to AppData and temp directories
- **Network**: HTTPS requests to Zoho services
- **System Commands**: Execute Windows utilities (requires user confirmation for critical actions)
- **Screenshots**: Desktop capture capability

### **Data Storage**
- **User Profile**: Encrypted storage in AppData/Roaming
- **System Info**: Cached in AppData with timestamp validation
- **Screenshots**: Temporary files, auto-cleanup after 24 hours
- **No Sensitive Data**: No passwords or credentials stored locally

---

## **Build & Deployment**

### **Development Environment**
- **Requirements**: Node.js 16+, Windows 10/11
- **Commands**: 
  - `npm start` - Development mode
  - `npm run dev` - Development with DevTools
  - `npm run build-win` - Production build

### **Production Build Outputs**
1. **NSIS Installer** (`.exe`) - Standard user installation
2. **MSI Installer** (`.msi`) - Enterprise deployment
3. **Portable Executable** - No installation required

### **Distribution Strategy**
- **Primary**: NSIS installer for end users
- **Enterprise**: MSI for Group Policy deployment
- **Portable**: For testing or temporary use
- **Auto-updater**: GitHub releases integration (configured but optional)

---

## **Maintenance & Monitoring**

### **Logging**
- **System Info**: Collection logs in AppData
- **Screenshots**: Capture logs with cleanup tracking
- **App Events**: Console logging in development mode
- **Error Handling**: Graceful degradation with user notifications

### **Performance Considerations**
- **Memory Usage**: Minimal background footprint
- **Startup Time**: Fast initialization with cached data
- **System Impact**: Low resource usage, efficient screenshot cleanup
- **Network**: Minimal traffic, only during ticket submission

### **Update Mechanism**
- **Auto-updater**: Configured via electron-updater
- **Update Source**: GitHub releases
- **User Control**: Optional update notifications
- **Rollback**: Version tracking in AppData

---

## **Future Enhancement Opportunities**

1. **Advanced Diagnostics**: Network connectivity tests, system health checks
2. **Multi-language Support**: Internationalization for global deployment
3. **Custom Branding**: White-label options for different MSPs
4. **Analytics Integration**: Usage tracking and performance metrics
5. **Mobile Companion**: iOS/Android app for mobile ticket creation
6. **Advanced Security**: Code signing, certificate validation
7. **Plugin Architecture**: Extensible tool system for custom utilities

---

*This documentation reflects the current state of the SolveIT Support Client v1.0.0 as of the latest build.*