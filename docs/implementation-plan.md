# IT-Support-Client — Implementation Plan (Refactor)

## Current Status
**Last session:** 2026-04-20 (Session #9) — **Refactor COMPLETE. v1.3.0 + v1.3.1 shipped and published to GitHub.** Phases 3-7 all done in one session. GitHub repo created at `shufog1/support-client` (public), auto-updater feed verified live. Hotfix v1.3.1 chased v1.3.0 to fix the logo-rocket-fallback bug (empty `src=""` fired onerror before JS could set real src) and the Electron 36 sandbox bug (`sandbox: false` needed so preload `require()` works). Logo resized 4663→256px (219 KB → 8 KB). Shalom's dev machine is running the fresh build from `dist/win-unpacked/` — localStorage preserved across the install.
**Next up:** **Pilot rollout to 2-3 real clients.** Silent install via RMM using `msiexec /i "SolveIT Support Client-1.3.1-x64.msi" /qn /norestart` (fresh installs) or the NSIS `.exe /S` (upgrades — MSI hangs on `app.asar` overwrite during install-over-install). Monitor for 48h, then mass deploy to ~50-80 clients.
**Blockers:**
- NSIS/MSI upgrade path needs investigation — MSI hung on `app.asar` overwrite during v1.3.0 → v1.3.0 upgrade on Shalom's dev machine (workaround: use NSIS `.exe` with `/S` for upgrades). Should fix before production rollout.
- npm audit still shows Electron CVEs through 39.8.4 (fully clean at 41.2.1). Acceptable at 36 for v1.x, revisit before v2.0.0.
- Auto-updater `app-update.yml` resources file is missing from the NSIS install (`ENOENT: ...resources/app-update.yml` in log). Harmless warning but means Check-for-Updates from an NSIS-installed client may log errors. Fix in next session.
- Code signing (SEC8): still deferred to DECISIONS.md D8. Needs Authenticode cert purchase before production SmartScreen-free experience.

## Next Session Prompt
> Project: IT-Support-Client (SolveIT internal MSP support app)
> Path: `C:\Users\user\Documents\Work\Internal\IT-Support-Client`
> Client: Internal (SolveIT)
>
> Status: **v1.3.1 shipped to `github.com/shufog1/support-client/releases/tag/v1.3.1`.** Refactor Phases 3-7 ✅. Auto-updater feed live (`releases.atom` 200 OK). App verified working on Shalom's dev machine. Ready for pilot rollout — just need the installer-upgrade bug fixed first.
>
> This session — **pilot prep + installer fixes**. Two things block mass rollout:
>
> 1. **MSI install-over-install hangs** on `app.asar` overwrite (confirmed on Shalom's machine). NSIS `.exe /S` works for upgrades but MSI is what most MSP RMM tools prefer. Either fix the MSI behavior or document "use NSIS for upgrades, MSI for fresh installs" as the official rollout pattern.
> 2. **`app-update.yml` missing from NSIS install** — `ENOENT` error in logs when auto-updater tries to read it. Fix the electron-builder config so both MSI and NSIS include the file.
>
> Both are installer-plumbing issues, not app bugs. Dev-coder can handle. Security-auditor before the rebuild. Bump to v1.3.2 with these fixes. Then run a real pilot: pick 2-3 of Shalom's MSP clients, deploy silently via RMM, monitor 48h.
>
> Read first (in order):
> 1. `CLAUDE.md` — project context
> 2. `docs/implementation-plan.md` — this file
> 3. `CHANGELOG.md` — v1.3.0 + v1.3.1 release notes
> 4. `docs/DECISIONS.md` — D1-D8 architectural decisions
>
> **Repo:** https://github.com/shufog1/support-client (public) — release v1.3.1 is Latest.
> **Installer commands for MSP RMM:**
> - Fresh install: `msiexec /i "SolveIT-Support-Client-1.3.1-x64.msi" /qn /norestart`
> - Upgrade existing install: `"SolveIT-Support-Client-1.3.1-x64.exe" /S` (NSIS — avoids MSI asar hang)
>
> Realistic time estimate: 2-3 hours if the installer fixes are straightforward; pilot monitoring is mostly passive after deploy.

---

# Refactor Plan

**Companion to:** `audit-report.md`
**Owner:** Shalom (SolveIT Solutions)
**Goal:** Clean the live code (3 files, ~3,400 lines) so the app is ready to grow into: (a) an AI chatbot tab and (b) a thin `agent-bridge` module that communicates with the bundled `claude-computer-agent` Windows Service (which lives in its own sibling project, NOT inside this Electron app). The app must remain installable and functional after every phase.

> **Architecture note — the agent is a SEPARATE process.** The remote-control agent is its own project (`Internal/claude-computer-agent`), runs as a Windows Service (always-on, SYSTEM privileges, separate from Electron's user-session lifecycle), and is bundled with this app at installer-build time. The Electron app gets a thin local IPC client (named pipe or localhost socket) to talk to the agent — for chatbot tool dispatch and a "connected to MSP" status indicator. **No WebSocket/VPS code lives in this Electron app.**

---

## Goals

1. **Zero dead code** in `src/`. If a file isn't `require`d / `import`ed / `<script src>`'d / `<link>`'d, delete it.
2. **Zero hardcoded values** in code. All tenant identifiers, URLs, tokens, dimensions, timeouts, and UI copy live in `config/app.config.json` (or a dedicated branding file).
3. **One file, one job.** No file over 300 lines. `main.js` and `index.html` get split.
4. **Predictable folder structure** that has obvious slots for the upcoming `chatbot/` UI and `agent-bridge/` (thin local-IPC client to the separate agent service).
5. **Safe rollback at every step** — git checkpoint before each phase, smoke test after.

---

## Target Folder Structure

```
IT-Support-Client/
├── assets/                              # Unchanged — icons, images
├── build/                               # electron-builder build resources (icons, entitlements)
├── config/
│   ├── app.config.json                  # Window dims, timeouts, paths, feature flags
│   ├── branding.config.json             # Logo path, product name, colors, support URLs
│   └── zoho.config.json                 # WebToCase URL, form ID, Zoho tokens, SalesIQ widget token
├── docs/
│   ├── implementation-plan.md           # This file
│   ├── audit-report.md                  # Code audit findings
│   └── DECISIONS.md                     # Architectural decisions log
├── src/
│   ├── main/                            # Main process — Node/Electron
│   │   ├── index.js                     # Entry: app lifecycle, single-instance lock, wire-up
│   │   ├── window.js                    # createMainWindow() — uses app.config.json
│   │   ├── tray.js                      # createTray() + tray menu
│   │   ├── auto-updater.js              # electron-updater wrapper
│   │   ├── logger.js                    # Rotating file logger + console (replaces ad-hoc console.error)
│   │   ├── ipc/                         # One file per concern; index.js registers all
│   │   │   ├── index.js
│   │   │   ├── window-controls.js       # close, minimize
│   │   │   ├── system-info.js           # get-system-info, refresh-system-info
│   │   │   ├── screenshot.js            # take-screenshot, show-screenshot-in-folder
│   │   │   ├── system-tools.js          # restart, updates, network, cleanup, display, devmgr, sysinfo, sfc, dns
│   │   │   └── dialog.js                # show-message-box
│   │   ├── services/
│   │   │   ├── screenshot-service.js    # captureScreenshot() — extracted from main.js
│   │   │   ├── system-info-collector.js # Existing file, lightly cleaned
│   │   │   └── system-info.ps1          # Existing PS script
│   │   └── preload.js                   # Slimmed: only the bridges actually used
│   ├── renderer/
│   │   ├── index.html                   # ~150 lines: shell only, links CSS + JS modules
│   │   ├── styles/
│   │   │   ├── base.css                 # Reset, body, container
│   │   │   ├── header.css               # Brand header, action header, user info
│   │   │   ├── form.css                 # Zoho ticket form styling
│   │   │   ├── modal.css                # Modal shell + system info + tools
│   │   │   ├── setup-wizard.css         # Setup wizard
│   │   │   └── messages.css             # Toast / message banner
│   │   ├── views/
│   │   │   ├── setup-wizard.html        # Wizard markup, loaded as template
│   │   │   ├── ticket-form.html         # Zoho WebToCase markup (with {{tokens}})
│   │   │   ├── system-info-modal.html
│   │   │   ├── tools-modal.html
│   │   │   └── settings-modal.html
│   │   ├── scripts/
│   │   │   ├── app.js                   # Bootstrap: load config, decide setup vs main, wire modules
│   │   │   ├── config-loader.js         # Reads config from preload-exposed bridge
│   │   │   ├── modules/
│   │   │   │   ├── setup-wizard.js
│   │   │   │   ├── profile-store.js     # localStorage wrapper
│   │   │   │   ├── system-info-controller.js
│   │   │   │   ├── ticket-form.js       # Zoho form auto-fill, submission, drag/drop
│   │   │   │   ├── modals.js
│   │   │   │   ├── toast.js
│   │   │   │   ├── tools.js
│   │   │   │   └── zoho-form-helpers.js # The minified Zoho boilerplate, isolated
│   │   │   └── future/                  # Empty placeholders to make the slots obvious
│   │   │       ├── chatbot/             # AI chatbot tab UI will live here
│   │   │       └── agent-status/        # Small "connected to MSP" indicator (talks to agent-bridge)
│   └── shared/
│       └── constants.js                 # IPC channel names, event names — used by main + preload
├── package.json
├── README.md
└── CLAUDE.md
```

**Future module slots** (reserved, not built in this refactor):

- `src/main/services/agent-bridge.js` — thin local-IPC client (named pipe or localhost socket) that talks to the separate `claude-computer-agent` Windows Service. Forwards chatbot tool calls and reports connection status. **No VPS / WebSocket code here** — that lives in the agent service.
- `src/main/services/chatbot-service.js` — proxy to the LLM (via the agent service or directly if scope changes)

---

## Phased Cleanup Plan

Each phase ends with a working app and a git commit. Phases are independent — you can pause between any two.

### Phase 0 — Safety Net (S, Low risk)

| Item | Detail |
|------|--------|
| Tasks | (1) Add `backups/` to `.gitignore`; (2) Take a 7z timestamped backup of the entire project (excluding `node_modules/`, `dist/`, `backups/`); (3) Set up `docs/` structure (CLAUDE.md, docs/implementation-plan.md, docs/DECISIONS.md); (4) `git init` + initial commit `checkpoint: pre-refactor baseline`; (5) Manually launch `npm start` and verify: window opens, system info loads, take a screenshot, fill+submit a test ticket |
| Files affected | `.gitignore`, new `CLAUDE.md`, new `docs/`, new `backups/pre-refactor-baseline-*.7z` |
| Definition of done | Backup file exists; commit hash recorded; smoke test passes |
| Rollback | n/a (this IS the rollback point) |
| Effort | S |
| Risk | Low |
| Status | ✅ **Completed** (commit `60056b1`, 7z baseline `backups/pre-refactor-baseline-2026-04-19.7z`) |

### Phase 1 — Delete Dead Code (S, Low risk)

| Item | Detail |
|------|--------|
| Tasks | Delete the files below; rebuild + smoke test; commit |
| Files to delete | `src/renderer/renderer.js`, `src/renderer/style.css`, `src/renderer/scripts/app.js`, `src/renderer/scripts/screenshots.js`, `src/renderer/scripts/system-info.js`, `src/renderer/scripts/ui.js`, `src/renderer/components/setup-wizard.html`, `src/renderer/styles/main.css`, `src/renderer/styles/components.css`, `src/renderer/styles/form.css`, `src/main/screenshot-manager.js`, `src/main/system-tools-manager.js`, `src/integrations/zoho-desk.js`, `src/integrations/zoho-salesiq.js`, `src/main/Onboardingchecklist_Report.pdf`, empty `src/utils/` |
| Folders to delete after | `src/renderer/scripts/`, `src/renderer/styles/`, `src/renderer/components/`, `src/integrations/`, `src/utils/` |
| Definition of done | `npm start` works exactly as before; `dir src` shows only `assets/`, `main/`, `renderer/`; commit `chore: remove confirmed dead code (~3,200 lines)` |
| Rollback | `git checkout HEAD~1 -- src/` |
| Effort | S |
| Risk | Low — dead-code status verified by grep |
| Status | ✅ **Completed** — deleted 15 files + 5 empty folders, codebase 9,497 → 3,399 lines (–64%). Live src is now: `src/main/{main.js,preload.js,system-info-collector.js,system-info.ps1}`, `src/renderer/index.html`, `src/assets/icons/Logo.png` |

### Phase 2 — Extract Inline JS from `index.html` into Modules (L, Medium risk)

This is the biggest phase. Do it in sub-steps, commit between each.

| Sub-step | Detail |
|----------|--------|
| 2a | Create `src/renderer/scripts/` folder structure shown above. Copy the entire inline `<script>` block from `index.html:1155-2116` to a temp file as the source of truth. |
| 2b | Extract minified Zoho boilerplate (`index.html:1158-1185`) → `scripts/modules/zoho-form-helpers.js`. Reference it from `index.html` via `<script src=...>`. Smoke test (file upload, form submit). Commit. |
| 2c | Extract `SolveITSupportApp` class (`index.html:1188-2087`) → split into the 7 modules listed in the folder tree. Each module exports a class or factory. `scripts/app.js` is the bootstrap that constructs them in order. |
| 2d | Wire renderer with `<script type="module" src="./scripts/app.js"></script>` (Electron renderer supports ES modules with `nodeIntegration: false`). |
| 2e | Smoke test full flow: setup wizard → main UI → system info modal → screenshot → ticket submission. Commit `feat: extract inline JS into modular scripts`. |
| Files affected | `src/renderer/index.html` (shrinks from 2,117 to ~150 lines), new `src/renderer/scripts/**` |
| Definition of done | `index.html` contains only markup + `<link>`/`<script>` tags + the Zoho hosted-script loader; full smoke test passes |
| Rollback | `git revert <phase-2 commits>` — each sub-step is its own commit |
| Effort | L |
| Risk | Medium — moving 960 lines of stateful UI code; module load order matters |
| Status | ✅ **Completed** — index.html shrank from 2,117 → 1,158 lines. Modules: app.js (bootstrap), toast.js, profile-store.js, system-info-controller.js, modals.js, ticket-form.js, tools.js, setup-wizard.js, zoho-form-helpers.js. Smoke test confirmed system info IPC working. |

### Phase 3 — Extract Inline CSS into Stylesheets (M, Low risk)

| Item | Detail |
|------|--------|
| Tasks | (1) Create `src/renderer/styles/` with the 6 files listed in the folder tree; (2) Move the inline `<style>` block at `index.html:12-817` into those files, grouping by section (base/header/form/modal/wizard/messages); (3) Replace the inline `<style>` with 6 `<link rel="stylesheet">` tags; (4) Smoke test visual diff — open every modal, verify header and form look identical |
| Files affected | `index.html`, new `src/renderer/styles/**` |
| Definition of done | No `<style>` block remains in `index.html`; visual diff matches baseline screenshots |
| Rollback | `git revert` |
| Effort | M |
| Risk | Low — CSS doesn't break logic, only visuals |

### Phase 4 — Move Hardcoded Values to Config (M, Medium risk)

| Item | Detail |
|------|--------|
| Tasks | (1) Create `config/app.config.json`, `config/branding.config.json`, `config/zoho.config.json` with the values inventoried in audit-report §2.1 and §2.2; (2) In main process: `require('../../config/app.config.json')` at top of `window.js`, `tray.js`, `auto-updater.js`, `services/screenshot-service.js`, `services/system-info-collector.js`; (3) In preload: expose `getConfig()` bridge that returns a frozen, sanitized subset (NO secrets to renderer that aren't already public — Zoho widget token IS public so OK); (4) In renderer: `config-loader.js` calls `window.electronAPI.getConfig()` once, distributes to modules; (5) `views/ticket-form.html` becomes a template with `{{ZOHO_FORM_ID}}`, `{{ZOHO_XNQS}}`, `{{ZOHO_XMIWT}}`, `{{WEBTOCASE_URL}}` interpolated by `ticket-form.js` at boot; (6) Update electron-builder `files:` glob to include `config/**` |
| Config keys | `app.window.width/height/minWidth/etc`, `app.window.position`, `app.timeouts.psScript/exec`, `app.paths.screenshotDirName/appDataFolderName`, `app.screenshot.resolutions[]`, `app.attachments.maxCount/maxSizeMB/blockedExtensions[]`, `app.toast.durationMs`, `branding.productName/tagline/logoPath/trayTooltip`, `branding.colors.primary/etc`, `zoho.salesiqWidgetToken`, `zoho.webToCaseUrl`, `zoho.formId`, `zoho.tokens.xnQsjsdp/xmIwtLD`, `zoho.cdn.jqueryEncoderUrl` |
| Files affected | All live source files |
| Definition of done | Grep for the old hardcoded literals returns zero hits in `src/`; smoke test passes; config file changes alone (no code) can rebrand the app |
| Rollback | `git revert` (commits per sub-step recommended) |
| Effort | M |
| Risk | Medium — many touchpoints; one missed reference = silent broken feature. Mitigation: do it module-by-module with smoke test after each |

### Phase 5 — Fix Real Issues (M, Low–Medium risk)

| Item | Detail |
|------|--------|
| Tasks | Address SEC and Major findings from audit: |
| 5.1 | **SEC1:** Bump `electron` from `^27.0.0` to current LTS (32+); `electron-builder` to latest; run `npm install`; rebuild; smoke test |
| 5.2 | **SEC2:** Replace `innerHTML +=` patterns at `index.html:1729-1742` and the description-builder at `1843-1894` with DOM building (`textContent` / `createElement`) |
| 5.3 | **SEC8:** Set up Authenticode code-signing for the EXE/MSI/NSIS installers; flip `verifyUpdateCodeSignature: true`. (If signing not yet available, document the deferral in DECISIONS.md but DO sign before next release) |
| 5.4 | **SEC10:** Add log rotation in `logger.js` (max 5 MB, keep last 3 files) |
| 5.5 | **C13:** Replace the `mode: 'no-cors'` blind-success pattern. Either: (a) move submission to a server-side proxy that returns real status, or (b) accept the limitation and change the success dialog to "Submission sent — check email for confirmation" |
| 5.6 | **C18, A8, A9, C17:** Delete dead preload surface (`zohoAPI`, `appUtils`, `checkSystemInfoStatus`, the `delete window.require/exports/module` lines), delete the obsolete `new-window` listener at `main.js:329-334` |
| 5.7 | **A6, C5:** Delete the dead WMIC parser helpers (`parseWMICValue`, `parseWMICMultipleValues`, `parseRAMSlots`, `parseGPUInfo`) from `system-info-collector.js` |
| 5.8 | **A5:** Stop the eager `getSystemInfo()` call at `main.js:298-310`; let the renderer trigger it after the window shows |
| 5.9 | **C7:** Cache the `.asar`-extracted PS script path in `system-info-collector.js` so re-extraction only happens when the script's mtime changes |
| 5.10 | **H20:** Reconcile attachment limit — pick 5, update `zsAllowedAttachmentLimit` and the inline copy to match |
| Files affected | `package.json`, `main.js` → `src/main/**`, `system-info-collector.js`, renderer modules |
| Definition of done | All §2.5 SEC items resolved or documented; all Major findings closed; smoke test passes on a fresh Win10 + Win11 VM if available |
| Rollback | Per-fix commits |
| Effort | M |
| Risk | Low–Medium (Electron major-version bump can surface API removals — that's why this is its own phase, post-restructure) |

### Phase 6 — Tooling (S, Low risk)

| Item | Detail |
|------|--------|
| Tasks | (1) Add `eslint` (recommended + electron rules) + `eslint-config-prettier`; (2) Add `prettier` with a project `.prettierrc`; (3) Add a `lint` and `format` script to `package.json`; (4) Add a Husky `pre-commit` hook that runs `eslint --max-warnings=0` on staged JS files; (5) Run `npm run format` once across the whole `src/` and commit |
| Files affected | `package.json`, new `.eslintrc.json`, `.prettierrc`, `.husky/pre-commit` |
| Definition of done | `npm run lint` returns 0 errors; commit is blocked when a staged file has lint errors |
| Rollback | Remove tooling; revert formatted commit |
| Effort | S |
| Risk | Low |

### Phase 7 — Smoke Test, Build, Deploy (S, Low risk)

| Item | Detail |
|------|--------|
| Tasks | (1) Full manual smoke test on developer machine; (2) `npm run build-win` produces msi/nsis/portable artifacts; (3) Install the NSIS build on a clean Windows VM (or fresh user profile); (4) Run setup wizard, submit a test ticket end-to-end (verify it lands in Zoho Desk), take a screenshot, run each Quick Tool button; (5) Tag release `v2.0.0` (or whatever the version-bump dictates); (6) Publish to GitHub releases (electron-updater publish provider); (7) Roll out to a 2-3 client pilot before mass deploy |
| Files affected | None (build artifacts only) |
| Definition of done | Pilot installs run for 48h with no error reports |
| Rollback | electron-updater serves the previous tag; uninstall + reinstall the prior MSI |
| Effort | S |
| Risk | Low (assuming Phases 0–6 each ended green) |

---

## Total Effort & Order

| Phase | Effort | Risk | Status |
|-------|--------|------|--------|
| 0 — Safety net | S | Low | ✅ Completed |
| 1 — Delete dead code | S | Low | ✅ Completed |
| 2 — Extract inline JS | L | Medium | ✅ Completed |
| 3 — Extract inline CSS | M | Low | ✅ Completed |
| 4 — Move hardcoded values to config | M | Medium | ✅ Completed |
| 5 — Fix real issues | M | Low–Medium | Pending |
| 6 — Tooling (ESLint, prettier, husky) | S | Low | ✅ Completed |
| 7 — Smoke test, build, pilot deploy | S | Low | Pending |

**Recommended order:** strictly 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7. Phase 1 unblocks Phase 2 (no confusion about which files matter). Phase 4 depends on Phase 2 (modules need a target to import config into). Phase 5's Electron upgrade is safer once the structure is clean.

**After Phase 7,** the codebase is ready for:

1. `src/main/services/agent-bridge.js` — thin local-IPC client to the bundled `claude-computer-agent` service. The agent service itself (WebSocket → VPS, command execution, audit log) is built in the sibling project `Internal/claude-computer-agent/` and is bundled into this installer at build time.
2. `src/renderer/scripts/future/chatbot/` — promote from placeholder; add a "Chat" tab next to the ticket form. The chatbot dispatches tool calls through `agent-bridge` to the agent service.

Each is a clean, additive feature instead of "more code wedged into a 2,117-line HTML file."

---

*See `audit-report.md` for the findings this plan is based on.*
