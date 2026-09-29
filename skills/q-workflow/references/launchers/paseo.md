# Paseo launcher

When `agents.launcher: paseo` is configured and Paseo is available, load the installed `paseo`
skill for its API. Launch the configured provider, model, mode, and effort for each requested role.
Give read-only roles a read-only instruction and inspect their returned content directly. If an
exact route is unavailable, report it before choosing a fallback. Keep workspace changes within
the authorization of the user's task.
