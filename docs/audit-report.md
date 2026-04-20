# SolveIT Support Client — CORRECTED Audit Report

**Date:** 2026-04-19
**Status:** Replaces the prior `AUDIT-REPORT.md` (2025-04-16), which incorrectly flagged dead-code files as "broken." The previous audit reviewed files that are physically present in `src/` (and therefore inside the `.asar`) but that the running app never `require`s, `import`s, or `<script src>`s. Conclusions about those files were not actionable. This report covers ONLY the code that actually executes in production on ~50–80 client machines.

---

## 1. Live vs. Dead Files

### LIVE (the only code that executes at runtime)

| File | Lines | Role |
|------|-------|------|
| `src/main/main.js` | 713 | Main process: window/tray, IPC handlers, screenshots, system-tool launchers, auto-updater |
| `src/main/preload.js` | 149 | Context-bridge; exposes `electronAPI`, `systemUtils`, `zohoAPI`, `appUtils` |
| `src/main/system-info-collector.js` | 422 | Runs PS script, parses JSON, caches to `%APPDATA%\IT Support Client\system-info.json`, Node.js fallback |
| `src/main/system-info.ps1` | 270 | WMI-based hardware/OS/network collector, outputs JSON |
| `src/renderer/index.html` | 2,117 | Self-contained renderer — markup + ~800 lines of inline CSS + ~960 lines of inline JS (`SolveITSupportApp` class, Zoho WebToCase form, all event handlers) |
| `package.json` | 165 | electron-builder config (msi/nsis/portable, GitHub publish), scripts, deps |
| `assets/icons/Logo.png`, `assets/icons/tray-icon.png` | — | Window + tray icons |

`main.js` `require`s only: `electron`, `path`, `child_process`, `fs`, `os`, `electron-updater`, `./system-info-collector`. Nothing else.
`index.html` `<script src>`s only Zoho's hosted SalesIQ widget and `jqueryandencoder.js`. No local JS files. No local CSS files.

### DEAD (verified orphan — present in source/`.asar` but never loaded)

| File | Why dead |
|------|----------|
| `src/renderer/renderer.js` (582 lines) | Not referenced in `index.html` |
| `src/renderer/scripts/app.js` | Not referenced in `index.html` (and itself fetches the dead `components/setup-wizard.html`) |
| `src/renderer/scripts/screenshots.js` | Not referenced |
| `src/renderer/scripts/system-info.js` | Not referenced |
| `src/renderer/scripts/ui.js` | Not referenced |
| `src/renderer/components/setup-wizard.html` | Setup wizard is inlined in `index.html` lines 828–902; only the dead `app.js` fetches this file |
| `src/renderer/style.css` | Not linked from `index.html`; CSS lives inline at lines 12–817 |
| `src/renderer/styles/main.css` | Not linked |
| `src/renderer/styles/components.css` | Not linked |
| `src/renderer/styles/form.css` | Not linked |
| `src/main/screenshot-manager.js` | Never `require`d; screenshot logic lives in `main.js` `captureScreenshot()` |
| `src/main/system-tools-manager.js` | Never `require`d; tools live in `main.js` IPC handlers |
| `src/integrations/zoho-desk.js` | Never `require`d; replaced by inline Zoho WebToCase iframe form in `index.html` |
| `src/integrations/zoho-salesiq.js` | Never `require`d; replaced by Zoho hosted SalesIQ widget script at `index.html:10` |
| `src/utils/` | Empty directory |
| `src/main/Onboardingchecklist_Report.pdf` | Stray PDF in the main folder; ships in the `.asar` for no reason |

The previous audit's "broken syntax" findings (e.g. in `screenshot-manager.js`) are real but irrelevant — the file is never loaded.

---

## 2. Live Code Review — Findings

Each finding is cited as `file:line`. Severity: **Critical** (security/data loss), **Major** (real bug or production risk), **Minor** (cleanup/code smell).

### 2.1 Hardcoded Values (move to `config.json` / constants)

