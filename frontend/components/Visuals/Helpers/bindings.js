// `Visual.parameters` holds only what the sketch's declaration cannot know:
// where a parameter gets its value, and the authoring knobs around that.
//
// The declared key is the identifier. That is why there is no generated id
// here — renaming a parameter in code becomes a visible rebinding rather than a
// mapping that silently detaches from a row nobody can see.

export const SCHEMA_VERSION = 3;

export const EMPTY_BINDING = {
  // null | { kind: "manual", value }
  //      | { kind: "stream", sourceId, streamID, channel }
  //      | { kind: "column", datasetId, column, mode, samplingRate }
  mapping: null,
  rangeOverride: null,
  normalize: false,
  allowMapping: true,
};

/**
 * Reads `Visual.parameters` in either shape.
 *
 * YQ stores an array of `{ name, suggested }` and lets the dashboard own the
 * whole parameter definition. Those visuals still have to open, so an array is
 * read as "legacy" and turned into bindings keyed by name — the sketch simply
 * won't have declared anything, and the Parameters tab falls back to listing
 * these instead.
 *
 * @param {any} raw - The stored JSON column.
 * @returns {{ bindings: Record<string, object>, legacyParameters: Array }}
 */
export function readBindings(raw) {
  if (Array.isArray(raw)) {
    const bindings = {};
    for (const entry of raw) {
      if (entry?.name) bindings[entry.name] = { ...EMPTY_BINDING };
    }
    return { bindings, legacyParameters: raw };
  }

  if (raw && typeof raw === "object" && raw.bindings) {
    return { bindings: raw.bindings, legacyParameters: [] };
  }

  return { bindings: {}, legacyParameters: [] };
}

/** The shape written back to `Visual.parameters`. */
export function writeBindings(bindings) {
  return { schemaVersion: SCHEMA_VERSION, bindings };
}

/** The binding for a key, with defaults filled in for keys never touched. */
export function bindingFor(bindings, key) {
  return { ...EMPTY_BINDING, ...(bindings?.[key] || {}) };
}

/**
 * Resolves the value each declared parameter should currently have.
 *
 * Only manual mappings and declared defaults resolve today — a `stream` mapping
 * has nothing behind it until data sources land, so it falls back to the
 * default rather than pretending to be live.
 *
 * @param {Record<string, object>} declared - The sketch's declaration.
 * @param {Record<string, object>} bindings
 * @returns {Record<string, any>}
 */
export function resolveValues(declared, bindings) {
  const values = {};
  for (const [key, declaration] of Object.entries(declared || {})) {
    const binding = bindingFor(bindings, key);
    if (binding.mapping?.kind === "manual") {
      values[key] = binding.mapping.value;
    } else {
      values[key] = declaration?.default;
    }
  }
  return values;
}

/** Human label for a declaration, falling back to the key it was declared as. */
export function labelFor(key, declaration) {
  return declaration?.label || key;
}

const TYPE_LABELS = {
  number: "Number",
  integer: "Whole Number",
  boolean: "Toggle",
  color: "Color",
  vector2: "2D Vector",
  vector3: "3D Vector",
  string: "Text",
};

export function typeLabel(type) {
  return TYPE_LABELS[type] || "Number";
}
