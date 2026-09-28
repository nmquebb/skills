#!/usr/bin/env bash
# Read-only computer-use inventory for this machine. Installs nothing, prompts for nothing, sends no
# input. Prints one line per capability: status, key, detail or remedy. Host input, display, and
# simulator checks need macOS; elsewhere the doctor says so and still runs the web checks.
# Usage: doctor.sh [simulator|web|all] [--app <bundle-id>]... [<port>[:<name>]]...
#   --app <bundle-id>  report whether the app under test is installed on each booted simulator
#   <port>:<name>      report whether a local listener the evidence depends on is up
# Exits 1 when a required capability is missing or unverified.

set -u

surface="${1:-all}"
[ "$#" -gt 0 ] && shift
apps=""
ports=""
missing=0
os="$(uname -s)"

line() { printf '%-8s %-20s %s\n' "$1" "$2" "$3"; }
need() { missing=$((missing + 1)); line "missing" "$1" "$2"; }
with_timeout() { perl -e 'alarm shift; exec @ARGV' "$@" 2>&1; }
has() { command -v "$1" >/dev/null 2>&1; }
wants() { [ "$surface" = "all" ] || [ "$surface" = "$1" ]; }
usage() {
  echo "Usage: $0 [simulator|web|all] [--app <bundle-id>]... [<port>[:<name>]]..." >&2
  exit 2
}

case "$surface" in
  simulator | web | all) ;;
  *) usage ;;
esac
while [ "$#" -gt 0 ]; do
  case "$1" in
    --app)
      [ "$#" -ge 2 ] || usage
      case "$2" in "" | *[!A-Za-z0-9._-]*) usage ;; esac
      apps="$apps $2"
      shift 2
      ;;
    [0-9]*)
      case "$1" in *[!A-Za-z0-9:._-]*) usage ;; esac
      case "${1%%:*}" in *[!0-9]*) usage ;; esac
      ports="$ports $1"
      shift
      ;;
    *) usage ;;
  esac
done

# --- Platform: host input, display, and simulator checks need macOS ---
if [ "$os" != "Darwin" ]; then
  if wants simulator; then
    need "platform" "$os: host and simulator interaction need macOS; web evidence still works: doctor.sh web"
  else
    line "info" "platform" "$os: host and simulator checks skipped; they need macOS"
  fi
fi

# --- Which application owns this process tree (and therefore its macOS privacy grants) ---
responsible="unknown"
if [ "$os" = "Darwin" ]; then
  ancestry=""
  pid=$$
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    pid="$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')"
    [ -z "$pid" ] || [ "$pid" = "0" ] && break
    name="$(basename "$(ps -o comm= -p "$pid" 2>/dev/null)")"
    ancestry="$ancestry > $name"
    # Case-sensitive on purpose: agent CLIs (claude, codex, pi) never own grants; their host app does.
    case "$name" in
      Paseo | Terminal | iTerm2 | ChatGPT | Codex | Claude | Code | code | Cursor | zed | Warp | Ghostty | ghostty | Alacritty | alacritty | kitty | wezterm-gui)
        [ "$responsible" = "unknown" ] && responsible="$name"
        ;;
    esac
  done
  line "info" "ancestry" "${ancestry# > }"
  if [ "$responsible" = "unknown" ]; then
    line "info" "responsible-app" "no listed host app; an unlisted app in the ancestry may own the grants; with none (launchd, cron, or SSH), macOS grants none of its privacy permissions to this tree"
  else
    line "info" "responsible-app" "$responsible owns the Accessibility and Automation grants for this tree"
  fi
fi

