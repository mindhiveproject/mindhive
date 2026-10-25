const KEEPALIVE_LIMIT = 60 * 1024;

/**
 * The `save` and `beacon` functions `createRunBuffer` takes, posting to
 * /api/runtime/save with the run token. The token stays on the study page:
 * the task frame never sees it.
 *
 * @param {object} options
 * @param {string} options.runToken
 * @param {typeof fetch} [options.fetchImpl]
 * @param {(url: string, data: Blob) => boolean} [options.sendBeacon]
 */
function createRuntimeSaveClient({
  runToken,
  fetchImpl = typeof fetch === 'undefined' ? undefined : fetch,
  sendBeacon = typeof navigator !== 'undefined' && navigator.sendBeacon
    ? navigator.sendBeacon.bind(navigator)
    : undefined,
}) {
  if (!runToken) throw new Error('A persisted run requires a run token');
  const url = `/api/runtime/save?runToken=${encodeURIComponent(runToken)}`;
  const body = (kind, { rows, aggregated }) =>
    JSON.stringify({ kind, rows, ...(kind === 'full' ? { aggregated } : {}) });

  async function save(kind, payload) {
    const json = body(kind, payload);
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
      // Lets a batch sent as the page closes still land; browsers refuse
      // keepalive bodies over 64 KB, so larger ones go without it.
      keepalive: new TextEncoder().encode(json).length < KEEPALIVE_LIMIT,
    });
    if (!response.ok) {
      let message = `Saving failed with status ${response.status}`;
      try {
        message = (await response.json())?.error || message;
      } catch {
        // Keep the status message.
      }
      throw new Error(message);
    }
  }

  function beacon(kind, payload) {
    const data = new Blob([body(kind, payload)], { type: 'application/json' });
    if (!sendBeacon?.(url, data)) save(kind, payload).catch(() => {});
  }

  /** Ends the run with FAILURE when the task broke before finishing. */
  async function fail(error) {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'failure', error: String(error) }),
    });
    if (!response.ok)
      throw new Error(`Recording the failure failed (${response.status})`);
  }

  return { save, beacon, fail };
}

module.exports = { createRuntimeSaveClient };
