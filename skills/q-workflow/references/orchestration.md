# Optional agent routing

The core spec, plan, and implementation skills require no subagent route. Use agents only when the
user requests them or an independent task clearly benefits from them. The standalone adversarial
review and computer-use skills describe their own roles. When routes are configured, use the chosen
launcher and route; do not silently substitute another provider.

## Routing rules

`agents.launcher: native` uses the host's subagent tool. `paseo` uses Paseo when installed and
available. See the [native launcher](launchers/native.md) or
[Paseo launcher](launchers/paseo.md) only when the corresponding launcher is used. If the host
has no subagent capability, perform optional work in the current session; for a specifically
requested independent review, explain the limitation and ask how to proceed.
