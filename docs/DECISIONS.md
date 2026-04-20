# Architectural Decisions

## D1 — Build on top of existing app, don't rewrite (2026-04-19)

**Context:** Discovered the existing Electron app is ~50% dead code with no git history, no tests, no config layer. Question: rewrite or refactor?

**Decision:** Refactor. The live code (`main.js`, `preload.js`, `system-info-collector.js`, `index.html`) is solid and already deployed to ~50-80 production PCs.

**Why:** Throwing it out wastes proven infrastructure (electron-builder pipeline, auto-updater wired to GitHub, system-info collector with PS+Node fallback, working Zoho WebToCase form). Refactor risk is much lower than rewrite risk for a deployed app.

**Plan:** 8-phase refactor in `docs/implementation-plan.md`.

---

## D2 — Agent is a SEPARATE project, not a folder in this Electron app (2026-04-19)

**Context:** Initial refactor plan reserved `src/main/remote-agent/` for the upcoming remote-control feature. That's wrong.

**Decision:** The remote-control agent is its own sibling project at `Internal/claude-computer-agent/`, runs as a Windows Service (always-on, SYSTEM privileges), bundled with this Electron app at installer-build time. The Electron app only gets a thin `src/main/services/agent-bridge.js` to talk to the local agent over named pipe / localhost socket.

**Why:** The agent needs to run when no user is logged in, survive Electron app crashes, and have SYSTEM privileges. None of that is possible inside Electron's user-session lifecycle. Industry standard (NinjaOne, ScreenConnect, Atera) all separate agent service from UI app.

**Implication:** No WebSocket / VPS code lives in this Electron repo. Agent connection logic, command dispatch, audit log — all in the agent project.

---

## D3 — Strict phase order, smoke-test gating (2026-04-19)

**Context:** Refactor touches both main process and renderer, plus an Electron major-version bump.

**Decision:** Phases run strictly 0 → 7. App must launch and pass smoke test (window opens, system info loads, screenshot works, ticket submits) before moving to next phase. Each phase ends with a git commit.

**Why:** This app is in production. Any phase that breaks the build blocks the next one. Per-phase commits give granular rollback.

---

## D4 — Config layer split into 3 files (2026-04-19)

**Context:** ~27 hardcoded values catalogued in audit (window dims, Zoho IDs, paths, timeouts, copy strings).

**Decision:** Three config files in `config/`:
- `app.config.json` — runtime behavior (window, timeouts, paths, screenshot resolutions)
- `branding.config.json` — product name, logo path, colors, support URLs
- `zoho.config.json` — Zoho tenant identifiers (form ID, tokens, widget ID, WebToCase URL)

**Why:** Splitting by concern makes whitelabel/fork trivial — change `branding.config.json` and `zoho.config.json` to deploy this app for a different MSP. App config (`app.config.json`) stays the same.

---

## D5 — Don't bypass pre-commit hooks (2026-04-19)

**Context:** Pre-commit hook blocks commits when code changes aren't accompanied by a docs update.

**Decision:** Always update `docs/implementation-plan.md` (or other docs) when committing code. Never use `--no-verify`.

**Why:** Shalom relies on docs to track state across sessions (he doesn't read code). The hook enforces this discipline. Skipping it = silent doc drift.