# --- Host input prerequisites do not apply to headless web or daemon screenshots. ---
if [ "$os" = "Darwin" ] && wants simulator; then
  ax="$(with_timeout 5 osascript -e 'tell application "System Events" to UI elements enabled')"
  case "$ax" in
    true) line "ok" "accessibility" "granted to $responsible" ;;
    false) need "accessibility" "grant Accessibility to $responsible in System Settings > Privacy & Security > Accessibility, then restart the agent session" ;;
    *)
      missing=$((missing + 1))
      line "unknown" "accessibility" "System Events did not confirm Accessibility; check the responsible app's grants before input: $ax"
      ;;
  esac

  # Idle display sleep locks the session about 11 s after the display turns off, even with
  # password-after-sleep off, and hides every host window from System Events. A missing display
  # (KVM switched away) leaves the window server nothing to address; only hardware fixes that.
  displays="$(with_timeout 5 system_profiler SPDisplaysDataType -json 2>/dev/null | python3 -c '
import json, sys
data = json.load(sys.stdin)
print(sum(len(group.get("spdisplays_ndrvs", [])) for group in data.get("SPDisplaysDataType", [])))
' 2>/dev/null)"
  display_event="$(with_timeout 5 pmset -g log 2>/dev/null | grep -E 'Display is turned (on|off)' | tail -1 | awk '{print $1 "T" $2 " " $5 " " $6 " " $7 " " $8}')"
  display_sleep="$(pmset -g 2>/dev/null | awk '/^ displaysleep/ {print $2}')"
  case "$displays" in
    "")
      missing=$((missing + 1))
      line "unknown" "display:connected" "display inventory unavailable; with no monitor attached (KVM switched away) synthetic input has no window: attach a display or a headless display adapter"
      ;;
    0) need "display:connected" "no display attached (KVM switched away or monitor unplugged); the window server has nothing to address: attach a display or a headless display adapter; no setting or assertion changes this" ;;
    *) line "ok" "display:connected" "$displays display(s); idle display sleep after ${display_sleep:-?} min; last event: ${display_event:-none recorded}" ;;
  esac
  session="$(ioreg -n Root -d1 2>/dev/null)"
  if [ "$?" -ne 0 ]; then
    missing=$((missing + 1))
    line "unknown" "session:unlocked" "console state unavailable; run: caffeinate -d -u -t <journey seconds> & then rerun the simulator doctor"
  elif printf '%s\n' "$session" | grep -q '"CGSSessionScreenIsLocked"=Yes'; then
    case "$display_event" in
      *"turned off"*) need "session:unlocked" "session locked by idle display sleep; run: caffeinate -d -u -t <journey seconds> & to wake and hold the display (no password needed), then rerun the doctor" ;;
      *) need "session:unlocked" "session locked while the display is on; a user unlock is required. Do not change security settings" ;;
    esac
  else
    line "info" "session:unlocked" "console lock flag not reported; hold caffeinate -d -u -t <journey seconds> before the first host input so idle display sleep cannot relock the session"
  fi
fi
if [ "$os" = "Darwin" ]; then
  line "unknown" "screen-recording" "not detectable read-only; needed only for host screencapture, never for simctl screenshots"
fi

# --- Binaries ---
tools="maestro node bun docker gh adb"
[ "$os" = "Darwin" ] && tools="xcrun cliclick idb sips $tools"
for tool in $tools; do
  if has "$tool"; then
    line "ok" "bin:$tool" "$(command -v "$tool")"
  else
    case "$tool" in
      xcrun) wants simulator && need "bin:$tool" "install Xcode command line tools" ;;
      adb) line "absent" "bin:$tool" "Android acceptance stays out of scope until an SDK is installed deliberately" ;;
      idb) line "absent" "bin:$tool" "optional device-point input; use a computer-use tool (such as Codex Computer Use) for Device Hub or sim-tap.sh for legacy Simulator" ;;
      maestro) line "absent" "bin:$tool" "optional flow runner; pilot only when a repeatable journey needs it" ;;
      *) line "absent" "bin:$tool" "optional" ;;
    esac
  fi
done

