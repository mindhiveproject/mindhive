/**
 * Dev bootstrap: inserts the built-in yq-data catalog blocks a new developer
 * needs to exercise the study builder's data sources locally, without
 * clicking through the Keystone Admin UI (see docs/data-sources-blocks-setup.md
 * for the by-hand version this replaces).
 *
 * Currently seeds: Band Power (Muse), EEG Synchrony (2 headbands), Face
 * Landmarker, Face Emotion. EMOTIV isn't included yet — it needs Cortex
 * credentials per-environment, add it here once that's worth scripting too.
 *
 * From the keystone directory:
 *
 *   node scripts/seed-data-source-blocks.js --dry-run
 *   node scripts/seed-data-source-blocks.js
 *
 * Idempotent: skips any slug that already has a row (never clobbers a block
 * someone has since edited in the Admin UI). To pick up a definition change
 * made here, delete the existing row first and re-run.
 *
 * `inputs`/`outputs`/`graph`/`settingsSchema` are Keystone `json()` fields but
 * land as plain TEXT columns on SQLite, so they're written pre-stringified —
 * Prisma won't serialize them for you here the way Keystone's own query layer
 * does.
 */

const { PrismaClient } = require("@prisma/client");

const isDryRun = process.argv.includes("--dry-run");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.NODE_ENV === "development"
      ? "file:./keystone.db"
      : process.env.DATABASE_DEV || "";
}

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Set it to the database you want to seed."
  );
  process.exit(1);
}

// MediaPipe's fixed blendshape output order (kBlendshapeNames) — mirrors
// yq-data's BLENDSHAPE_NAMES, which FaceLandmarkReceiver uses verbatim as
// channel labels (including the leading underscore on "_neutral").
const BLENDSHAPE_NAMES = [
  "_neutral", "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft",
  "browOuterUpRight", "cheekPuff", "cheekSquintLeft", "cheekSquintRight",
  "eyeBlinkLeft", "eyeBlinkRight", "eyeLookDownLeft", "eyeLookDownRight",
  "eyeLookInLeft", "eyeLookInRight", "eyeLookOutLeft", "eyeLookOutRight",
  "eyeLookUpLeft", "eyeLookUpRight", "eyeSquintLeft", "eyeSquintRight",
  "eyeWideLeft", "eyeWideRight", "jawForward", "jawLeft", "jawOpen", "jawRight",
  "mouthClose", "mouthDimpleLeft", "mouthDimpleRight", "mouthFrownLeft",
  "mouthFrownRight", "mouthFunnel", "mouthLeft", "mouthLowerDownLeft",
  "mouthLowerDownRight", "mouthPressLeft", "mouthPressRight", "mouthPucker",
  "mouthRight", "mouthRollLower", "mouthRollUpper", "mouthShrugLower",
  "mouthShrugUpper", "mouthSmileLeft", "mouthSmileRight", "mouthStretchLeft",
  "mouthStretchRight", "mouthUpperUpLeft", "mouthUpperUpRight", "noseSneerLeft",
  "noseSneerRight",
];