| # | File:Line | What | Severity |
|---|-----------|------|----------|
| H1 | `main.js:34-39` | Window dimensions `width:420, height:780, minWidth:400, minHeight:650, maxWidth:500, maxHeight:800` | Minor |
| H2 | `main.js:51-52` | Window position `x: screenWidth - 440`, `y: Math.max(50, (screenHeight - 750) / 2)` — 440 and 750 don't match the 420/780 above | Minor |
| H3 | `main.js:15` | Screenshot output dir name `'SolveIT-Screenshots'` | Minor |
| H4 | `main.js:179, 191-195` | Screenshot resolutions hardcoded (1920×1080, 1280×720, 800×600) | Minor |
| H5 | `main.js:41, 95, 101` | Asset paths `'../../assets/icons/Logo.png'`, `'tray-icon.png'` | Minor |
| H6 | `main.js:144` | Tooltip string `'SolveIT Support Client - Click to open'` | Minor |
| H7 | `main.js:474` | Restart command + 30-second timer + cancel-message hardcoded inline | Minor |
| H8 | `main.js:464-471, 670-676, 682-687` | Dialog copy ("Are you sure you want to restart...", update messages) hardcoded | Minor |
| H9 | `system-info-collector.js:12` | App data path uses string `'IT Support Client'` — should match `package.json` productName or use `app.getPath('userData')` | Major |
| H10 | `system-info-collector.js:38, 94` | Default exec timeout `10000ms`, PS script timeout `30000ms` hardcoded | Minor |
| H11 | `system-info-collector.js:73` | Temp dir name `'solveit-support'` hardcoded; differs from the screenshot dir name | Minor |
| H12 | `system-info-collector.js:116, 148` | Collection metadata `version: '2.0.0'` hardcoded — drifts from `package.json` `1.0.0` | Major |
| H13 | `index.html:911` | Logo `<img src="../../assets/icons/Logo.png">` — relative path inside renderer; if `index.html` is ever moved this breaks silently | Minor |
| H14 | `index.html:946, 1779` | Help-desk endpoint `https://helpdesk.solveitsolutions.ca/support/WebToCase` hardcoded twice | Minor |
| H15 | `index.html:1031` | "Max 5 files, 20MB each" text + line `1175` `>20` MB check — both hardcoded inline | Minor |
| H16 | `index.html:1175` | 32-item executable extension blocklist baked into a one-liner | Minor |
| H17 | `index.html:1789-1791, 1808-1810` | Submission success/error dialog copy hardcoded | Minor |
| H18 | `index.html:1318-1326, 1389-1397` | "Demo User / demo@company.com / (555) 123-4567" demo-profile defaults baked in | Minor |
| H19 | `index.html:2073` | `setTimeout(...4000)` for toast auto-hide — magic number | Minor |
| H20 | `index.html:1172` | `zsAllowedAttachmentLimit = 4` while UI says 5; lines `1664` and `1629` use `5` directly. Inconsistent. | Major |

### 2.2 Hardcoded Secrets / Tenant Identifiers

These are not technically "secrets" (they're embedded by Zoho's WebToCase generator and visible to anyone who opens the form), but they ARE tenant identifiers tying the build to one Zoho account. They belong in config so a fork/whitelabel doesn't require code edits.

| # | File:Line | What |
|---|-----------|------|
| S1 | `index.html:10` | SalesIQ widget token `wc=380877c585926da403d5319d4d2ae57e320d9c28839517d349950fdc976da08a` |
| S2 | `index.html:946, 1042, 1043, 1158, 1185, 1562, 1748, 1776, 1795, 1799, 2095` | Zoho form ID `5211000000795236` repeated 11+ times across the form, the submit handler, the reset button, and the DOM-ready handler |
| S3 | `index.html:949` | Zoho `xnQsjsdp` token `edbsn25754e2bf66770e5202f9ba40ba41ad4` |
| S4 | `index.html:950` | Zoho `xmIwtLD` token `edbsndb0ce54b617bbc17eb795f7fa315266d3c4d19a0f5dda9b53fb386bb88a08a05` |
| S5 | `index.html:946` | WebToCase POST URL (also see H14) |
| S6 | `index.html:1154` | Hardcoded Zoho jQuery+encoder CDN URL with a fingerprint hash |
| S7 | `package.json:30, 31, 34, 50, 73, 154-157` | Email, homepage, appId, publisher, GitHub repo identifiers — fine for SolveIT, but if you ever whitelabel this app these must move |

### 2.3 Mixed Concerns / Architecture Smells

