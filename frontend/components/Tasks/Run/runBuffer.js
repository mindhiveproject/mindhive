/**
 * Collects what a task frame sends and hands it to the save route.
 *
 * Rows go out in `incremental` batches, one request at a time so they append in
 * order, and a failed batch goes back to the front of the queue for the next
 * flush. They are a safety net: the `full` save on finish carries every row and
 * is the result that counts, so it is retried and its outcome reported.
 *
 * Markers become rows, `{mh_kind: "marker", label, value, time}`, in the same
 * data array. When the frame's finish carries its own complete rows (jsPsych's
 * `data.get().values()`), those replace the collected trial rows and the
 * markers are appended after them.
 *
 * @param {object} options
 * @param {(kind: "incremental" | "full", payload: object) => Promise<void>} options.save
 * @param {(kind: "incremental", payload: object) => void} [options.beacon] -
 *   Fire-and-forget send for page unload (e.g. `navigator.sendBeacon`).
 * @param {number} [options.batchSize=50] - Rows that trigger an immediate flush.
 * @param {number} [options.flushIntervalMs=10000] - Longest a row waits to go
 *   out. Incremental saves are only a safety net, and /api/runtime/save is
 *   rate-limited per address, which a classroom shares.
 * @param {number[]} [options.retryDelaysMs] - Waits between `full` attempts.
 */
function createRunBuffer({
  save,
  beacon,
  batchSize = 50,
  flushIntervalMs = 10000,
  retryDelaysMs = [1000, 3000, 10000],
}) {
  const collected = [];
  const markers = [];
  let pending = [];
  let timer = null;
  let inFlight = Promise.resolve();
  let finishing = null;

  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function flush() {
    clearTimer();
    if (finishing || pending.length === 0) return inFlight;
    const batch = pending;
    pending = [];
    inFlight = inFlight
      .then(() => save('incremental', { rows: batch }))
      .catch(() => {
        // Not lost: the full save carries it anyway. Retried after the
        // interval, never at once, so a down route isn't hammered.
        if (finishing) return;
        pending = batch.concat(pending);
        if (!timer) timer = setTimeout(flush, flushIntervalMs);
      });
    return inFlight;
  }

  function schedule() {
    if (pending.length >= batchSize) flush();
    else if (!timer) timer = setTimeout(flush, flushIntervalMs);
  }

  function add(rows) {
    if (finishing) return;
    collected.push(...rows);
    pending.push(...rows);
    schedule();
  }

  async function saveFull(payload) {
    let lastError;
    for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, retryDelaysMs[attempt - 1]);
        });
      }
      try {
        await save('full', payload);
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  return {
    addRows(rows) {
      add(rows);
    },
    addMarker({ label, value, time }) {
      const row = { mh_kind: 'marker', label, value, time };
      markers.push(row);
      add([row]);
    },
    /**
     * Saves the whole result. Resolves once the `full` save succeeds and
     * rejects with the last error when every attempt failed. Calling it again
     * returns the same promise.
     */
    finish({ aggregated = {}, rows } = {}) {
      if (finishing) return finishing;
      clearTimer();
      pending = [];
      const all = Array.isArray(rows)
        ? rows.concat(markers)
        : collected.slice();
      // An incremental request already on the wire finishes first, so the
      // full result is never followed by a stale append.
      finishing = inFlight.then(() => saveFull({ rows: all, aggregated }));
      return finishing;
    },
    /** For `pagehide`: sends rows still waiting, without waiting for a reply. */
    flushOnUnload() {
      if (finishing || pending.length === 0) return;
      const batch = pending;
      pending = [];
      clearTimer();
      if (beacon) beacon('incremental', { rows: batch });
      else save('incremental', { rows: batch }).catch(() => {});
    },
    flush,
    dispose() {
      clearTimer();
    },
    get rowCount() {
      return collected.length;
    },
  };
}

module.exports = { createRunBuffer };
