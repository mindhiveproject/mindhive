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
    assetVersion: asset.version || "1",
  };
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
  MAX_RUN_MESSAGE_BYTES,
  RUNTIME_ASSET_FIELDS,
  acceptSequence,
  assertRunClaimsMatchDataset,
  findTaskVersion,
  resolveRuntimeConfiguration,
  signRunClaims,
  validateJsPsychManifest,
  validateRunMessage,
  verifyRunToken,
};
