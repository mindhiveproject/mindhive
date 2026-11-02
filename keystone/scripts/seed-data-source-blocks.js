/**
 * Dev bootstrap: inserts the built-in yq-data catalog blocks a new developer
 * needs to exercise the study builder's data sources locally, without
 * clicking through the Keystone Admin UI (see docs/data-sources-blocks-setup.md
 * for the by-hand version this replaces).
 *
 * Seeds the yq-data catalog: everything You-Quantified's Data panel offered
 * (Muse, EMOTIV, Face Landmarker, Face Synchrony, Face Emotion, Pose, Video
 * Heart Rate, Audio Volume, Voice Emotion), one block per concept, plus EEG
 * Synchrony. EMOTIV blocks need Cortex credentials per-environment to actually
 * connect (NEXT_PUBLIC_EMOTIV_CLIENT_ID / _SECRET) — the rows seed regardless.
 *
 * Not seeded: LSL (its streams are whatever the lab's relay carries, so there
 * are no outputs to declare) and Muse's raw PPG (channel labels differ between
 * Muse 2 and Muse S; Heart Rate (Muse) covers the PPG sensor).
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
 * land as plain TEXT columns on SQLite, so they're written pre-stringified
 * there. On Postgres they're real jsonb columns and must be passed as objects —
 * a pre-stringified value gets stored as a JSON *string*, which the frontend
 * then can't iterate.
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

// MediaPipe Pose's 33 landmarks, in index order — mirrors yq-data's
// POSE_LANDMARK_NAMES. PoseReceiver flattens them to x, y, z per landmark and
// labels each channel "<landmark> <component>".
const POSE_LANDMARK_NAMES = [
  "nose", "left eye (inner)", "left eye", "left eye (outer)",
  "right eye (inner)", "right eye", "right eye (outer)", "left ear",
  "right ear", "mouth (left)", "mouth (right)", "left shoulder",
  "right shoulder", "left elbow", "right elbow", "left wrist", "right wrist",
  "left pinky", "right pinky", "left index", "right index", "left thumb",
  "right thumb", "left hip", "right hip", "left knee", "right knee",
  "left ankle", "right ankle", "left heel", "right heel", "left foot index",
  "right foot index",
];

// The six bands yq-data's BandPower reports, for any EEG source.
const BAND_CHANNELS = [
  { index: 0, label: "Delta", unit: "µV²" },
  { index: 1, label: "Theta", unit: "µV²" },
  { index: 2, label: "Alpha", unit: "µV²" },
  { index: 3, label: "Low beta", unit: "µV²" },
  { index: 4, label: "High beta", unit: "µV²" },
  { index: 5, label: "Gamma", unit: "µV²" },
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
        channels: BAND_CHANNELS,
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
    // of B, labelling each "<A's channel name> synchrony" — Muse's first 4
    // electrodes, TP9/AF7/AF8/TP10 (muse-js's channelNames, AUX excluded by
    // default).
    outputs: [
      {
        node: "sync",
        modality: "eeg",
        valueType: "numeric",
        channels: [
          { index: 0, label: "TP9 synchrony", unit: "r" },
          { index: 1, label: "AF7 synchrony", unit: "r" },
          { index: 2, label: "AF8 synchrony", unit: "r" },
          { index: 3, label: "TP10 synchrony", unit: "r" },
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
    // The receiver is also asked for "face_box" and "landmarks" (the preview
    // overlay's geometry, see receivers.js), so the node emits several streams
    // and the expressions have to be picked out by name.
    outputs: [
      {
        node: "camera",
        stream: "expressions",
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
  {
    title: "Raw EEG (Muse)",
    slug: "muse-raw-eeg",
    requirementLabel: "Requires a Muse headband",
    inputs: [
      { id: "eeg", receiver: "muse", label: "Muse headband", required: true },
    ],
    outputs: [
      {
        node: "eeg",
        modality: "eeg",
        valueType: "numeric",
        channels: [
          { index: 0, label: "TP9", unit: "µV" },
          { index: 1, label: "AF7", unit: "µV" },
          { index: 2, label: "AF8", unit: "µV" },
          { index: 3, label: "TP10", unit: "µV" },
        ],
      },
    ],
    graph: {
      nodes: [{ id: "eeg", receiver: "eeg", stream: "eeg" }],
      edges: [],
      record: { nodes: ["eeg"] },
    },
    settingsSchema: [],
  },
  {
    title: "Heart Rate (Muse)",
    slug: "muse-heart-rate",
    requirementLabel: "Requires a Muse 2 or Muse S headband",
    inputs: [
      { id: "ppg", receiver: "muse", label: "Muse headband", required: true },
    ],
    // Selected by label because the infrared channel sits at a different index
    // on Muse 2 and Muse S. HeartRate wants ~10s of signal to be stable.
    outputs: [
      {
        node: "heart_rate",
        modality: "ppg",
        valueType: "numeric",
        channels: [{ index: 0, label: "Heart Rate", unit: "bpm" }],
      },
    ],
    graph: {
      nodes: [
        { id: "ppg", receiver: "ppg", stream: "ppg" },
        { id: "pulse", method: "channel_selection", parameters: { labels: ["infrared"] } },
        { id: "window", method: "windowing", parameters: { size: 10, hop: 1 } },
        { id: "heart_rate", method: "heart_rate", label: "Heart rate" },
      ],
      edges: [
        { from: ["ppg"], to: ["pulse"] },
        { from: ["pulse"], to: ["window"] },
        { from: ["window"], to: ["heart_rate"] },
      ],
      record: { nodes: ["heart_rate"] },
    },
    settingsSchema: [],
  },
  {
    title: "Band Power (EMOTIV)",
    slug: "emotiv-band-power",
    requirementLabel: "Requires an EMOTIV headset and the EMOTIV Launcher",
    inputs: [
      { id: "eeg", receiver: "emotiv", label: "EMOTIV headset", required: true },
    ],
    outputs: [
      {
        node: "bands",
        modality: "eeg",
        valueType: "numeric",
        channels: BAND_CHANNELS,
      },
    ],
    graph: {
      nodes: [
        { id: "eeg", receiver: "eeg", stream: "raw_eeg" },
        { id: "window", method: "windowing", parameters: { size: 2, hop: 0.5 } },
        { id: "bands", method: "band_power", label: "Band power" },
      ],
      edges: [
        { from: ["eeg"], to: ["window"] },
        { from: ["window"], to: ["bands"] },
      ],
      record: { nodes: ["bands"] },
    },
    settingsSchema: [],
  },
  {
    title: "Raw EEG (EMOTIV)",
    slug: "emotiv-raw-eeg",
    requirementLabel: "Requires an EMOTIV headset and the EMOTIV Launcher",
    inputs: [
      { id: "eeg", receiver: "emotiv", label: "EMOTIV headset", required: true },
    ],
    // Cortex reports the electrode names itself; these are the fallbacks
    // yq-data uses for the 14-channel EPOC layout.
    outputs: [
      {
        node: "eeg",
        modality: "eeg",
        valueType: "numeric",
        channels: [
          "AF3", "F7", "F3", "FC5", "T7", "P7", "O1",
          "O2", "P8", "T8", "FC6", "F4", "F8", "AF4",
        ].map((label, index) => ({ index, label, unit: "µV" })),
      },
    ],
    graph: {
      nodes: [{ id: "eeg", receiver: "eeg", stream: "raw_eeg" }],
      edges: [],
      record: { nodes: ["eeg"] },
    },
    settingsSchema: [],
  },
  {
    title: "Motion (EMOTIV)",
    slug: "emotiv-motion",
    requirementLabel: "Requires an EMOTIV headset and the EMOTIV Launcher",
    inputs: [
      { id: "motion", receiver: "emotiv", label: "EMOTIV headset", required: true },
    ],
    // Orientation quaternion, accelerometer and magnetometer.
    outputs: [
      {
        node: "motion",
        modality: "accelerometer",
        valueType: "numeric",
        channels: [
          "Q0", "Q1", "Q2", "Q3", "ACCX", "ACCY", "ACCZ", "MAGX", "MAGY", "MAGZ",
        ].map((label, index) => ({ index, label })),
      },
    ],
    graph: {
      nodes: [{ id: "motion", receiver: "motion", stream: "motion_data" }],
      edges: [],
      record: { nodes: ["motion"] },
    },
    settingsSchema: [],
  },
  {
    title: "Face Synchrony",
    slug: "face-synchrony",
    requirementLabel: "Requires camera access",
    inputs: [
      { id: "camera", receiver: "face_landmark_pair", label: "Camera", required: true },
    ],
    // Two faces in one frame: the receiver names each one's blendshapes with a
    // face suffix, and Difference (similarity) scores each expression 0 to 1.
    // It labels every channel "Similarity in <expression>".
    outputs: [
      {
        node: "synchrony",
        modality: "video",
        valueType: "numeric",
        channels: BLENDSHAPE_NAMES.map((name, index) => ({
          index,
          label: `Similarity in ${name}`,
        })),
      },
    ],
    graph: {
      nodes: [
        { id: "first", receiver: "camera", stream: "blendshapes_face_1" },
        { id: "second", receiver: "camera", stream: "blendshapes_face_2" },
        {
          id: "synchrony",
          method: "difference",
          label: "Face synchrony",
          parameters: { mode: "similarity" },
        },
      ],
      edges: [
        { from: ["first"], to: ["synchrony", "a"] },
        { from: ["second"], to: ["synchrony", "b"] },
      ],
      record: { nodes: ["synchrony"] },
    },
    settingsSchema: [],
  },
  {
    title: "Pose Detection",
    slug: "pose-detection",
    requirementLabel: "Requires camera access",
    inputs: [
      { id: "camera", receiver: "pose", label: "Camera", required: true },
    ],
    // PoseReceiver emits a single "landmarks" stream (numPoses defaults to 1):
    // x, y, z per landmark in image-normalized coordinates.
    outputs: [
      {
        node: "pose",
        modality: "video",
        valueType: "numeric",
        channels: POSE_LANDMARK_NAMES.flatMap((landmark, i) =>
          ["x", "y", "z"].map((axis, j) => ({
            index: i * 3 + j,
            label: `${landmark} ${axis}`,
          }))
        ),
      },
    ],
    graph: {
      nodes: [
        {
          id: "pose",
          receiver: "camera",
          label: "Body landmarks",
          // What the receiver will announce (yq-data's pointStreamMetadata), so
          // `describe()` lists the landmarks vector parameters map to before a
          // camera is connected.
          expects: [
            {
              streamID: "pose:landmarks",
              modality: "video",
              channelCount: 99,
              additionalMetadata: {
                pointComponents: ["x", "y", "z"],
                topology: "mediapipe-pose-33",
                coordinateSpace: "image",
              },
            },
          ],
        },
      ],
      edges: [],
      record: { nodes: ["pose"] },
    },
    settingsSchema: [],
  },
  {
    title: "Video Heart Rate",
    slug: "video-heart-rate",
    requirementLabel: "Requires camera access",
    inputs: [
      { id: "camera", receiver: "rppg", label: "Camera", required: true },
    ],
    // rPPG: mean RGB of the forehead per frame; the green channel carries the
    // pulse. "spectral" is steadier than beat detection on camera signals. The
    // first reading takes ~10s, the length of the window.
    outputs: [
      {
        node: "heart_rate",
        modality: "video",
        valueType: "numeric",
        channels: [{ index: 0, label: "Heart Rate", unit: "bpm" }],
      },
    ],
    graph: {
      nodes: [
        { id: "rgb", receiver: "camera" },
        { id: "green", method: "channel_selection", parameters: { indices: [1] } },
        { id: "window", method: "windowing", parameters: { size: 10, hop: 1 } },
        {
          id: "heart_rate",
          method: "heart_rate",
          label: "Heart rate",
          parameters: { strategy: "spectral" },
        },
      ],
      edges: [
        { from: ["rgb"], to: ["green"] },
        { from: ["green"], to: ["window"] },
        { from: ["window"], to: ["heart_rate"] },
      ],
      record: { nodes: ["heart_rate"] },
    },
    settingsSchema: [],
  },
  {
    title: "Audio Volume",
    slug: "audio-volume",
    requirementLabel: "Requires microphone access",
    inputs: [
      { id: "audio", receiver: "microphone", label: "Microphone", required: true },
    ],
    // RMS labels each channel "<channel> volume"; a mono mic's channel is "mono".
    outputs: [
      {
        node: "volume",
        modality: "audio",
        valueType: "numeric",
        channels: [{ index: 0, label: "mono volume", unit: "dBFS" }],
      },
    ],
    graph: {
      nodes: [
        { id: "audio", receiver: "audio" },
        { id: "volume", method: "rms", label: "Volume", parameters: { decibels: true } },
      ],
      edges: [{ from: ["audio"], to: ["volume"] }],
      record: { nodes: ["volume"] },
    },
    settingsSchema: [],
  },
  {
    title: "Voice Emotion",
    slug: "voice-emotion",
    requirementLabel: "Requires microphone access",
    inputs: [
      { id: "voice", receiver: "voice_emotion", label: "Microphone", required: true },
    ],
    // Event-driven: one packet per spoken phrase, nothing while silent. The
    // receiver emits "emotion" (probabilities of N/A/S/H, summing to 1) and,
    // with emitAffect on, "affect" — valence = 3 × H, arousal = 1 − N, so
    // valence is not bounded by 1.
    outputs: [
      {
        node: "voice",
        stream: "emotion",
        modality: "audio",
        valueType: "numeric",
        channels: [
          { index: 0, label: "N" },
          { index: 1, label: "A" },
          { index: 2, label: "S" },
          { index: 3, label: "H" },
        ],
      },
      {
        node: "voice",
        stream: "affect",
        modality: "audio",
        valueType: "numeric",
        channels: [
          { index: 0, label: "valence" },
          { index: 1, label: "arousal" },
        ],
      },
    ],
    graph: {
      nodes: [{ id: "voice", receiver: "voice" }],
      edges: [],
      record: { nodes: ["voice"] },
    },
    settingsSchema: [],
  },
];

async function main() {
  const prisma = new PrismaClient();
  const isSqlite = process.env.DATABASE_URL.startsWith("file:");
  const toJson = (value) => (isSqlite ? JSON.stringify(value) : value);

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
          inputs: toJson(block.inputs),
          outputs: toJson(block.outputs),
          graph: toJson(block.graph),
          settingsSchema: toJson(block.settingsSchema),
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