const BLOCKS = [
  {
    title: "Band Power (Muse)",
    slug: "muse-band-power",
    requirementLabel: "Requires a Muse headband",
    inputs: [
      { id: "eeg", receiver: "muse", label: "Muse headband", required: true },
    ],
    outputs: [
      {
        node: "bands",
        modality: "eeg",
        valueType: "numeric",
        channels: [
          { index: 0, label: "Delta", unit: "µV²" },
          { index: 1, label: "Theta", unit: "µV²" },
          { index: 2, label: "Alpha", unit: "µV²" },
          { index: 3, label: "Low beta", unit: "µV²" },
          { index: 4, label: "High beta", unit: "µV²" },
          { index: 5, label: "Gamma", unit: "µV²" },
        ],
      },
    ],
    graph: {
      nodes: [
        { id: "eeg", receiver: "eeg", stream: "eeg" },
        { id: "clean", method: "filtering", parameters: { kind: "bandpass", cutoff: [1, 45] } },
        { id: "window", method: "windowing", parameters: { size: 2, hop: 0.5 } },
        { id: "bands", method: "band_power", label: "Band power" },
      ],
      edges: [
        { from: ["eeg"], to: ["clean"] },
        { from: ["clean"], to: ["window"] },
        { from: ["window"], to: ["bands"] },
      ],
      record: { nodes: ["bands"] },
    },
    settingsSchema: [
      { key: "windowSize", label: "Window size", type: "number", unit: "sec", default: 2 },
      { key: "windowHop", label: "Update interval", type: "number", unit: "sec", default: 0.5 },
    ],
  },
  {
    title: "EEG Synchrony",
    slug: "eeg-synchrony-muse",
    requirementLabel: "Requires two Muse headbands",
    inputs: [
      { id: "eeg-a", receiver: "muse", label: "Headset A", required: true },
      { id: "eeg-b", receiver: "muse", label: "Headset B", required: true },
    ],
    // Correlation (method "connectivity") always emits a single "synchrony"
    // stream off its node regardless of mode, so `stream` is left off here too.
    // In the default "paired" mode it correlates channel i of A with channel i
    // of B, labelling each from A's channel names — Muse's first 4 electrodes,
    // TP9/AF7/AF8/TP10 (muse-js's channelNames, AUX excluded by default).
    outputs: [
      {
        node: "sync",
        modality: "eeg",
        valueType: "numeric",
        channels: [
          { index: 0, label: "TP9", unit: "r" },
          { index: 1, label: "AF7", unit: "r" },
          { index: 2, label: "AF8", unit: "r" },
          { index: 3, label: "TP10", unit: "r" },
        ],
      },
    ],
    graph: {
      nodes: [
        { id: "eeg-a", receiver: "eeg-a", stream: "eeg" },
        { id: "eeg-b", receiver: "eeg-b", stream: "eeg" },
        { id: "win-a", method: "windowing", parameters: { size: 2, hop: 0.5 } },
        { id: "win-b", method: "windowing", parameters: { size: 2, hop: 0.5 } },
        { id: "sync", method: "connectivity", label: "Synchrony", parameters: { mode: "paired" } },
      ],
      edges: [
        { from: ["eeg-a"], to: ["win-a"] },
        { from: ["eeg-b"], to: ["win-b"] },
        { from: ["win-a"], to: ["sync", "a"] },
        { from: ["win-b"], to: ["sync", "b"] },
      ],
      record: { nodes: ["sync"] },
    },
    settingsSchema: [
      { key: "mode", label: "Correlation mode", type: "select", options: ["paired", "matrix", "mean"], default: "paired" },
    ],
  },
  {
    title: "Face Landmarker",
    slug: "face-landmarker",
    requirementLabel: "Requires camera access",
    inputs: [
      { id: "camera", receiver: "face_landmark", label: "Camera", required: true },
    ],
    // FaceLandmarkReceiver emits two streams off the same node by default
    // (emitHeadPose defaults true) — "blendshapes" and "head_pose", named
    // without a face suffix since numFaces defaults to 1.
    outputs: [
      {
        node: "camera",
        stream: "blendshapes",
        modality: "video",
        valueType: "numeric",
        channels: BLENDSHAPE_NAMES.map((label, index) => ({ index, label })),
      },
      {
        node: "camera",
        stream: "head_pose",
        modality: "video",
        valueType: "numeric",
        channels: [
          { index: 0, label: "yaw", unit: "deg" },
          { index: 1, label: "pitch", unit: "deg" },
          { index: 2, label: "roll", unit: "deg" },
        ],
      },
    ],
    graph: {
      nodes: [{ id: "camera", receiver: "camera", label: "Face blendshapes" }],
      edges: [],
      record: { nodes: ["camera"] },
    },
    settingsSchema: [
      { key: "numFaces", label: "Faces to track", type: "number", default: 1 },
      { key: "emitHeadPose", label: "Include head pose", type: "select", options: ["true", "false"], default: "true" },
    ],
  },
  {
    title: "Face Emotion",
    slug: "face-emotion",
    requirementLabel: "Requires camera access",
    inputs: [
      { id: "camera", receiver: "face_emotion", label: "Camera", required: true },
    ],
    // FaceEmotionReceiver emits a single stream ("expressions") per node, so
    // `stream` is left off — findOutput() matches on node alone in that case.
    outputs: [
      {
        node: "camera",
        modality: "video",
        valueType: "numeric",
        channels: [
          { index: 0, label: "neutral" }, { index: 1, label: "happy" },
          { index: 2, label: "sad" }, { index: 3, label: "angry" },
          { index: 4, label: "fearful" }, { index: 5, label: "disgusted" },
          { index: 6, label: "surprised" },
        ],
      },
    ],
    graph: {
      nodes: [{ id: "camera", receiver: "camera", label: "Facial expression" }],
      edges: [],
      record: { nodes: ["camera"] },
    },
    settingsSchema: [
      { key: "detector", label: "Detector", type: "select", options: ["tiny", "ssd"], default: "tiny" },
    ],
  },
];

async function main() {
  const prisma = new PrismaClient();

  let created = 0;
  let skipped = 0;

  try {
    for (const block of BLOCKS) {
      const existing = await prisma.dataSourceBlock.findUnique({
        where: { slug: block.slug },
        select: { id: true },
      });
      if (existing) {
        console.log(`Skipped "${block.title}" — slug "${block.slug}" already exists.`);
        skipped += 1;
        continue;
      }

      if (isDryRun) {
        console.log(`Would create "${block.title}" (${block.slug}).`);
        created += 1;
        continue;
      }

      await prisma.dataSourceBlock.create({
        data: {
          title: block.title,
          slug: block.slug,
          requirementLabel: block.requirementLabel,
          isOfficial: true,
          published: true,
          inputs: JSON.stringify(block.inputs),
          outputs: JSON.stringify(block.outputs),
          graph: JSON.stringify(block.graph),
          settingsSchema: JSON.stringify(block.settingsSchema),
        },
      });
      console.log(`Created "${block.title}" (${block.slug}).`);
      created += 1;
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(
    [
      isDryRun ? "\nDry run, nothing was written." : "\nSeed finished.",
      `created: ${created}`,
      `skipped (already existed): ${skipped}`,
    ].join("\n  ")
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
