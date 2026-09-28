---
name: q-computer-use
description: "Obtain running-app evidence: Xcode Device Hub and iOS Simulator journeys and captures, authenticated local web apps, and macOS dialogs. Use for device, simulator, browser, screenshot, recording, or desktop tasks and computer-use failures such as missing windows, cgWindowNotFound, or assistive-access errors. Host and simulator interaction is macOS-only; web evidence through Playwright works on any platform."
license: MIT
---

# Q Computer Use

Get observable evidence from the running app without ad hoc installs, guessed coordinates, or input
into the wrong window. The same rules apply to Claude Code, Codex, and pi sessions, for lifecycle
and ordinary work alike. Host and simulator interaction needs macOS; web evidence through
Playwright works on any platform.

This skill stands alone. When present, read `.agents/q/config.yaml` for `conventions.testing`,
`agents.launcher`, and `agents.routes.evidence`, and the addendum `.agents/q/computer-use.md`.
Precedence: user direction, then the addendum, then the config, then project guidance (`AGENTS.md`
and its testing guides), then these defaults. When the q suite is installed,
[config](../q-workflow/references/config.md) and
[orchestration](../q-workflow/references/orchestration.md) hold optional detail.

## Run the doctor before manual interaction

```sh
bash <skill-dir>/scripts/doctor.sh simulator   # or web, all
```

`<skill-dir>` is the directory containing this SKILL.md. Append `--app <bundle-id>` to check the
app under test on each booted simulator, and `<port>:<name>` pairs from project guidance (such as
`8081:metro 3000:api`) to report local listeners. Off macOS the doctor reports `platform` missing
for `simulator` and still runs the `web` checks.

For committed browser and native journey proof, run the project's committed journey runners named
in its testing guidance (`conventions.testing`) or `AGENTS.md`. The runners own isolated
infrastructure, identities, prerequisites, artifacts, and cleanup. Use this skill for exploratory
UI inspection, for journeys no committed runner covers, and for host interaction outside those
runners.

