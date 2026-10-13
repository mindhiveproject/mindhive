// `Visual.parameters` holds only what the sketch's declaration cannot know:
// where a parameter gets its value, and the authoring knobs around that.
//
// The declared key is the identifier. That is why there is no generated id
// here — renaming a parameter in code becomes a visible rebinding rather than a
// mapping that silently detaches from a row nobody can see.
//
// The column is an array of `{ name, ...binding }`, one entry per parameter,
// because that is the shape YQ reads (`parameters.map(({ name }) => …)`) from
// the same Keystone. YQ ignores the extra fields and keeps them when it edits
// an entry, so both frontends can share the column. A `suggested` list written
// by YQ rides along inside the binding untouched; MindHive never writes one.

export const EMPTY_BINDING = {
  // null | { kind: "manual", value }
  //      | { kind: "stream", sourceId, output, channel }
  //          sourceId — the VisualDataSource row
  //          output   — the block output's `outputKey` ("<node>[/<stream>]"),
  //                     never a stream ID, which carries the device's runtime id
  //          channel  — the channel's `index` within that output
  //      | { kind: "column", datasetId, column, mode, samplingRate }
  mapping: null,
  rangeOverride: null,
  normalize: false,
  // Hold incoming stream values inside the range. Off by default: a value past
  // the range is often exactly what the author wants to see.
  clamp: false,
  allowMapping: true,
};

/**
 * Reads `Visual.parameters` into bindings keyed by parameter name.
 *
 * A YQ-era entry is just `{ name, suggested }`, which reads as a binding with
 * nothing mapped. The `{ schemaVersion, bindings }` object MindHive wrote
 * before the column became an array is still understood, so those visuals open.
 *
 * @param {any} raw - The stored JSON column.
 * @returns {{ bindings: Record<string, object> }}
 */
export function readBindings(raw) {
  if (Array.isArray(raw)) {
    const bindings = {};
    for (const entry of raw) {
      if (!entry?.name) continue;
      const { name, ...binding } = entry;
      bindings[name] = binding;
    }
    return { bindings };
  }

  if (raw && typeof raw === "object" && raw.bindings) {
    return { bindings: raw.bindings };
  }

  return { bindings: {} };
}

/**
 * The array written back to `Visual.parameters`: an entry for every declared
 * key — so YQ lists the sketch's real parameters even for ones never touched —
 * followed by any undeclared key that still carries a mapping, so a key that is
 * mid-rename in the code doesn't lose the author's work.
 *
 * Until the sketch has declared anything (`declared` is null) nothing can be
 * told apart from a stale entry, so every binding is kept.
 *
 * @param {Record<string, object>} bindings
 * @param {Record<string, object> | null} declared - The normalized declaration.
 * @returns {Array<{ name: string }>}
 */
export function writeBindings(bindings, declared) {
  const entries = Object.keys(declared || {}).map((name) => ({
    name,
    ...bindings[name],
  }));
  for (const [name, binding] of Object.entries(bindings)) {
    if (declared && name in declared) continue;
    if (!declared || binding?.mapping) entries.push({ name, ...binding });
  }
  return entries;
}

/** The binding for a key, with defaults filled in for keys never touched. */
export function bindingFor(bindings, key) {
  return { ...EMPTY_BINDING, ...(bindings?.[key] || {}) };
}

const VECTOR_SIZES = { vector2: 2, vector3: 3 };

/**
 * Brings a sketch's declaration into one of the kinds the panel knows how to
 * render: `number`, `category`, `text`, `color`, `vector2`, `vector3`.
 *
 * Older spellings are read rather than rejected — `integer` is a number with
 * `step: 1`, `string` is text, `boolean` is a category of `[false, true]` — so a
 * sketch never has to be rewritten to keep opening. Anything that can't be
 * made sense of still renders, as the nearest kind, and says why in a warning;
 * falling back silently is how a typo in `type` turns into a slider nobody
 * asked for.
 *
 * @param {Record<string, object>} raw - What the sketch passed to `declareParameters`.
 * @returns {{ parameters: Record<string, object>, warnings: string[] }}
 */
export function normalizeDeclarations(raw) {
  const parameters = {};
  const warnings = [];
  for (const [key, entry] of Object.entries(raw || {})) {
    parameters[key] = normalizeDeclaration(entry, (message) =>
      warnings.push(`Parameter "${key}": ${message}`)
    );
  }
  return { parameters, warnings };
}