| # | File:Line | Issue |
|---|-----------|-------|
| A1 | `main.js` (whole file, 713 lines) | One file does: app lifecycle, window mgmt, tray mgmt, screenshot capture, 12 IPC handlers, system-tool launchers, auto-updater, error handlers. Should be split into `app.js`, `window.js`, `tray.js`, `screenshot.js`, `ipc/system-tools.js`, `ipc/system-info.js`, `auto-updater.js` |
| A2 | `index.html` (whole file, 2,117 lines) | Markup + 805 lines of CSS + 960 lines of JS in one file. Setup wizard, main UI, three modals, the entire `SolveITSupportApp` class, AND the obfuscated Zoho `setDependent`/`zsRenderBrowseFileAttachment` blob all share one `<script>` tag |
| A3 | `index.html:1158-1185` | Minified Zoho boilerplate (8 functions on single lines, 600+ chars each) sitting next to readable application code. Belongs in its own file or stripped to a documented adapter |
| A4 | `index.html:1188 SolveITSupportApp class` | Single class handles: setup wizard, profile storage, IPC for system info, IPC for screenshots, Zoho form auto-fill, Zoho form submission, drag-and-drop, modal control, toast messages, tool execution, error handling. Should be split into `SetupWizard`, `ProfileStore`, `SystemInfoController`, `TicketForm`, `Modals`, `Toast`, `Tools` |
| A5 | `main.js:298-310` | `app.whenReady` calls `systemInfoCollector.getSystemInfo()` eagerly at boot, then again on first IPC call. Wastes the first ~3-30s of startup running PowerShell before the user has even seen the window |
| A6 | `system-info-collector.js:228-313` | `parseWMICValue`, `parseWMICMultipleValues`, `parseRAMSlots`, `parseGPUInfo` — leftover helpers from a previous WMIC-based implementation. The current code uses the PowerShell script which already returns JSON. Verify and delete |
| A7 | `preload.js:75-88` | `zohoAPI` namespace exposes two stub methods that just `console.log` and return resolved promises. Dead surface. Delete it (the renderer never calls them) |
| A8 | `preload.js:91-121` | `appUtils` namespace — `getUserDataPath` calls `require('electron').remote?.app` which has been removed since Electron 14. Permanently broken. `log`/`error`/`isDevelopment` are unused by the renderer. Delete the whole namespace |
| A9 | `preload.js:124-126` | `delete window.require / exports / module` — these are a no-op when `contextIsolation: true` (which is enabled at `main.js:44`). Remove |

### 2.4 Code Smells

