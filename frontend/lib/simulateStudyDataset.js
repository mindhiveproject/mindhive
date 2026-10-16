/**
 * Sham ("simulated") study datasets: read a study flow plus each block's
 * aggregate variables and sample one row per simulated participant.
 */

import { normalizeVariableName } from "./normalizeVariableName";

/** @typedef {"normal" | "uniform" | "integer"} SimulationMode */

/** @type {SimulationMode[]} */
export const SIMULATION_MODES = ["normal", "uniform", "integer"];

/** @typedef {"mean" | "sd" | "min" | "max"} SimulationParam */

/**
 * Parameters each mode draws with. Every mode is bounded by `min` / `max` so
 * the generated values stay within a coherent range.
 * @type {Record<SimulationMode, SimulationParam[]>}
 */
export const SIMULATION_MODE_PARAMS = {
  normal: ["mean", "sd", "min", "max"],
  uniform: ["min", "max"],
  integer: ["min", "max"],
};

export const SIMULATION_MODE_DEFAULTS = {
  normal: { mean: 0, sd: 1, min: -3, max: 3 },
  uniform: { min: 0, max: 1 },
  integer: { min: 1, max: 7 },
};

export const DEFAULT_SIMULATED_PARTICIPANTS = 30;
export const MAX_SIMULATED_PARTICIPANTS = 1000;

/**
 * @param {SimulationMode} mode
 * @returns {{ mode: SimulationMode, mean?: number, sd?: number, min: number, max: number }}
 */
export function defaultSimulationSetting(mode = "normal") {
  const defaults = SIMULATION_MODE_DEFAULTS[mode] || SIMULATION_MODE_DEFAULTS.normal;
  return { mode, ...defaults };
}

/**
 * Switch mode while keeping the current range, so a variable set up as 1–7
 * stays 1–7. Normal centres on the range with ±3σ spanning it.
 */
export function switchSimulationMode(setting, mode) {
  const min = Number(setting?.min);
  const max = Number(setting?.max);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return defaultSimulationSetting(mode);
  }
  if (mode === "normal") {
    return {
      mode,
      mean: roundValue((min + max) / 2),
      sd: roundValue((max - min) / 6),
      min,
      max,
    };
  }
  return { mode, min, max };
}

/** Numeric copy of a setting with only its mode's parameters. */
export function normalizeSimulationSetting(setting) {
  const mode = SIMULATION_MODE_PARAMS[setting?.mode] ? setting.mode : "normal";
  const out = { mode };
  SIMULATION_MODE_PARAMS[mode].forEach((param) => {
    out[param] = Number(setting?.[param]);
  });
  return out;
}

/** Config key for one variable of one flow node (the same task can appear in several conditions). */
export function simulationVariableKey(nodeId, varName) {
  return `${nodeId}::${varName}`;
}

/** Plain text from the rich-text `varName` stored in task settings. */
export function stripHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Aggregate variables of a task, locale-aware like the HypVis axis pickers.
 * @param {{ settings?: any, i18nContent?: any } | null | undefined} task
 * @param {string} locale
 * @returns {Array<{ varName: string, varDesc: string }>}
 */
export function parseTaskAggregateVariables(task, locale) {
  const settings = task?.i18nContent?.[locale]?.settings || task?.settings;
  let raw = [];
  try {
    raw = settings?.aggregateVariables
      ? JSON.parse(settings.aggregateVariables)
      : [];
  } catch {
    raw = [];
  }
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  return raw
    .map((item) => {
      const varName = stripHtml(typeof item === "string" ? item : item?.varName);
      const varDesc = stripHtml(typeof item === "string" ? "" : item?.varDesc);
      return { varName, varDesc };
    })
    .filter((v) => {
      if (!v.varName || seen.has(v.varName)) return false;
      seen.add(v.varName);
      return true;
    });
}

/**
 * Task nodes (`my-node`) anywhere in the flow, including between-subjects branches.
 * @param {any[]} flow
 */
export function collectFlowTaskNodes(flow) {
  return (flow || []).flatMap((stage) => {
    if (stage?.type === "my-node") return [stage];
    if (stage?.type === "design") {
      return (stage.conditions || []).flatMap((c) => collectFlowTaskNodes(c?.flow));
    }
    return [];
  });
}