# --- Simulator ---
if [ "$os" = "Darwin" ] && wants simulator && has xcrun; then
  developer_dir="$(xcode-select -p 2>/dev/null)"
  host_process="Simulator"
  host_path="$developer_dir/Applications/Simulator.app"
  if [ -d "$developer_dir/../Applications/DeviceHub.app" ]; then
    host_process="DeviceHub"
    host_path="$developer_dir/../Applications/DeviceHub.app"
  fi
  if [ -d "$host_path" ]; then
    # Report the resolved path. The unnormalized form reads as a typo, and hand-"correcting" the
    # `..` away produces a path that does not exist and fails silently in `open`.
    host_path="$(cd "$host_path" && pwd -P)"
    line "ok" "simulator:host" "$host_process at $host_path"
  else
    need "simulator:host" "no device host in selected Xcode: $developer_dir; select a complete Xcode installation"
  fi
  booted="$(xcrun simctl list devices booted -j 2>/dev/null | python3 -c '
import json, sys
data = json.load(sys.stdin)
for runtime, devices in data["devices"].items():
    for device in devices:
        if device.get("state") == "Booted":
            print(device["udid"], runtime.rsplit(".", 1)[-1], device["name"].replace(" ", "_"))
')"
  if [ -z "$booted" ]; then
    need "simulator:booted" "none booted; run: xcrun simctl list devices available, then xcrun simctl boot <udid> and open the detected simulator:host path"
  else
    while read -r udid runtime name; do
      [ -z "$udid" ] && continue
      line "ok" "simulator:booted" "$udid $name $runtime"
      for app in $apps; do
        if xcrun simctl listapps "$udid" </dev/null 2>/dev/null | grep -qF "\"$app\""; then
          line "ok" "simulator:app" "$app installed on $udid"
        else
          need "simulator:app" "$app missing on $udid; install it with the project's own build or dev command"
        fi
      done
    done <<< "$booted"
  fi
  if pgrep -x "$host_process" >/dev/null 2>&1; then
    windows="$(with_timeout 5 osascript -e "tell application \"System Events\" to tell process \"$host_process\" to get count of windows")"
    if [[ "$windows" =~ ^[1-9][0-9]*$ ]]; then
      line "ok" "simulator:window" "$windows window(s) visible to System Events; verify the target device and foreground before input"
    elif [ "$windows" = "0" ]; then
      need "simulator:window" "System Events sees no $host_process window; if session:unlocked reported idle display sleep, run: caffeinate -d -u -t <journey seconds> &; otherwise open the target device window on this Space, then rerun the doctor"
    else
      missing=$((missing + 1))
      line "unknown" "simulator:window" "window availability unverified; check console state and Automation access before input: $windows"
    fi
  else
    need "simulator:window" "$host_process not running; a device can stay booted headless; run: open \"$host_path\""
  fi
  if [ -d "$HOME/.codex/computer-use/Codex Computer Use.app" ]; then
    line "info" "codex-cua" "present; Codex CUA needs Screen Recording and Accessibility granted to 'Codex Computer Use' (cgWindowNotFound / -1728 otherwise)"
  else
    line "absent" "codex-cua" "Codex Computer Use app not installed (Codex hosts only)"
  fi
fi

