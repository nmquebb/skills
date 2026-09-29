Add `createRateLimiter({ limit, windowMs, now })` for the public API. The returned `tryAcquire()`
allows at most `limit` calls in any sliding window of `windowMs` milliseconds and returns whether
this call is allowed; a call made exactly `windowMs` earlier no longer counts against the limit.
Time comes from the injectable `now` (default `Date.now`).
