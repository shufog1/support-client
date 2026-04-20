# Changelog

All notable changes to the SolveIT Support Client.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] — 2026-04-20

The "refactor + UX polish" release. Codebase shrank by 64% (no behavior loss), startup is fast and clean, ticket flow feels native, screenshots auto-attach.

### Added
- **In-app ticket confirmation modal** — branded green-checkmark dialog replaces the Windows-native popup that used to look like an error. Honest copy: *"Submission received. Someone will reach out to you shortly."*
- **Auto-attach screenshots** — when you take a screenshot inside the app, it's automatically added to the ticket form's attachment list (no more drag-drop fiddling, especially helpful over RDP). Edge case handled: max-5 attachments shows a friendly toast.
- **Loading state on system info** — spinner + "Collecting system info…" text while the PowerShell collector runs. Refresh button shows the same loader.
- **Project documentation** — `CLAUDE.md`, `docs/implementation-plan.md`, `docs/audit-report.md`, `docs/DECISIONS.md`, `docs/revision-plans/` for proper handoff between sessions.

### Changed
- **Renderer is now modular** — the 2,117-line monolithic `index.html` was split. Inline JS extracted into 8 ES modules under `src/renderer/scripts/modules/`: `toast`, `dialog`, `profile-store`, `system-info-controller`, `modals`, `ticket-form`, `tools`, `setup-wizard` (+ `app.js` bootstrap). Behavior identical.
- **Honest dialog copy** on ticket submission — we use `mode: 'no-cors'`, so we can't actually verify Zoho accepted the form. Message reflects that: *"received"* not *"submitted successfully"*.
- **Window opens with brand color** — `backgroundColor: '#667eea'` set on the BrowserWindow so the brief native paint matches the gradient header instead of flashing white/black.
- **System info collection is non-blocking** — moved out of `app.whenReady()` into the `did-finish-load` event so the window appears immediately and collection happens in the background.

### Fixed
- **Slow startup (1-2 seconds of GPU thrashing)** — `app.disableHardwareAcceleration()`. The GPU process was crashing in some environments (RDP, integrated graphics, virtualized hosts) with `exit_code=-1073740791` (`STATUS_STACK_BUFFER_OVERRUN`). Electron retried 3× and fell back to software rendering anyway, wasting 1-2s. Skipping GPU init entirely makes startup fast and stable. This is a tray app — software rendering is plenty.
- **Removed mac-only `vibrancy: 'under-window'`** option that was silently ignored on Windows but may have caused repaint glitches.

### Removed
- **~6,100 lines of dead code, 15 files, 5 folders.** Files were physically present in the `.asar` but never `require`d / `import`ed / `<script src>`'d / `<link>`'d. The app's behavior is unchanged. Files removed:
  - `src/renderer/renderer.js` (582 lines, hardcoded "John Smith / DEMO-PC-01")
  - `src/renderer/scripts/{app,screenshots,system-info,ui}.js` (~1,591 lines — pre-Phase-2 dead set)
  - `src/renderer/components/setup-wizard.html`
  - `src/renderer/style.css` + `src/renderer/styles/{main,components,form}.css` (CSS was inline)
  - `src/main/screenshot-manager.js` (had a syntax error nobody noticed because the file was never parsed — `main.js` did the work)
  - `src/main/system-tools-manager.js`
  - `src/integrations/zoho-{desk,salesiq}.js` (real ticket flow uses the inline Zoho WebToCase iframe + hosted SalesIQ widget)
  - `src/main/Onboardingchecklist_Report.pdf` (stray PDF in the asar)
- **Splash window** — added briefly while diagnosing startup, removed once `disableHardwareAcceleration()` made it unnecessary.

### Internal / dev
- Initialized git (project had none — every change since is a commit + can be rolled back).
- Added `backups/` and `.tmp.driveupload/` to `.gitignore`.
- Pre-refactor 7z baseline saved at `backups/pre-refactor-baseline-2026-04-19.7z` (rollback point).
- Audit + refactor plan in `docs/`.

---

## [1.0.0] — 2025-06-09

Initial production release. Electron 27 + vanilla JS. Ticket submission via Zoho WebToCase, system info collection via PowerShell + WMI, quick-access Windows utility shortcuts (disk cleanup, Windows Update, network settings, etc.), screenshot capture, auto-update via GitHub releases.
