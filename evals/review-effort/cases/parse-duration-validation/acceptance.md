Add `parseDuration(text)` for configuration values. It accepts one or more of hours, minutes, and
seconds, in that order, such as `2h`, `1h30m`, or `90s`, and returns milliseconds. Anything else,
including an empty string, throws a `TypeError`.