Treat each required `missing` or `unknown` capability as the affected manual interaction's
blocker and remedy (simulator covers host input; web covers the Playwright route's headless browser
prerequisites, so they block only that route, not a working host browser tool).
macOS privacy grants belong to the app that spawned the session (the terminal, IDE, or agent host,
such as Terminal, Cursor, or Paseo.app; the doctor's `responsible-app` line names it), never to
the agent CLI (`claude`, `codex`, `pi`); a computer-use tool's own client may need separate Screen
Recording and Accessibility grants (see [Host notes](#host-notes)). Report a missing grant, SDK, or
window as `blocked: <remedy>` and stop that interaction. Independent daemon screenshots, logs, and
headless checks may continue when their own prerequisites hold, but they do not prove a tap or
native transition. Never edit privacy or security settings, reset grants, or install software to
get past a doctor failure.

Before the first host input, start `caffeinate -d -u -t <journey seconds> &` (default 1500) from
the session that drives the host, record its PID, and let it expire or stop it at cleanup. Idle
display sleep locks the session within seconds and hides every window from synthetic input; the
guard wakes and holds the display, and rerunning the doctor proves the window is back. It cannot
replace a display: with the KVM switched away or the monitor unplugged, only a headless display
adapter keeps input possible.

## Choose the surface

| Need | Use first | Fallback |
| --- | --- | --- |
| Exploratory iOS behavior, native confirmations, hosted checkout sheet | `xcrun simctl` for everything except touch; a computer-use tool for Device Hub input; `sim-tap.sh` for legacy Simulator input | `idb ui tap` and `idb ui describe-all` when idb is installed |
| Exploratory web screenshot or DOM inspection | The host's browser tool or Playwright per [web-evidence.md](references/web-evidence.md) | Playwright when a hosted browser cannot reach `localhost` |
| Menus and dialogs of a macOS app | System Events named elements (`click menu item`, `click button`) | `cliclick` only through the same activation guard `sim-tap.sh` applies |
| Servers, logs, terminals | Shell, `docker logs`, the launcher's terminal tools, `xcrun simctl spawn <udid> log stream` | Never type into a terminal window |

### Host notes

- **Codex:** Codex Computer Use is the computer-use tool. Its Screen Recording and Accessibility
  grants belong to the "Codex Computer Use" app, separate from the session's; without them it fails
  with `cgWindowNotFound` or `-1728`. The doctor's `codex-cua` line reports whether it is
  installed. Codex Browser Use is the browser tool.
- **Claude Code:** Claude in Chrome (`claude --chrome`) is the browser tool. Host input comes from
  a computer-use tool the session exposes (such as an MCP server); otherwise use the shell routes,
  which inherit the spawning app's grants.
- **pi:** no built-in computer-use or browser tool. Use shell-driven routes (`xcrun simctl`,
  `sim-tap.sh`, idb, Playwright through the project's installed dependencies), or delegate through
  the launcher to a host that has one.

## Drive iOS through Device Hub

Use **Device Hub** for iOS visual verification; read the doctor's `simulator:host` before choosing
an input tool. Xcode 27's Device Hub (`com.apple.dt.Devices`) lives at
`$(xcode-select -p)/../Applications/DeviceHub.app`; open that path, not `open -a Simulator`. Use a
computer-use tool to select the device and act on observed accessibility elements or a fresh host
screenshot. Device Hub does not use the old Simulator coordinate model, and `sim-tap.sh` refuses
input there; without a computer-use tool, use idb when the doctor reports it, else report Device
Hub input as blocked. Read the
[Device Hub interaction recipe](references/simulator.md#device-hub-interaction) before collecting
touch evidence. Use legacy Simulator instructions only when the doctor detects that host.

Always pass the UDID from `xcrun simctl list devices booted -j`. `simctl` works independently of
the host for deep links, foreground/background, screenshots, recordings, and UI-free setup; see the
[simctl cookbook](references/simulator.md#simctl-cookbook).

- Legacy Simulator touch: `bash <skill-dir>/scripts/sim-tap.sh <udid> tap <x> <y>` with device
  pixels from the latest screenshot. The script activates Simulator, refuses to act unless it is
  frontmost, maps pixels to points from live window bounds, acts once, waits, and prints the
  resulting screenshot path. `swipe` and `text` share the guard; verify `calibrate` on one known
  control before a journey.
- Never send Escape or keystrokes through System Events; use the native control or an observed
  dismissal gesture. Termination and deep links can reset a journey but cannot prove the native Done
  action, browser return, or its refresh behavior.

[simulator.md](references/simulator.md) covers exploratory host interaction, the coordinate model,
and idb.

## Delegate device and browser evidence

Delegate a sustained visual journey (more than a few taps, or any screenshot interpretation loop) so
captures stay out of the owner's context and stray input cannot cancel the owner's tool call. Never
delegate logs, shell commands, or one screenshot.

Route: `agents.routes.evidence` through `agents.launcher` (default `native`, the host's own
subagent tool); unset, a fresh agent with computer or browser tools on the launcher's default
model. Give the worker the least-privileged mode that still runs its shell commands and host input
without approval prompts, and only in a workspace it may change. Prefer a
worker with a computer-use tool (see [Host notes](#host-notes)). When none is available, fall back
to a worker that inherits the spawning app's grants and drives `sim-tap.sh` against the legacy
Simulator; that fallback does not support Device Hub, so report the missing capability there
instead. Record which route ran and why; do not switch routes because one run failed.

Delegate sustained exploratory web inspection the same way, to a worker with a browser tool. When
that tool cannot reach the local server, the worker uses Playwright per
[web-evidence.md](references/web-evidence.md); the display guard does not apply.

Without a subagent tool (pi without an extension that adds one), run the journey yourself under the
same contract, budget, and result table, and record that it was not delegated.

The caller supplies: checkout path and commit; simulator UDID or URL; which running processes to
use; the test identity; a numbered acceptance table (route or deep link, action, expected
observable, independent oracle); permitted data changes; out-of-scope items; a budget
(default 20 minutes, 40 UI actions, two attempts per failed action); the display guard's PID and
expiry; and the artifact directory.

The worker returns one table and no inline images:

| Criterion | Expected | Observed | Evidence | Result |
| --- | --- | --- | --- | --- |
| Native confirmation appears | Approved copy, both choices | Dialog visible | `<path>`, UTC time, commit | proven |
| Foreground refresh | Fresh read after return | Last-checked advanced | ordered captures | proven, unproven, or blocked |

It adds the exact commands used, runtime residue and cleanup, and every blocker as a named remedy.
"Tapped successfully" is not evidence; the expected transition is. The owner projects the table into
the ledger or pull request and keeps the acceptance decision.

## Evidence and cleanup

- Write captures under `/tmp/q-evidence/<slug>/`, where `<slug>` names the delivery or task in
  kebab-case (set `SIM_EVIDENCE_DIR` to it for `sim-tap.sh`); never commit them. Before attaching a
  frame anywhere, check it for one-time codes, session cookies, one-use payment or hosted-checkout
  URLs, and unrelated windows.
- Report each criterion as proven, unproven, or blocked. iOS evidence never closes an Android
  criterion; a fixture capture never proves a real provider journey.
- Stop the affected interaction at a permission error, missing SDK, missing fixture, focus loss, or
  the budget, and return the smallest intervention, not a longer tooling campaign.
- Leave no residue from manual inspection: stop every process you started, confirm its ports are
  free, and revert any generated file change it caused. Never push a feature worktree's schema into
  a shared development database or clear shared authentication or rate-limit state to force a
  retry.
