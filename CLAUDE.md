# IT-Support-Client — Project Context

## What this is

Desktop Electron app installed on ~50-80 client PCs (Shalom's MSP customers). Two jobs:

1. **Submit support tickets to Zoho Desk** via embedded WebToCase form (with auto-attached system info + screenshots)
2. **Quick-access Windows utilities** — disk cleanup, Windows Update, network settings, restart, screenshot capture

Currently in production as `solveit-support-client` v1.0.0. Auto-updates from `github.com/solveitsolutions/support-client` releases.

## What we're doing now

**Refactoring** — see `docs/implementation-plan.md`. The codebase has ~3,165 lines of dead code (never loaded but ships in the asar) and the live code (~3,400 lines) has hardcoded values everywhere. Cleanup before we layer on the next two features.

**Next two features** (separate planning sessions):

1. **AI chatbot tab** — end-user-facing, restricted-tool whitelist (winget install for v1)
2. **Agent bridge** — thin local-IPC client to a separate Windows Service (`Internal/claude-computer-agent`) that gives Shalom remote shell access via Claude Code

The agent service is a SEPARATE project bundled into this installer at build time. No WebSocket/VPS code lives in this Electron app.

## Tech stack

| Layer | Choice |
|-------|--------|
| Runtime | Electron 27 (will bump to 32+ in Phase 5) |
| UI | Vanilla HTML/CSS/JS — no framework |
| Build | electron-builder (MSI + NSIS + portable EXE) |
| Auto-update | electron-updater → GitHub releases |
| System info | PowerShell WMI + Node.js `os` fallback |
| Ticket submission | Zoho Desk WebToCase iframe (hosted form, direct submit) |
| Live chat | Zoho SalesIQ widget (hosted) |

## File structure (after refactor — see plan for current state)

```
config/                  # All hardcoded values live here
src/main/                # Main process — split per concern
  ├── ipc/               # IPC handlers
  ├── services/          # screenshot, system-info, auto-updater, future agent-bridge
  └── ...
src/renderer/            # Renderer split into views/styles/scripts/modules
src/shared/              # Constants used across processes
docs/                    # implementation-plan.md, audit-report.md, DECISIONS.md
backups/                 # 7z snapshots (gitignored)
```

## Key decisions

See `docs/DECISIONS.md`.

## Don'ts

- **Don't** merge agent code into this project — agent is a separate Windows Service
- **Don't** add features wedged into the monolithic `index.html` — wait for Phase 2 to finish (extract inline JS)
- **Don't** commit hardcoded values — they go in `config/*.json`
- **Don't** skip the smoke test after each phase — this app is in production on real client PCs
- **Don't** bypass the pre-commit hook (use `--no-verify`) — fix the underlying issue

## How to run / build

```bash
npm install                # First time
npm start                  # Dev launch
npm run build-win          # Build MSI + NSIS + portable
```
