export function debouncePromise<T>(func: (ids: Array<number>) => Promise<Array<T>>, delay: number) {
  let timeout: number | undefined = undefined
  let pendingPromises: Array<{
    resolve: (value: T[] | PromiseLike<T[]>) => void
    reject: (reason?: unknown) => void
  }> = []
  let ids: Array<number> = []

  return function (id: number): Promise<Array<T>> {
    ids.push(id)
    return new Promise((resolve, reject) => {
      // Clear any existing timeout
      clearTimeout(timeout)

      // Store the resolve/reject callbacks for this invocation
      pendingPromises.push({ resolve, reject })

      timeout = window.setTimeout(() => {
        // Execute the original function
        try {
          const copyOfIds = ids.slice(0)
          ids = []
          const result = func.apply({}, [copyOfIds])

          // If the original function returns a Promise, wait for it to settle
          if (result && typeof result.then === 'function') {
            result
              .then((finalResult) => {
                pendingPromises.forEach((p) => p.resolve(finalResult))
                pendingPromises = [] // Clear pending promises after resolution
              })
              .catch((error) => {
                pendingPromises.forEach((p) => p.reject(error))
                pendingPromises = [] // Clear pending promises after rejection
              })
          } else {
            // If the original function does not return a Promise, resolve immediately
            pendingPromises.forEach((p) => p.resolve(result))
            pendingPromises = []
          }
        } catch (error: unknown) {
          pendingPromises.forEach((p) => p.reject(error))
          pendingPromises = []
        }
      }, delay)
    })
  }
}
