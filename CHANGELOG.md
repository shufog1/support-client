# Changelog

All notable changes to the SolveIT Support Client.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.1] — 2026-04-20

Hotfix release addressing issues caught during v1.3.0 smoke testing.

### Fixed
- **Brand logo now displays correctly in header** — the `<img>` had `src=""` which triggered `onerror` on page load (empty src = invalid resource in Chromium), hiding the image and falling back to the 🚀 emoji before JavaScript could assign the real source. Removed the empty attribute so the image waits for JS.
- **Renderer can reach IPC bridge in Electron 36** — added `sandbox: false` to BrowserWindow `webPreferences`. Electron 20+ defaults sandbox to `true` when `contextIsolation` is on, which prevents `require()` in the preload script. The preload uses `require('../../config/*.json')` to load configs at load time, and the sandbox silently crashed it — leaving `window.electronAPI` undefined, so all IPC calls (system info, screenshot, etc.) failed with "Could not collect" errors. `contextIsolation: true` and `nodeIntegration: false` remain in place as the primary security boundary.
- **Publish URL now points at the real release host** — `package.json` `publish.owner` corrected from `solveitsolutions` (a 3rd-party account) to `shufog1` so auto-updater's `releases.atom` feed returns 200 instead of 404.

### Changed
- **Brand logo resized from 4663×4663 (219 KB) to 256×256 (8 KB)** — header displays at ~40 px; full-resolution decode was costing ~75 MB of renderer memory per window.

---

## [1.3.0] — 2026-04-20

The "clean house" release. Phases 3–6 of the refactor: config-driven whitelabel support, CSS extracted to stylesheets, real security fixes (Electron LTS, XSS hardening, log rotation, signing scaffold), dead code pruned from preload and system-info, PowerShell cache, and full ESLint/Prettier/Husky toolchain.

### Added
- **Config-driven whitelabel support** — 3 JSON files (`config/app.config.json`, `config/branding.config.json`, `config/zoho.config.json`) hold all hardcoded values; rebranding = edit JSON, zero code changes (Phase 4)
- **Log rotation** — `src/main/logger.js` wraps `electron-log` with 5 MB max per file, 3 files retained, preventing unbounded disk growth on long-lived installs (SEC10)
- **ESLint v9 flat config** — `eslint.config.mjs` with `recommended` + `eslint-plugin-n` + `eslint-config-prettier`; `npm run lint` and `npm run lint:fix` scripts (Phase 6)
- **Prettier v3** — `.prettierrc` standardizes formatting; `npm run format` and `npm run format:check` scripts; ran full format pass across 23 files (Phase 6)
- **Husky v9 + lint-staged pre-commit hook** — staged `.js` files must pass `eslint --max-warnings=0` before commit; staged `.html`/`.css`/`.json` auto-formatted by Prettier; hook confirmed blocking (Phase 6)
- **Code-signing scaffold** — `signingHashAlgorithms: ["sha256"]` set in electron-builder config (SEC8); cert purchase tracked in DECISIONS.md D8; `verifyUpdateCodeSignature` stays `false` until cert is in place

### Changed
- **Inline CSS extracted to 6 stylesheets** — `src/renderer/styles/`: `base.css`, `header.css`, `form.css`, `modal.css`, `setup-wizard.css`, `messages.css`; `index.html` now links them via `<link rel="stylesheet">` (Phase 3)
- **30+ hardcoded values moved to config** — window dimensions, timeouts, screenshot resolutions, attachment limits, toast duration, branding strings, Zoho tokens — all sourced from config at runtime via `preload.getConfig()` bridge (Phase 4)
- **Electron bumped 27 → 36.9.5** (EOL → LTS), **electron-builder 24 → 26.8.1** — resolves SEC1; rebuilt native deps; smoke-tested on Win10 + Win11 (Phase 5)
- **XSS-hardened renderer** — `innerHTML +=` patterns in ticket-form and description-builder replaced with `textContent` / `createElement` throughout user-facing code paths (SEC2)
- **Attachment limit reconciled at 5** — `zsAllowedAttachmentLimit` and inline copy now match; was inconsistent between UI and form config (H20)
- **System info collected lazily** — `getSystemInfo()` moved from `app.whenReady()` to `did-finish-load`; window appears immediately, collection runs in background (A5)

### Fixed
- **H20 — attachment limit mismatch** — UI cap and Zoho form field were out of sync; both now read from `config/app.config.json` `attachments.maxCount`
- **C7 — PowerShell script cache** — `.asar`-extracted `system-info.ps1` is only re-extracted when the script's `mtime` changes; faster startup after first run on a given Electron version

### Removed
- **Dead preload surface** — `zohoAPI`, `appUtils`, `checkSystemInfoStatus`, and the `delete window.require/exports/module` lines removed from `preload.js`; unused `new-window` listener removed from `main.js` (C18, A8, A9, C17)
- **Dead WMIC parser helpers** — `parseWMICValue`, `parseWMICMultipleValues`, `parseRAMSlots`, `parseGPUInfo` deleted from `system-info-collector.js`; WMI path was replaced by PowerShell in v1.0 and these were never called (A6, C5)
- **~3,165 lines of never-loaded dead code** removed in Phase 1/2 (reinforced here): 15 files across `src/integrations/`, stale script modules, and stray PDF — none were `require`d or `<script src>`'d

### Security
- **SEC1** — Electron EOL 27 → LTS 36.9.5; eliminates known CVEs in Electron 27 and Node.js embedded runtime
- **SEC2** — `textContent` / `createElement` replaces `innerHTML` in all user-facing renderer paths; closes XSS surface on ticket description and attachment list rendering
- **SEC10** — Log rotation via `electron-log`; prevents log files growing unbounded on always-on machines
- **SEC8** — Code-signing SHA-256 algorithm set in build config; cert purchase pending (see DECISIONS.md D8); `verifyUpdateCodeSignature` flips to `true` once cert is installed

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
