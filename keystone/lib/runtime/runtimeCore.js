const crypto = require("crypto");

const RUNTIME_ASSET_FIELDS = {
  LABJS: "template",
  P5: "visual",
  JSPSYCH: "jsPsychExperiment",
};

const MAX_RUN_MESSAGE_BYTES = 50 * 1024 * 1024;
const MAX_FAILURE_MESSAGE_LENGTH = 16 * 1024;

function isSafeArchivePath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 1024 &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    !value.includes("\0") &&
    value.split("/").every((segment) => segment && segment !== "." && segment !== "..")
  );
}

function validateJsPsychManifest(manifest, entryPoint) {
  if (
    !manifest ||
    typeof manifest !== "object" ||
    Array.isArray(manifest) ||
    !Array.isArray(manifest.files) ||
    manifest.files.length === 0 ||
    manifest.files.length > 10000 ||
    !manifest.files.every(isSafeArchivePath) ||
    !isSafeArchivePath(entryPoint)
  ) {
    throw new Error("jsPsych manifest contains invalid archive paths");
  }
  if (!manifest.files.includes(entryPoint)) {
    throw new Error("jsPsych entry point must be declared in manifest.files");
  }
}

function resolveRuntimeConfiguration(task) {
  const runtimeType = task?.runtimeType || "LABJS";
  const field = RUNTIME_ASSET_FIELDS[runtimeType];
  if (!field) throw new Error(`Unsupported runtime type: ${runtimeType}`);

  const configured = Object.entries(RUNTIME_ASSET_FIELDS)
    .filter(([, assetField]) => Boolean(task?.[assetField]))
    .map(([type]) => type);
  if (configured.length !== 1 || configured[0] !== runtimeType) {
    throw new Error(
      `Task runtime ${runtimeType} requires exactly one ${field} asset`
    );
  }

  const asset = task[field];
  if (runtimeType === "JSPSYCH") {
    if (!asset.archive?.filename || !asset.entryPoint || !asset.manifest) {
      throw new Error("jsPsych assets require an archive, manifest, and entry point");
    }
    validateJsPsychManifest(asset.manifest, asset.entryPoint);
  }

  return {
    runtimeType,
    assetField: field,
    asset,
    // A jsPsych row is immutable once used, so its id names exactly what ran;
    // the other assets still carry a free-text label.
    assetVersion:
      runtimeType === "JSPSYCH" ? String(asset.id) : asset.version || "1",
  };
}

// Fields that define what a jsPsych version runs. Once a Task uses a row,
// these never change: a new upload creates a new row in the same family.
const JSPSYCH_LOCKED_FIELDS = [
  "archive",
  "manifest",
  "entryPoint",
  "parameters",
  "family",
];

const MAX_PARAMETER_DEFINITIONS = 200;

/**
 * Checks parameter definitions in the Template.parameters format, so the Lab.js
 * Parameters editor can edit a jsPsych task's values too:
 * `[{ name, type?, value?, help?, example?, options?, array? }]`.
 */
function validateParameterDefinitions(parameters) {
  if (parameters == null) return;
  if (!Array.isArray(parameters)) {
    throw new Error("Parameters must be a list of definitions");
  }
  if (parameters.length > MAX_PARAMETER_DEFINITIONS) {
    throw new Error(
      `Parameters are limited to ${MAX_PARAMETER_DEFINITIONS} definitions`
    );
  }
  const names = new Set();
  for (const parameter of parameters) {
    if (!parameter || typeof parameter !== "object" || Array.isArray(parameter)) {
      throw new Error("Each parameter must be an object");
    }
    const { name, type, help, example, options } = parameter;
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("Each parameter needs a name");
    }
    if (names.has(name)) throw new Error(`Duplicate parameter name: ${name}`);
    names.add(name);
    if (type !== undefined && typeof type !== "string") {
      throw new Error(`Parameter ${name} has an invalid type`);
    }
    for (const [key, value] of Object.entries({ help, example })) {
      if (value !== undefined && value !== null && typeof value !== "string") {
        throw new Error(`Parameter ${name} has an invalid ${key}`);
      }
    }
    // The Parameters editor stores a select's options as one string, one
    // option per line (SelectOne splits it on "\n"); a list is accepted too.
    if (
      options !== undefined &&
      options !== null &&
      typeof options !== "string" &&
      !Array.isArray(options)
    ) {
      throw new Error(`Parameter ${name} options must be text or a list`);
    }
  }
}