function normalizeDeclaration(entry, warn) {
  const declaration = entry && typeof entry === "object" ? { ...entry } : {};
  let type = declaration.type ?? "number";

  if (type === "integer") {
    type = "number";
    declaration.step = declaration.step ?? 1;
  } else if (type === "string") {
    type = "text";
  } else if (type === "boolean") {
    type = "category";
    declaration.options = [false, true];
    declaration.default = !!declaration.default;
  }

  if (type === "category") {
    const options = Array.isArray(declaration.options) ? declaration.options : [];
    if (options.length === 0) {
      warn("a category needs an `options` array; showing it as text.");
      type = "text";
    } else if (!options.some((option) => Object.is(option, declaration.default))) {
      if (declaration.default !== undefined) {
        warn("its default isn't one of its options; using the first option.");
      }
      declaration.default = options[0];
    }
  }

  if (type === "text" || type === "color") {
    if (declaration.default == null) {
      declaration.default = type === "color" ? "#000000" : "";
    }
    declaration.default = String(declaration.default);
    if (type === "color") {
      // The swatch only takes `#rrggbb`, so any other spelling would leave it
      // showing black while the sketch received something else.
      const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(declaration.default);
      if (short) {
        declaration.default = `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
      } else if (!/^#[0-9a-f]{6}$/i.test(declaration.default)) {
        warn("a color's default must be a hex value like #ec40de; using #000000.");
        declaration.default = "#000000";
      }
    }
  } else if (VECTOR_SIZES[type]) {
    const size = VECTOR_SIZES[type];
    const given = Array.isArray(declaration.default) ? declaration.default : [];
    declaration.default = Array.from({ length: size }, (_, index) =>
      Number.isFinite(Number(given[index])) ? Number(given[index]) : 0
    );
  } else if (type !== "category") {
    if (type !== "number") {
      warn(`unknown type "${type}"; showing it as a number.`);
      type = "number";
    }
    if (!Number.isFinite(Number(declaration.default))) {
      if (declaration.default !== undefined) {
        warn("a number's default must be a number.");
      }
      declaration.default = Number.isFinite(Number(declaration.min))
        ? Number(declaration.min)
        : 0;
    }
    declaration.default = Number(declaration.default);
  }

  return { ...declaration, type };
}

/** Whether a manually set value still fits the declaration it was set against. */
function fitsDeclaration(declaration, value) {
  const type = declaration?.type;
  if (type === "category") {
    return declaration.options.some((option) => Object.is(option, value));
  }
  if (type === "text" || type === "color") return typeof value === "string";
  if (VECTOR_SIZES[type]) {
    return Array.isArray(value) && value.length === VECTOR_SIZES[type];
  }
  return Number.isFinite(value);
}

/**
 * Resolves the value each declared parameter should currently have.
 *
 * A `stream` mapping has no value of its own to resolve — its values arrive
 * from the device, straight into the bus. So it keeps whatever the stream last
 * delivered (`live`), and only falls back to the default before the first
 * sample, rather than snapping back every time an unrelated binding changes.
 * A manual value that no longer fits (the author changed the type, or dropped
 * the option it picked) falls back too.
 *
 * @param {Record<string, object>} declared - The normalized declaration.
 * @param {Record<string, object>} bindings
 * @param {Record<string, any>} [live] - The bus's current values.
 * @returns {Record<string, any>}
 */
export function resolveValues(declared, bindings, live = {}) {
  const values = {};
  for (const [key, declaration] of Object.entries(declared || {})) {
    const binding = bindingFor(bindings, key);
    if (
      binding.mapping?.kind === "manual" &&
      fitsDeclaration(declaration, binding.mapping.value)
    ) {
      values[key] = binding.mapping.value;
    } else if (
      binding.mapping?.kind === "stream" &&
      fitsDeclaration(declaration, live[key])
    ) {
      values[key] = live[key];
    } else {
      values[key] = declaration?.default;
    }
  }
  return values;
}

/**
 * Whether a parameter can take a device output. Only numbers can for now: a
 * stream channel carries one number per sample, and a number is the one kind
 * that means the same thing on both sides. Categorical streams onto category
 * and text parameters are the next step.
 */
export function isStreamMappable(declaration, binding) {
  return declaration?.type === "number" && binding?.allowMapping !== false;
}

/**
 * Shapes one raw sample for the sketch against the parameter's range
 * (`rangeOverride ?? declaration`). Both steps are the author's settings:
 * Clamp holds the sample inside the range, then Normalize rescales the range
 * onto 0–1. With neither on, or no range, the sample passes through untouched.
 */
export function streamValue(declaration, binding, raw) {
  const min = Number(binding.rangeOverride?.min ?? declaration?.min);
  const max = Number(binding.rangeOverride?.max ?? declaration?.max);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return raw;
  const value = binding.clamp
    ? Math.min(Math.max(raw, Math.min(min, max)), Math.max(min, max))
    : raw;
  return binding.normalize ? (value - min) / (max - min) : value;
}

/** Human label for a declaration, falling back to the key it was declared as. */
export function labelFor(key, declaration) {
  return declaration?.label || key;
}

// What an author picks from, in the order they are offered. A kind is a
// declared `type` plus the two spellings the panel tells apart on sight: a
// number that steps by 1, and a category of exactly `[false, true]`.
export const KIND_LABELS = {
  number: "Number",
  integer: "Whole Number",
  checkbox: "Checkbox",
  category: "Category",
  text: "Text",
  color: "Color",
  vector2: "2D Vector",
  vector3: "3D Vector",
};

/** Whether a category is the two-option on/off kind, which renders as a checkbox. */
export function isToggle(declaration) {
  const options = declaration?.options;
  return (
    declaration?.type === "category" &&
    options?.length === 2 &&
    options.includes(false) &&
    options.includes(true)
  );
}

/** The kind of a normalized declaration — a key of `KIND_LABELS`. */
export function kindOf(declaration) {
  if (isToggle(declaration)) return "checkbox";
  if (declaration?.type === "number" && declaration.step === 1) return "integer";
  return KIND_LABELS[declaration?.type] ? declaration.type : "number";
}

/** Human label for a declaration's kind. */
export function typeLabel(declaration) {
  return KIND_LABELS[kindOf(declaration)];
}

const CLEARED = { min: undefined, max: undefined, step: undefined, options: undefined };

const toNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

/**
 * The declaration fields that make `declaration` a `kind` instead, for
 * `updateParameter`. Fields that only belong to the old kind are `undefined`,
 * which removes them from the file. What carries over does: a range between
 * numbers and vectors, a default that still means something (a number's
 * magnitude, a text, a `#rrggbb`). Anything that doesn't gets the kind's
 * neutral value rather than a guess.
 *
 * @param {object} declaration - The normalized declaration being changed.
 * @param {string} kind - A key of `KIND_LABELS`.
 * @returns {Record<string, any>}
 */
export function retype(declaration, kind) {
  const given = declaration?.default;
  const range = isNumeric(declaration)
    ? { min: declaration.min, max: declaration.max }
    : {};

  if (kind === "number") {
    return { ...CLEARED, ...range, type: "number", default: toNumber(given) };
  }
  if (kind === "integer") {
    return {
      ...CLEARED,
      ...range,
      type: "number",
      step: 1,
      default: Math.round(toNumber(given)),
    };
  }
  if (kind === "checkbox") {
    return { ...CLEARED, type: "boolean", default: false };
  }
  if (kind === "category") {
    return {
      ...CLEARED,
      type: "category",
      options: ["Option 1", "Option 2"],
      default: "Option 1",
    };
  }
  if (kind === "text") {
    return {
      ...CLEARED,
      type: "text",
      default: typeof given === "string" ? given : "",
    };
  }
  if (kind === "color") {
    return {
      ...CLEARED,
      type: "color",
      default: /^#[0-9a-f]{6}$/i.test(given) ? given : "#000000",
    };
  }

  const size = VECTOR_SIZES[kind];
  return {
    ...CLEARED,
    ...range,
    type: kind,
    default: Array.from({ length: size }, (_, index) =>
      toNumber(Array.isArray(given) ? given[index] : 0)
    ),
  };
}

/** Numbers and vectors are the kinds that have a range to override or normalize. */
export function isNumeric(declaration) {
  return declaration?.type === "number" || !!VECTOR_SIZES[declaration?.type];
}
