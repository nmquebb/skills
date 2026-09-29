/** Calls `operation` until it succeeds or the attempts run out, rethrowing the last error. */
export async function retry(operation, { attempts = 3, isRetryable = () => true, delayMs = 0 } = {}) {
  let lastError
  for (let attempt = 0; attempt <= attempts; attempt++) {
    try {
      return await operation(attempt)
    } catch (error) {
      lastError = error
      if (!isRetryable(error)) {
        throw error
      }

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError
}
