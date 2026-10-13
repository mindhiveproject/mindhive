// The current value of every parameter, held outside React.
//
// Writers set values; the frame connection reads them as sparse patches, at
// most once per animation frame. That coalescing is the point: a stream at
// EEG rates writes hundreds of times a second, and none of that may reach
// React state or cross the port one sample at a time. Manual controls write
// here too, so a data source is just another writer — nothing downstream knows
// or cares where a value came from.
//
// Nothing here may import from Builder/ — the Viewer owns one too.

export default class ParameterBus {
  constructor() {
    this.values = {};
    this.dirty = new Set();
    this.listeners = new Map();
    this.sinks = new Set();
    this.frame = null;
  }

  get(key) {
    return this.values[key];
  }

  set(key, value) {
    if (Object.is(this.values[key], value)) return;
    this.values[key] = value;
    this.dirty.add(key);
    this.listeners.get(key)?.forEach((listener) => listener());
    this.schedule();
  }

  /**
   * Makes the bus hold exactly `next`. Keys that are gone stop being tracked;
   * the frame keeps whatever it last had for them, which is harmless — the
   * sketch no longer declares them.
   */
  replace(next) {
    for (const key of Object.keys(this.values)) {
      if (key in next) continue;
      delete this.values[key];
      this.listeners.get(key)?.forEach((listener) => listener());
    }
    for (const [key, value] of Object.entries(next)) this.set(key, value);
  }

  /** Watches one key, in the shape `useSyncExternalStore` expects. */
  subscribe(key, listener) {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key).add(listener);
    return () => this.listeners.get(key)?.delete(listener);
  }

  /**
   * Attaches a sink — the frame connection. It gets the full snapshot straight
   * away (`full = true`), then patches of whatever changed.
   *
   * @param {(values: object, full: boolean) => void} sink
   * @returns {() => void} Detaches it.
   */
  connect(sink) {
    this.sinks.add(sink);
    sink({ ...this.values }, true);
    return () => this.sinks.delete(sink);
  }

  schedule() {
    if (this.frame !== null || this.sinks.size === 0) return;
    this.frame = requestAnimationFrame(() => this.flush());
  }

  flush() {
    this.frame = null;
    if (this.dirty.size === 0) return;
    const patch = {};
    for (const key of this.dirty) patch[key] = this.values[key];
    this.dirty.clear();
    this.sinks.forEach((sink) => sink(patch, false));
  }
}