/**
 * @param {Record<string, unknown> | null | undefined} setting
 * @returns {null | "notNumber" | "negativeSd" | "maxBelowMin" | "meanOutsideRange" | "noIntegerInRange"}
 */
export function validateSimulationSetting(setting) {
  const params = SIMULATION_MODE_PARAMS[setting?.mode] || SIMULATION_MODE_PARAMS.normal;
  const invalid = params.some(
    (param) =>
      setting?.[param] === "" ||
      setting?.[param] == null ||
      !Number.isFinite(Number(setting[param])),
  );
  if (invalid) return "notNumber";
  const { mean, sd, min, max } = normalizeSimulationSetting(setting);
  if (max < min) return "maxBelowMin";
  if (setting.mode === "normal") {
    if (sd < 0) return "negativeSd";
    if (mean < min || mean > max) return "meanOutsideRange";
  }
  if (setting.mode === "integer" && Math.ceil(min) > Math.floor(max)) {
    return "noIntegerInRange";
  }
  return null;
}

/** Seeded PRNG so a stored config regenerates the same rows. */
function mulberry32(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSimulationSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

function sampleNormal(mean, sd, random) {
  // Box-Muller; 1 - random() keeps the log argument in (0, 1].
  const u1 = 1 - random();
  const u2 = random();
  return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** One draw for a (valid) setting. Normal is truncated to [min, max] by resampling. */
export function sampleValue(setting, random) {
  const { mode, mean, sd, min, max } = normalizeSimulationSetting(setting);
  switch (mode) {
    case "uniform":
      return min + random() * (max - min);
    case "integer": {
      const lo = Math.ceil(min);
      const hi = Math.floor(max);
      if (hi < lo) return lo;
      return lo + Math.floor(random() * (hi - lo + 1));
    }
    case "normal":
    default: {
      if (sd === 0) return Math.min(max, Math.max(min, mean));
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const value = sampleNormal(mean, sd, random);
        if (value >= min && value <= max) return value;
      }
      return Math.min(max, Math.max(min, sampleNormal(mean, sd, random)));
    }
  }
}

function roundValue(value) {
  return Math.round(value * 1e4) / 1e4;
}

/**
 * Draws for the modal preview: histogram bins over [min, max] plus summary stats.
 * @returns {{ bins: number[], mean: number, sd: number, min: number, max: number } | null}
 */
export function previewSimulationSetting(setting, { draws = 1000, binCount = 20, seed = 7 } = {}) {
  if (validateSimulationSetting(setting)) return null;
  const { mode, min, max } = normalizeSimulationSetting(setting);
  const random = mulberry32(seed);
  const values = Array.from({ length: draws }, () => sampleValue(setting, random));

  const isInteger = mode === "integer";
  const lo = isInteger ? Math.ceil(min) : min;
  const hi = isInteger ? Math.floor(max) : max;
  const count = isInteger ? Math.min(hi - lo + 1, 60) : binCount;
  const bins = new Array(Math.max(count, 1)).fill(0);
  const span = hi - lo;
  values.forEach((value) => {
    const index =
      span === 0
        ? 0
        : isInteger
          ? Math.min(count - 1, Math.round(((value - lo) / span) * (count - 1)))
          : Math.min(count - 1, Math.floor(((value - lo) / span) * count));
    bins[index] += 1;
  });

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const sd = Math.sqrt(
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length,
  );
  return {
    bins,
    mean: roundValue(mean),
    sd: roundValue(sd),
    min: roundValue(Math.min(...values)),
    max: roundValue(Math.max(...values)),
  };
}

function pickCondition(conditions, random) {
  const weights = (conditions || []).map((c) => {
    const p = parseFloat(c?.probability);
    return Number.isFinite(p) && p > 0 ? p : 0;
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) {
    return conditions?.[Math.floor(random() * (conditions?.length || 1))];
  }
  let roll = random() * total;
  for (let i = 0; i < weights.length; i += 1) {
    roll -= weights[i];
    if (roll < 0) return conditions[i];
  }
  return conditions[conditions.length - 1];
}

/**
 * Path one participant takes through the flow. Mirrors the Study Flow preview:
 * a `design` node hands the rest of the run to the chosen condition's flow.
 */
function walkParticipantPath(flow, random) {
  const nodes = [];
  const conditionLabels = [];
  let current = flow || [];
  let index = 0;
  while (index < current.length) {
    const stage = current[index];
    if (stage?.type === "my-node") {
      nodes.push(stage);
      index += 1;
    } else if (stage?.type === "design") {
      const condition = pickCondition(stage.conditions, random);
      if (condition?.label) conditionLabels.push(condition.label);
      current = condition?.flow || [];
      index = 0;
    } else {
      index += 1;
    }
  }
  return { nodes, condition: conditionLabels.join("-") || undefined };
}

/**
 * One column name per (node, variable). Names shared by several blocks get the
 * block subtitle appended, the same disambiguation study datasets use.
 */
function buildColumns(taskNodes, variablesByTaskId) {
  const entries = taskNodes.flatMap((node) =>
    (variablesByTaskId[node?.componentID] || []).map((variable) => ({
      node,
      varName: variable.varName,
      base: normalizeVariableName(variable.varName),
    })),
  );
  const baseCounts = entries.reduce((acc, e) => {
    acc[e.base] = (acc[e.base] || 0) + 1;
    return acc;
  }, {});
  const used = new Set();
  return entries.map((entry) => {
    let field = entry.base;
    if (baseCounts[entry.base] > 1) {
      const suffix = normalizeVariableName(
        entry.node?.subtitle || entry.node?.name || entry.node?.id,
      );
      field = `${entry.base}_${suffix}`;
    }
    let unique = field;
    let n = 2;
    while (used.has(unique)) {
      unique = `${field}_${n}`;
      n += 1;
    }
    used.add(unique);
    return { ...entry, field: unique };
  });
}

/**
 * @param {{
 *   flow: any[],
 *   variablesByTaskId: Record<string, Array<{ varName: string }>>,
 *   config: {
 *     participants: number,
 *     seed: number,
 *     variables: Record<string, { mode: SimulationMode, mean?: number, sd?: number, min: number, max: number }>,
 *   },
 * }} params
 * @returns {{ data: Record<string, unknown>[], variables: object[], components: object[] }}
 */
export function generateSimulatedDataset({ flow, variablesByTaskId, config }) {
  const random = mulberry32(config?.seed ?? 1);
  const taskNodes = collectFlowTaskNodes(flow);
  const columns = buildColumns(taskNodes, variablesByTaskId || {});
  const participants = Math.max(
    0,
    Math.min(
      MAX_SIMULATED_PARTICIPANTS,
      Math.floor(Number(config?.participants) || 0),
    ),
  );
  const width = String(participants).length < 3 ? 3 : String(participants).length;

  const data = Array.from({ length: participants }, (_, i) => {
    const { nodes, condition } = walkParticipantPath(flow, random);
    const visited = new Set(nodes.map((node) => node?.id));
    const row = {
      participant: `sim-${String(i + 1).padStart(width, "0")}`,
      condition,
      userType: "SIMULATED",
    };
    columns.forEach((column) => {
      if (!visited.has(column.node?.id)) {
        row[column.field] = null;
        return;
      }
      const setting =
        config?.variables?.[simulationVariableKey(column.node.id, column.varName)] ||
        defaultSimulationSetting();
      const value = sampleValue(setting, random);
      row[column.field] = setting.mode === "integer" ? value : roundValue(value);
    });
    return row;
  });

  const variables = [
    ...columns.map((column) => ({
      field: column.field,
      task: column.node?.testId,
      testId: column.node?.testId,
      subtitle: column.node?.subtitle,
      type: "task",
      editable: false,
    })),
    { field: "participant", type: "general", editable: true },
    { field: "condition", type: "general", editable: true },
    { field: "userType", type: "general", editable: true },
  ];

  const seenTestIds = new Set();
  const components = taskNodes
    .filter((node) => {
      if (seenTestIds.has(node?.testId)) return false;
      seenTestIds.add(node?.testId);
      return true;
    })
    .map((node) => ({
      id: node?.id,
      testId: node?.testId,
      name: node?.name,
      subtitle: node?.subtitle,
    }));

  return { data, variables, components };
}