| # | File:Line | Issue |
|---|-----------|-------|
| C1 | `main.js:24, 169, 309, 384, 416, 437, 453, 484, 506, 528, 550, 562` | Errors swallowed to `console.error` only — no telemetry, no Sentry, no log file. With ~80 deployed copies you can't see when something breaks |
| C2 | `main.js:138, 326` | `app.isQuiting` (typo of `isQuitting`) is set as an ad-hoc property on the `app` object; works but smells |
| C3 | `main.js:474, 493, 515, 537, 572, 594, 614, 625, 636, 645` | `child_process.exec` called with no callback handling beyond `console.error`. User clicks "Disk Cleanup", nothing happens, no message, no log |
| C4 | `main.js:496` | `wuauclt /detectnow && control /name Microsoft.WindowsUpdate` — `wuauclt` is deprecated/removed on Win10+, will fail silently |
| C5 | `system-info-collector.js:231, 240` | `console.log('Parsing WMI output:', …)` and `console.log('Found WMI value:', …)` left in. Dead-code helpers (see A6); also they bypass the `this.log()` async file-logger and dump to stdout |
| C6 | `system-info-collector.js:25-27, 33-35` | `catch { /* Ignore log file errors */ }` — silently swallowed. If `%APPDATA%` is unwritable you'll never know |
| C7 | `system-info-collector.js:65-89` | `.asar` extraction logic re-runs every collection. Should extract once on first boot and cache the path |
| C8 | `system-info-collector.js:46-47` | `await this.log(\`Raw output: ${stdout.substring(0, 300)}\`)` — logs 300 chars of every command output, every time, to a file that has no rotation |
| C9 | `system-info.ps1:4` | `$ErrorActionPreference = "SilentlyContinue"` for the entire script — masks real failures |
| C10 | `system-info.ps1:63-77` | `Get-WmiObject` is deprecated since PowerShell 6 / replaced by `Get-CimInstance`. Still works on Windows PowerShell 5.1 (default in Win10/11) but is on a deprecation path |
| C11 | `index.html:1771-1773` | `if (!descriptionField.value.includes('=== SYSTEM INFORMATION ===')) { descriptionField.value += systemInfoText; }` — string-marker as guard. If a user types that string in their description, the system info won't be appended |
| C12 | `index.html:1729-1742` | `container.innerHTML = '...' + this.systemInfo.computerName + '...'` — concatenation into innerHTML with no escaping. `computerName`, `manufacturer`, `model`, `currentUser`, `userDomain` flow from WMI uninspected. XSS in a local Electron app is mostly theoretical, but it's still wrong |
| C13 | `index.html:1745 handleTicketSubmission` | `mode: 'no-cors'` then assumes success — the user is told "Ticket Submitted Successfully" even on a 500/network failure. Real failures only surface as the catch around the validation, not the network response |
| C14 | `index.html:1917-1956` | `clearScreenshots`, `updateScreenshotsDisplay`, references to `clearBtn`, `screenshotStatus` — dead methods. The screenshot UI was simplified but the methods remained |
| C15 | `index.html:1611-1619` | Textarea auto-grow uses `this.style.height = 'auto'` then `scrollHeight + 'px'` on every input — fine, but no max-height, can push the form off-screen on long descriptions |
| C16 | `index.html:1919` | `clearScreenshots()` calls `window.electronAPI.clearScreenshots` which DOES NOT EXIST in `preload.js`. Fortunately the method is never invoked, but it's broken surface |
| C17 | `preload.js:8` | `checkSystemInfoStatus: ...invoke('check-system-info-status')` — there's no IPC handler for `check-system-info-status` in `main.js`. Renderer never calls it but the surface is broken |
| C18 | `main.js:329-334` | `web-contents-created` listener uses `contents.on('new-window', …)` — `new-window` event was removed in Electron 22+. Currently this listener does nothing (and `setWindowOpenHandler` at line 87 is what's actually working) |

### 2.5 Real Security Issues (verified)

| # | Severity | File:Line | Issue |
|---|----------|-----------|-------|
| SEC1 | **Major** | `package.json:40` | `"electron": "^27.0.0"` — Electron 27 went EOL in June 2024. Multiple Chromium CVEs since. Update to current LTS (32+) |
| SEC2 | **Major** | `index.html:1729-1742, 1865-1872` | `innerHTML` concatenation with values from WMI / OS. Local XSS surface. Use `textContent` or template builders |
| SEC3 | OK | `main.js:43-44` | `nodeIntegration: false, contextIsolation: true` — GOOD. Keep |
| SEC4 | OK | `main.js:78-90` | External-link sandbox via `will-navigate` + `setWindowOpenHandler` — GOOD |
| SEC5 | **Minor** | `index.html:10, 1154` | Two third-party scripts (`salesiq.zohopublic.ca`, `js.zohostatic.ca`) loaded with no `integrity=` SRI hash. If Zoho is compromised, every client app silently runs attacker code in the renderer (which has access to `electronAPI`/`systemUtils` IPC handlers including `restart-computer` and `run-system-file-checker`) |
| SEC6 | **Minor** | `main.js:636` | `powershell -Command "Start-Process cmd -ArgumentList '/c sfc /scannow & pause' -Verb RunAs"` — hardcoded, no shell-injection vector here, but the `Verb RunAs` UAC pattern should be wrapped in a single helper used everywhere |
| SEC7 | **Minor** | `main.js:474` | `shutdown /r /t 30 /c "..."` — same as SEC6, no injection but worth wrapping |
| SEC8 | **Minor** | `package.json:74` | `verifyUpdateCodeSignature: false` — auto-updater accepts unsigned updates. If the GitHub release host or your account is compromised, attacker pushes an arbitrary EXE that runs on every client. Sign the updates and flip this to `true` |
| SEC9 | **Minor** | `index.html:1779-1782` | `fetch(..., { mode: 'no-cors' })` — fine for the WebToCase use case, but combined with C13 means the user is lied to on failure |
| SEC10 | **Minor** | `system-info-collector.js:14` | Plain-text log file at `%APPDATA%\IT Support Client\system-info.log` grows unbounded; contains hostname, username, hardware serials, IP addresses. Add rotation + size cap |

No Critical security issues. `nodeIntegration` is correctly off, `contextIsolation` is on, the IPC surface is allow-listed by the preload bridge.

---

## 3. Verdict & Readiness

**The app works in production today.** ~50–80 client installs, screenshots work, system-info collection works, ticket submission works. The previous audit's "broken" verdict was wrong — it audited code that never runs.

**However, the live code is not ready to be built on top of:**

- `index.html` at 2,117 lines is one file holding the entire UX. Adding an "AI chatbot tab" means appending another modal + several hundred more lines to a file that is already past Claude's editing-error threshold.
- `main.js` at 713 lines is one file holding every IPC handler. Adding a "remote agent WebSocket client" means another large feature wedged into a file that already mixes 6+ concerns.
- Hardcoded Zoho identifiers, tokens, and form IDs are scattered across the renderer in 11+ places. A whitelabel deploy or a Zoho-account migration would require manual hunting.
- Dead code (~3,000+ lines across `renderer.js`, `scripts/`, `styles/`, `screenshot-manager.js`, `system-tools-manager.js`, `integrations/`) ships in every `.asar`, increasing install size and confusing future contributors (including the previous audit pass).
- No telemetry / no log shipping. With 80 client installs you cannot tell when the app crashes.

**Recommendation:** Run the cleanup/refactor in `REFACTOR-PLAN.md` BEFORE adding the remote agent and AI chatbot. Phases are sized so the app stays runnable after every phase.

---

*End of audit. See `REFACTOR-PLAN.md` for the cleanup + reorganization plan.*