function signRunClaims(claims, secret, now = Date.now()) {
  if (!secret) throw new Error("Runtime token secret is not configured");
  const payload = Buffer.from(
    JSON.stringify({ ...claims, iat: now, exp: now + 12 * 60 * 60 * 1000 })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function verifyRunToken(token, secret, now = Date.now()) {
  if (!secret || typeof token !== "string") {
    throw new Error("Invalid run token");
  }
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) throw new Error("Invalid run token");
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  const supplied = Buffer.from(suppliedSignature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");
  if (
    supplied.length !== expected.length ||
    !crypto.timingSafeEqual(supplied, expected)
  ) {
    throw new Error("Invalid run token");
  }
  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid run token");
  }
  if (!claims || typeof claims !== "object" || Array.isArray(claims)) {
    throw new Error("Invalid run token");
  }
  const clockSkewMs = 60 * 1000;
  if (
    !claims.datasetId ||
    !claims.datasetToken ||
    !Number.isFinite(claims.iat) ||
    !Number.isFinite(claims.exp) ||
    claims.exp <= now ||
    claims.iat > now + clockSkewMs
  ) {
    throw new Error("Expired or incomplete run token");
  }
  return claims;
}

const ASSET_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function assetSignature(payload, secret) {
  // Signed under its own prefix, so a run token can never pass as an asset
  // token or the other way round.
  return crypto
    .createHmac("sha256", secret)
    .update(`asset.${payload}`)
    .digest("base64url");
}

/**
 * A short-lived token that lets the frontend's task routes serve one runtime
 * asset: a jsPsych version's files or a p5 visual's code. It travels in the
 * frame's URL, so it carries no participant or run identity, and it can't
 * save anything. `runtime` says which route may use it.
 */
function signAssetToken(assetId, secret, now = Date.now(), runtime = null) {
  if (!secret) throw new Error("Runtime token secret is not configured");
  const payload = Buffer.from(
    JSON.stringify({
      typ: "asset",
      assetId: String(assetId),
      ...(runtime ? { runtime } : {}),
      iat: now,
      exp: now + ASSET_TOKEN_TTL_MS,
    })
  ).toString("base64url");
  return `${payload}.${assetSignature(payload, secret)}`;
}

function verifyAssetToken(token, secret, now = Date.now()) {
  if (!secret || typeof token !== "string") throw new Error("Invalid asset token");
  const [payload, supplied, extra] = token.split(".");
  if (!payload || !supplied || extra) throw new Error("Invalid asset token");
  const expected = Buffer.from(assetSignature(payload, secret), "utf8");
  const given = Buffer.from(supplied, "utf8");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    throw new Error("Invalid asset token");
  }
  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid asset token");
  }
  if (
    claims?.typ !== "asset" ||
    typeof claims.assetId !== "string" ||
    !claims.assetId ||
    !Number.isFinite(claims.exp) ||
    claims.exp <= now
  ) {
    throw new Error("Expired or incomplete asset token");
  }
  return claims;
}

function assertRunClaimsMatchDataset(claims, dataset) {
  const expected = {
    datasetId: dataset?.id,
    datasetToken: dataset?.token,
    participantType: dataset?.type,
    profileId: dataset?.profile?.id || null,
    guestId: dataset?.guest?.id || null,
    studyId: dataset?.study?.id,
    taskId: dataset?.task?.id,
    runtimeType: dataset?.runtimeType,
    runtimeAssetId: dataset?.runtimeAssetId,
  };
  for (const [field, value] of Object.entries(expected)) {
    if ((claims[field] ?? null) !== (value ?? null)) {
      throw new Error("Run token does not match its Dataset context");
    }
  }
}

