export class FetchError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

/** fetch + JSON parse that throws FetchError (with the API's error message) on non-2xx. */
export async function fetchJson(url, options) {
  const response = await fetch(url, options)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new FetchError(data.error || `Request failed (${response.status})`, response.status)
  }
  return data
}
