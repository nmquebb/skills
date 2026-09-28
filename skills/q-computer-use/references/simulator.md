# Device Hub and Simulator Reference

Host and simulator interaction needs macOS. `<skill-dir>` is the directory containing this
skill's SKILL.md.

## Choose native evidence

For native journey proof, run the project's committed native journey runner named in its testing
guidance (`conventions.testing`) or `AGENTS.md`, from the location it names. The runner owns its
isolated backend, simulator, and artifacts; follow that guidance for prerequisites, skips, and the
artifact verdict. Do not turn a missing local tool into a passing journey or install it to bypass a
failed preflight.

For exploratory inspection, use an already running development stack and the host interaction
recipes below. Record processes you start and clean them up. Never push a feature worktree's schema
into a shared development database or clear shared authentication or rate-limit state for an
inspection.

## simctl cookbook

`<bundle-id>` is the app under test (Expo Go example: `host.exp.Exponent`); the doctor's
`--app <bundle-id>` confirms it is installed.

| Goal | Command |
| --- | --- |
| Booted devices | `xcrun simctl list devices booted -j` |
| Open a screen | `xcrun simctl openurl <udid> "<deep-link>"`; Expo Go example: `exp://<lan-ip>:8081/--/<route>`, where `ipconfig getifaddr en0` gives the LAN IP |
| Background then foreground | `xcrun simctl terminate <udid> <bundle-id>` and `xcrun simctl launch <udid> <bundle-id>` |
| Screenshot | `xcrun simctl io <udid> screenshot <path>` |
| Video | `xcrun simctl io <udid> recordVideo <path>` (stop with Ctrl-C) |
| Skip a permission dialog | `xcrun simctl privacy <udid> grant photos <bundle-id>` |
| Clean status bar | `xcrun simctl status_bar <udid> override --time 9:41 --batteryLevel 100` |
| Dark appearance | `xcrun simctl ui <udid> appearance dark` |
| Long text | `printf 'text' \| xcrun simctl pbcopy <udid>` then paste in the app |
| Device logs | `xcrun simctl spawn <udid> log stream --predicate 'subsystem contains "<subsystem>"'` (Expo Go example: `host.exp`) |
| Push | `xcrun simctl push <udid> <bundle-id> payload.json` |

`simctl` has no tap or text command; use the host-specific input route below or installed idb.

## Device Hub interaction

After the doctor passes, open its reported host path if needed:

```sh
open "$(xcode-select -p)/../Applications/DeviceHub.app"
xcrun simctl list devices booted -j
```

Select the host in the computer-use tool by its bundle ID, `com.apple.dt.Devices`. With Codex
Computer Use:

```javascript
let deviceHub = await cua.getApp("com.apple.dt.Devices");
```

Match the selected device's name and runtime to the intended simulator UDID before interaction.
Prefer controls in the returned accessibility tree. After each action, refresh the accessibility
state (Codex Computer Use: `await deviceHub.getAXState()`) and use the refreshed indices for the
next action. If the control is absent from that tree, inspect a fresh Device Hub screenshot before
using host coordinates. `simctl` screenshots use device pixels, not Device Hub window coordinates;
never feed them into host clicks or apply the old Simulator toolbar offsets.

Keep `simctl` for deep links, lifecycle operations, screenshots, and recordings. Prove an input
worked by observing its expected screen or state change, then capture the device. A successful click
call or readable accessibility tree alone proves nothing.

If an earlier doctor reported a lock or missing window but the user reports Device Hub available,
rerun the doctor and inspect the current host before requesting intervention; an old console flag
is not current state. A missing Simulator.app under Xcode 27 is expected, not a reason to reinstall
Xcode or request new privacy grants.

## Coordinate model used by sim-tap.sh (legacy Simulator only)

System Events reports the Simulator window as `position {x, y}` and `size {w, h}` in screen
points. The device content is aspect-fitted below a title chrome of `SIM_TOP_CHROME` points
(default 52) and centred in the remainder:

```text
scale = min((h - top) / device_px_h, w / device_px_w)
origin = (x + (w - device_px_w * scale) / 2, y + top + ((h - top) - device_px_h * scale) / 2)
screen = origin + device_px * scale
```

Run `bash <skill-dir>/scripts/sim-tap.sh <udid> calibrate` and tap one known control before a
journey; a 20 px error silently misses small buttons. The script recalibrates on every call, so do
not copy its numbers into guidance.

## Host interaction gotchas

- Idle display sleep locks the session within seconds (even with password-after-sleep off) and hides
  every host window from System Events while `simctl` screenshots still work.
  `caffeinate -d -u -t <seconds>` wakes the display, clears that lock without a password, and keeps
  the window addressable; `caffeinate -d` alone cannot wake an already-slept display. A lock
  reported while the display is on is a real user lock: ask for an unlock, change no security
  settings, and continue only independent daemon or headless evidence, without claiming it proves
  touch.
- With no attached display (KVM switched away, monitor unplugged) no assertion or setting restores
  input; the remedy is a headless display adapter on a spare port. The doctor reports
  `display:connected`.
- Development-client overlays are not app controls. Expo Go note: the blue gear at its top right is
  the dev-menu button; close the dev-menu sheet with its X, never Escape.
- Zero windows does not say why. Once the console is awake and unlocked, check whether the device
  window is on another Space, minimized, or closed.
- Legacy Simulator only: `open -a Simulator --args -CurrentDeviceUDID <udid>` or the Window menu
  entry named after the device can restore the window. Its System Events accessibility tree is
  intermittent and `AXManualAccessibility` cannot be enabled; do not build on it.
- Synthetic input goes to the frontmost app: a keystroke sent while a terminal is frontmost lands
  there, and an Escape cancels the agent's own tool call and looks like a permission denial.
- Screenshot pixels are device pixels, not screen points; never mix them.
- Scripting Finder or any app without an Automation grant blocks on a consent prompt; wrap every
  `osascript` in a timeout.

## idb (optional)

When `doctor.sh` reports `bin:idb`, prefer device-scoped input: `idb ui tap <x> <y>` in device
points, `idb ui text "<string>"`, and `idb ui describe-all` for the on-device accessibility tree. It
does not need the Simulator window frontmost. Installing it is a separate user decision.