function acceptSequence(lastSequence, sequence) {
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new Error("Sequence must be a positive integer");
  }
  if (sequence <= lastSequence) {
    return { accepted: false, duplicate: true, nextSequence: lastSequence };
  }
  if (sequence !== lastSequence + 1) {
    throw new Error(`Expected sequence ${lastSequence + 1}`);
  }
  return { accepted: true, duplicate: false, nextSequence: sequence };
}

function serializedSize(value) {
  if (value === undefined) return 0;
  let serialized;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new Error("Runtime message payload must be serializable");
  }
  if (serialized === undefined) {
    throw new Error("Runtime message payload must be serializable");
  }
  return Buffer.byteLength(serialized, "utf8");
}

function validateRunMessage({ messageType, data, aggregated, error }) {
  if (!["BATCH", "FINAL", "COMPLETE", "FAILURE"].includes(messageType)) {
    throw new Error("Unsupported runtime message type");
  }
  if (serializedSize({ data, aggregated, error }) > MAX_RUN_MESSAGE_BYTES) {
    throw new Error("Runtime message payload is too large");
  }
  if (data !== undefined && data !== null && !Array.isArray(data)) {
    throw new Error("Runtime data must be an array");
  }
  if (
    aggregated !== undefined &&
    aggregated !== null &&
    (typeof aggregated !== "object" || Array.isArray(aggregated))
  ) {
    throw new Error("Runtime aggregate must be an object");
  }
  if (
    error !== undefined &&
    error !== null &&
    (typeof error !== "string" || error.length > MAX_FAILURE_MESSAGE_LENGTH)
  ) {
    throw new Error("Runtime failure message is invalid");
  }
  if (messageType === "BATCH" && !Array.isArray(data)) {
    throw new Error("BATCH messages require a data array");
  }
  if (
    messageType === "FINAL" &&
    (!Array.isArray(data) ||
      aggregated === null ||
      typeof aggregated !== "object" ||
      Array.isArray(aggregated))
  ) {
    throw new Error("FINAL messages require data and an aggregate object");
  }
  if (
    (messageType === "COMPLETE" || messageType === "FAILURE") &&
    (data != null || aggregated != null)
  ) {
    throw new Error(`${messageType} messages cannot include result data`);
  }
  if (messageType === "FAILURE" && !error) {
    throw new Error("FAILURE messages require an error");
  }
}

function findTaskVersion(flow, taskId, requestedVersion) {
  const matches = [];
  function visit(stages) {
    for (const stage of stages || []) {
      if (
        stage?.type === "my-node" &&
        String(stage.componentID) === String(taskId)
      ) {
        matches.push(stage.testId ?? null);
      }
      for (const condition of stage?.conditions || []) visit(condition.flow);
    }
  }
  visit(flow);
  if (!matches.length) throw new Error("Task is not part of the study flow");
  if (requestedVersion != null) {
    const match = matches.find(
      (version) => String(version) === String(requestedVersion)
    );
    if (match == null) throw new Error("Task version is not part of the study flow");
    return String(match);
  }
  return matches[0] == null ? null : String(matches[0]);
}

module.exports = {
  JSPSYCH_LOCKED_FIELDS,
  MAX_RUN_MESSAGE_BYTES,
  RUNTIME_ASSET_FIELDS,
  acceptSequence,
  assertRunClaimsMatchDataset,
  findTaskVersion,
  resolveRuntimeConfiguration,
  signAssetToken,
  signRunClaims,
  validateJsPsychManifest,
  validateParameterDefinitions,
  validateRunMessage,
  verifyAssetToken,
  verifyRunToken,
};
