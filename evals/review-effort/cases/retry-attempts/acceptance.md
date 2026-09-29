Add `retry(operation, { attempts, isRetryable, delayMs })` for calls to flaky services. It calls
`operation` until it succeeds, at most `attempts` times in total (default 3), waiting `delayMs`
between attempts (default 0). An error for which `isRetryable(error)` returns false is rethrown at
once; when every attempt fails, the last error is rethrown.
