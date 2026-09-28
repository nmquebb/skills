#!/usr/bin/env bash
# Send one guarded input to the iOS Simulator window and capture the result.
#
#   sim-tap.sh <udid> calibrate
#   sim-tap.sh <udid> tap <x> <y> [out.png]
#   sim-tap.sh <udid> swipe <x1> <y1> <x2> <y2> [out.png]
#   sim-tap.sh <udid> text "<string>" [out.png]
#   sim-tap.sh <udid> screenshot [out.png]
#
# Coordinates are device pixels as read from an `xcrun simctl io <udid> screenshot` capture. The
# script activates Simulator, refuses to act unless Simulator is frontmost, maps pixels to screen
# points from the live window bounds, performs one action, waits, and writes a screenshot. It never
# sends Escape or other keystrokes through System Events. Requires macOS, cliclick, and
# Accessibility for the application that spawned this process (see doctor.sh). Legacy Simulator
# only: input is refused when the selected Xcode uses Device Hub.
#
# Env: SIM_TOP_CHROME (window title/toolbar height in points, default 52), SIM_SETTLE (seconds to
# wait before the capture, default 1.5), SIM_EVIDENCE_DIR (default /tmp/q-evidence; set it to
# /tmp/q-evidence/<slug> for a journey).

set -eu

[ "$(uname -s)" = "Darwin" ] || { echo "sim-tap: macOS only (iOS Simulator host input); this host is $(uname -s)" >&2; exit 1; }

udid="${1:-}"
action="${2:-}"
[ -n "$udid" ] && [ -n "$action" ] || { sed -n '2,10p' "$0" >&2; exit 2; }
shift 2

top_chrome="${SIM_TOP_CHROME:-52}"
settle="${SIM_SETTLE:-1.5}"
evidence_dir="${SIM_EVIDENCE_DIR:-/tmp/q-evidence}"
mkdir -p "$evidence_dir"

fail() { echo "sim-tap: $1" >&2; exit 1; }
with_timeout() { perl -e 'alarm shift; exec @ARGV' "$@"; }

command -v cliclick >/dev/null 2>&1 || fail "cliclick missing; remedy: brew install cliclick"
xcrun simctl list devices booted -j | grep -q "\"udid\" : \"$udid\"" || fail "$udid is not booted; remedy: xcrun simctl list devices booted"

device_name="$(xcrun simctl list devices -j | python3 -c '
import json, sys
udid = sys.argv[1]
for devices in json.load(sys.stdin)["devices"].values():
    for device in devices:
        if device["udid"] == udid:
            print(device["name"])
' "$udid")"

capture() {
  local out="${1:-$evidence_dir/$(date -u +%Y%m%dT%H%M%SZ)-$action.png}"
  xcrun simctl io "$udid" screenshot "$out" >/dev/null 2>&1 || fail "screenshot failed for $udid"
  echo "$out"
}

if [ "$action" = "screenshot" ]; then
  capture "${1:-}"
  exit 0
fi

developer_dir="$(xcode-select -p)"
if [ -d "$developer_dir/../Applications/DeviceHub.app" ]; then
  fail "Xcode uses Device Hub; send input with a computer-use tool (such as Codex Computer Use) on com.apple.dt.Devices, or idb. Simulator window geometry does not apply. simctl screenshots and deep links still work."
fi

# Device pixel size from a fresh capture; it doubles as the "before" frame.
before="$(capture "$evidence_dir/$(date -u +%Y%m%dT%H%M%SZ)-before.png")"
read -r dev_w dev_h <<< "$(sips -g pixelWidth -g pixelHeight "$before" | awk '/pixelWidth/ {w=$2} /pixelHeight/ {h=$2} END {print w, h}')"

# Bring Simulator forward and refuse to continue unless it owns the keyboard and pointer.
with_timeout 5 osascript -e 'tell application "Simulator" to activate' >/dev/null 2>&1 || fail "could not activate Simulator (Automation grant for the responsible app?)"
sleep 0.4
front="$(with_timeout 5 osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true' 2>/dev/null || true)"
[ "$front" = "Simulator" ] || fail "Simulator is not frontmost (frontmost: '${front:-unknown}'); refusing to send input"

# Exactly one window must belong to this device: its title is the device name, alone or followed by
# " – <runtime>". Never fall back to another window; input there would reach the wrong device.
bounds="$(with_timeout 5 osascript - "$device_name" 2>/dev/null <<'APPLESCRIPT' || true
on run argv
  set deviceName to item 1 of argv
  tell application "System Events" to tell process "Simulator"
    set matches to {}
    repeat with w in windows
      set t to name of w
      if t is deviceName or t starts with (deviceName & " – ") or t starts with (deviceName & " - ") then
        set end of matches to w
      end if
    end repeat
    if (count of matches) is not 1 then return "count:" & (count of matches)
    set target to item 1 of matches
    perform action "AXRaise" of target
    delay 0.2
    set {x, y} to position of target
    set {w, h} to size of target
    return (x as text) & " " & (y as text) & " " & (w as text) & " " & (h as text)
  end tell
end run
APPLESCRIPT
)"
case "$bounds" in
  "" | count:0) fail "no Simulator window for '$device_name' on this Space; remedy: open -a Simulator --args -CurrentDeviceUDID $udid, or move the window to this Space" ;;
  count:*) fail "${bounds#count:} Simulator windows match '$device_name'; close the others or give the devices distinct names before sending input" ;;
esac
read -r win_x win_y win_w win_h <<< "$bounds"

# Aspect-fit model: content sits below the title chrome, centred in the remaining rectangle.
read -r scale x0 y0 <<< "$(python3 -c '
import sys
win_x, win_y, win_w, win_h, top, dev_w, dev_h = map(float, sys.argv[1:])
scale = min((win_h - top) / dev_h, win_w / dev_w)
content_w, content_h = dev_w * scale, dev_h * scale
x0 = win_x + (win_w - content_w) / 2
y0 = win_y + top + ((win_h - top) - content_h) / 2
print(f"{scale:.5f} {x0:.2f} {y0:.2f}")
' "$win_x" "$win_y" "$win_w" "$win_h" "$top_chrome" "$dev_w" "$dev_h")"

to_screen() { python3 -c 'import sys; x0,y0,s,x,y=map(float,sys.argv[1:]); print(f"{round(x0+x*s)},{round(y0+y*s)}")' "$x0" "$y0" "$scale" "$1" "$2"; }

case "$action" in
  calibrate)
    echo "device $device_name ${dev_w}x${dev_h}px; window ${win_x},${win_y} ${win_w}x${win_h}pt; content origin ${x0},${y0} scale ${scale}"
    echo "screen point for device pixel (x,y) = ($x0 + x*$scale, $y0 + y*$scale)"
    ;;
  tap)
    [ $# -ge 2 ] || fail "tap needs <x> <y>"
    cliclick "c:$(to_screen "$1" "$2")"
    sleep "$settle"
    capture "${3:-}"
    ;;
  swipe)
    [ $# -ge 4 ] || fail "swipe needs <x1> <y1> <x2> <y2>"
    cliclick -w 30 "dd:$(to_screen "$1" "$2")" "dm:$(to_screen "$3" "$4")" "du:$(to_screen "$3" "$4")"
    sleep "$settle"
    capture "${5:-}"
    ;;
  text)
    [ $# -ge 1 ] || fail "text needs a string"
    cliclick "t:$1"
    sleep "$settle"
    capture "${2:-}"
    ;;
  *)
    fail "unknown action '$action'"
    ;;
esac