# --- Web: Playwright from the project's installed dependencies, then the Bun cache ---
if wants web; then
  root="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"
  pw=""
  pw_kind="js"
  for dir in "$PWD" "$root"; do
    for pkg in playwright-core playwright @playwright/test; do
      if [ -z "$pw" ] && [ -f "$dir/node_modules/$pkg/package.json" ]; then
        version="$(sed -n 's/^ *"version": *"\([^"]*\)".*/\1/p' "$dir/node_modules/$pkg/package.json" | head -1)"
        pw="$pkg@${version:-unknown} in $dir/node_modules"
      fi
    done
  done
  if [ -z "$pw" ]; then
    store="$(ls -d "$root/node_modules/.pnpm/playwright-core@"* "$root/node_modules/.bun/playwright-core@"* 2>/dev/null | sort -V | tail -1)"
    [ -n "$store" ] && pw="${store##*/} in $root/node_modules"
  fi
  if [ -z "$pw" ]; then
    cached="$(ls -d "$HOME/.bun/install/cache/playwright-core@"* 2>/dev/null | sed 's#.*/##' | sort -V | tail -1)"
    [ -n "$cached" ] && pw="$cached in bun cache"
  fi
  if [ -z "$pw" ]; then
    venv="$(ls -d "$root"/.venv/lib/python*/site-packages/playwright "$root"/venv/lib/python*/site-packages/playwright 2>/dev/null | head -1)"
    [ -n "$venv" ] && pw="python playwright in ${venv%%/lib/python*}" && pw_kind="python"
  fi
  if [ -n "$pw" ]; then
    line "ok" "web:playwright" "$pw"
    if [ "$pw_kind" = "js" ] && ! has node && ! has bun; then
      need "web:runtime" "Playwright found but neither node nor bun is on PATH to run it"
    fi
  else
    need "web:playwright" "none in node_modules under $PWD or $root, the Bun cache, or a project virtualenv; run from the package that owns the browser tests, prepare the checkout with the project's install command, or use the host's browser tool"
  fi

  case "${PLAYWRIGHT_BROWSERS_PATH:-}" in
    "")
      if [ "$os" = "Darwin" ]; then
        browsers="$HOME/Library/Caches/ms-playwright"
      else
        browsers="${XDG_CACHE_HOME:-$HOME/.cache}/ms-playwright"
      fi
      ;;
    0) browsers="$(ls -d "$root"/node_modules/playwright-core/.local-browsers "$root"/node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/.local-browsers "$root"/node_modules/.bun/playwright-core@*/node_modules/playwright-core/.local-browsers 2>/dev/null | tail -1)" ;;
    *) browsers="$PLAYWRIGHT_BROWSERS_PATH" ;;
  esac
  shell="$(ls -d "$browsers/chromium_headless_shell-"* 2>/dev/null | sort -V | tail -1)"
  if [ -n "$shell" ]; then
    line "ok" "web:headless-shell" "$shell"
  else
    need "web:headless-shell" "no chromium_headless_shell under ${browsers:-the Playwright package}; install the build matching the project's Playwright version with its own CLI, for example: npx playwright install chromium-headless-shell"
  fi
fi

# --- Local runtime (never started here) ---
if [ -z "$ports" ]; then
  line "info" "ports" "none named; pass <port>:<name> pairs from the project's guidance to check local listeners"
elif ! has lsof; then
  line "absent" "bin:lsof" "port checks skipped; check the named listeners another way"
else
  for spec in $ports; do
    port="${spec%%:*}"
    case "$spec" in
      *:*) name="${spec#*:}" ;;
      *) name="service" ;;
    esac
    owner="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | awk 'NR==2 {print $1 " pid " $2}')"
    if [ -n "$owner" ]; then line "ok" "port:$port" "$name listening ($owner)"; else line "absent" "port:$port" "$name not running; start it from the checkout that owns the evidence"; fi
  done
fi
if has docker; then
  services="$(perl -e 'alarm shift; exec @ARGV' 8 docker ps --format '{{.Names}}' 2>/dev/null)"
  if [ "$?" -ne 0 ]; then
    line "absent" "docker" "daemon not reachable within 8 s; start it deliberately only if the evidence needs containers"
  elif [ -n "$services" ]; then
    line "ok" "docker" "$(printf '%s\n' "$services" | awk 'NR <= 12 {names = names (NR > 1 ? " " : "") $0} END {print NR " running: " names (NR > 12 ? " (+" NR - 12 " more)" : "")}')"
  else
    line "absent" "docker" "no running containers; start the project's services per its guidance from the checkout that owns the evidence"
  fi
fi

# --- Checkout ---
if git rev-parse --show-toplevel >/dev/null 2>&1; then
  dirty="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
  line "info" "checkout" "$(git rev-parse --show-toplevel) at $(git rev-parse --short HEAD 2>/dev/null || echo 'no commit') with $dirty changed path(s)"
fi

if [ "$missing" -gt 0 ]; then
  echo "doctor: $missing required capability(ies) missing or unverified for surface '$surface'" >&2
  exit 1
fi
