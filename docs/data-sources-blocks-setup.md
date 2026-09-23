# Data source blocks — setup reference

Reference for wiring up the first five `yq-data` catalog blocks (Band Power,
EEG Synchrony, EMOTIV, Face Landmarker, Face Emotion): what's already been
changed in code, and what still needs to be added as data through the
Keystone Admin UI.

## Code changes already applied

| File | Change |
|---|---|
| `frontend/components/Studies/Run/DataSources/receivers.js` | `createReceiver()` now returns `{ receiver, camera }` instead of a bare receiver. Added `needsVideoElement()`. Added `face_landmark`/`face_emotion` cases, each opening a real `VideoReceiver` on the shared `<video>` element first (yq-data's vision receivers never open the camera themselves). `emotiv` now builds credentials from env instead of `new EMOTIVReceiver()` with no args. |
| `frontend/components/Studies/Run/DataSources/useSourceRuntime.js` | Mounts the hidden `<video>` element for any camera-backed input (`video`, `face_landmark`, `face_emotion`), not just `"video"`. Tracks/disconnects the underlying camera receiver separately from the attached one. `pipeline.attachReceiver()` is now keyed by `input.id` instead of `input.receiver` — needed so two inputs of the same device type don't collide. |
| `frontend/lib/yqAggregateRecorder.js` | Same `attachReceiver` keying fix (`input.id`), in both `start()` and `attachReceiver()` — it builds its own separate `Pipeline` and had the identical bug. |
| `frontend/lib/yqOutputs.js` (new) | Block `outputs` are matched by graph `node` (+ `stream` name) instead of full `streamID`, which starts with the device's runtime ID (e.g. a Muse's Bluetooth name) and so can't be written ahead of time. Used by the preview buffers, the builder's Outputs chips and `excludedChannels`, and the recorder's channel exclusion. Recorded aggregates are still keyed by the real `streamID`. |
| `frontend/components/Builder/Project/Builder/DataSources/SettingsTab.js` | `settingsSchema` fields can be `"type": "boolean"` (rendered as a checkbox). |
| `frontend/.env.example` | Added `NEXT_PUBLIC_EMOTIV_CLIENT_ID` / `NEXT_PUBLIC_EMOTIV_CLIENT_SECRET`. |
| `frontend/next.config.js` | Added `wss://localhost:6868` to the CSP's `connect-src` — EMOTIV's Cortex API, otherwise silently blocked regardless of credentials. |

**Before testing EMOTIV:** set `NEXT_PUBLIC_EMOTIV_CLIENT_ID` and
`NEXT_PUBLIC_EMOTIV_CLIENT_SECRET` in `frontend/.env` (or `.env.local`) — get
credentials at https://www.emotiv.com/my-account/cortex-apps/. These are
`NEXT_PUBLIC_`, so they're one app-level registration, not per-researcher.

**Known gap, not yet fixed:** `settingsSchema`'s advanced fields (e.g. a
block's "Window size" control in the builder) aren't wired into the actual
graph at runtime — both `useSourceRuntime.js` and `yqAggregateRecorder.js`
build the `Pipeline` straight from `block.graph` with no override step. The
five blocks below will work with their built-in defaults; changing an
Advanced Option in the study builder won't do anything yet.

## Adding the five blocks

Go to the Keystone Admin UI (`http://localhost:4444`, or whatever origin your
`Start All` task uses) → **Data Source Blocks** → **Create**.

Each block below is split into two kinds of values — don't paste one into the
other:

- **Backend fields** — ordinary Admin UI form inputs (text boxes, checkboxes).
  Type/paste these directly.
- **JSON fields** — `inputs`, `outputs`, `graph`, `settingsSchema`. Each one
  renders as its own raw-JSON editor in the form. The code block under each
  heading is the *value for that one field* — paste it into that field's
  editor, not all four together.

For every block: leave **author** empty (built-in library block, not
user-authored), and check **isOfficial** and **published**.

---

### 1. Band Power (Muse)

**Backend fields**

| Field | Value |
|---|---|
| title | `Band Power (Muse)` |
| slug | `muse-band-power` |
| requirementLabel | `Requires a Muse headband` |

**`inputs`**
```json
[{ "id": "eeg", "receiver": "muse", "label": "Muse headband", "required": true }]
```

**`outputs`**
```json
[{
  "node": "bands",
  "modality": "eeg", "valueType": "numeric",
  "channels": [
    { "index": 0, "label": "Delta", "unit": "µV²" },
    { "index": 1, "label": "Theta", "unit": "µV²" },
    { "index": 2, "label": "Alpha", "unit": "µV²" },
    { "index": 3, "label": "Low beta", "unit": "µV²" },
    { "index": 4, "label": "High beta", "unit": "µV²" },
    { "index": 5, "label": "Gamma", "unit": "µV²" }
  ]
}]
```

**`graph`**
```json
{
  "nodes": [
    { "id": "eeg", "receiver": "eeg", "stream": "eeg" },
    { "id": "clean", "method": "filtering", "parameters": { "kind": "bandpass", "cutoff": [1, 45] } },
    { "id": "window", "method": "windowing", "parameters": { "size": 2, "hop": 0.5 } },
    { "id": "bands", "method": "band_power", "label": "Band power" }
  ],
  "edges": [
    { "from": ["eeg"], "to": ["clean"] },
    { "from": ["clean"], "to": ["window"] },
    { "from": ["window"], "to": ["bands"] }
  ],
  "record": { "nodes": ["bands"] }
}
```

**`settingsSchema`**
```json
[
  { "key": "windowSize", "label": "Window size", "type": "number", "unit": "sec", "default": 2 },
  { "key": "windowHop", "label": "Update interval", "type": "number", "unit": "sec", "default": 0.5 }
]
```

---

### 2. EEG Synchrony (2 headbands)

**Backend fields**

| Field | Value |
|---|---|
| title | `EEG Synchrony (2 headbands)` |
| slug | `eeg-synchrony-muse` |
| requirementLabel | `Requires two Muse headbands` |

**`inputs`**
```json
[
  { "id": "eeg-a", "receiver": "muse", "label": "Headset A", "required": true },
  { "id": "eeg-b", "receiver": "muse", "label": "Headset B", "required": true }
]
```

**`outputs`**
```json
[{
  "node": "sync",
  "modality": "eeg", "valueType": "numeric",
  "channels": [
    { "index": 0, "label": "TP9", "unit": "r" },
    { "index": 1, "label": "AF7", "unit": "r" },
    { "index": 2, "label": "AF8", "unit": "r" },
    { "index": 3, "label": "TP10", "unit": "r" }
  ]
}]
```

**`graph`**
```json
{
  "nodes": [
    { "id": "eeg-a", "receiver": "eeg-a", "stream": "eeg" },
    { "id": "eeg-b", "receiver": "eeg-b", "stream": "eeg" },
    { "id": "win-a", "method": "windowing", "parameters": { "size": 2, "hop": 0.5 } },
    { "id": "win-b", "method": "windowing", "parameters": { "size": 2, "hop": 0.5 } },
    { "id": "sync", "method": "connectivity", "label": "Synchrony", "parameters": { "mode": "paired" } }
  ],
  "edges": [
    { "from": ["eeg-a"], "to": ["win-a"] },
    { "from": ["eeg-b"], "to": ["win-b"] },
    { "from": ["win-a"], "to": ["sync", "a"] },
    { "from": ["win-b"], "to": ["sync", "b"] }
  ],
  "record": { "nodes": ["sync"] }
}
```

**`settingsSchema`**
```json
[
  { "key": "mode", "label": "Correlation mode", "type": "select", "options": ["paired", "matrix", "mean"], "default": "paired" }
]
```

---

### 3. EMOTIV Headset

**Backend fields**

| Field | Value |
|---|---|
| title | `EMOTIV Headset` |
| slug | `emotiv-eeg` |
| requirementLabel | `Requires EMOTIV Launcher running locally` |

**`inputs`**
```json
[{ "id": "eeg", "receiver": "emotiv", "label": "EMOTIV headset", "required": true }]
```

**`outputs`**
```json
[{ "node": "eeg", "modality": "eeg", "valueType": "numeric", "channels": [] }]
```

**`graph`**
```json
{
  "nodes": [{ "id": "eeg", "receiver": "eeg", "stream": "eeg", "label": "EMOTIV EEG" }],
  "edges": [],
  "record": { "nodes": ["eeg"] }
}
```

**`settingsSchema`**
```json
[]
```

---

### 4. Face Landmarker

**Backend fields**

| Field | Value |
|---|---|
| title | `Face Landmarker` |
| slug | `face-landmarker` |
| requirementLabel | `Requires camera access` |

**`inputs`**
```json
[{ "id": "face-landmarker", "receiver": "face_landmark", "label": "Camera", "required": true }]
```

**`outputs`** — not cosmetic: outputs are matched by graph `node` plus stream name (`frontend/lib/yqOutputs.js`), and the preview and channel exclusion only see channels listed here — so all 52 are listed, in MediaPipe's order (`_neutral` first). The node also emits `head_pose`; it isn't listed because only the blendshapes are surfaced.

`"stream": "blendshapes"` assumes one tracked face. With `numFaces` > 1 the receiver suffixes every stream per face — `blendshapes_face_1`, `blendshapes_face_2`, … — so this list will need one entry per face once the `numFaces` setting is wired in.
```json
[
  {
    "node": "face-landmarker", "stream": "blendshapes",
    "modality": "video", "valueType": "numeric",
    "channels": [
      { "index": 0, "label": "_neutral" }, { "index": 1, "label": "browDownLeft" },
      { "index": 2, "label": "browDownRight" }, { "index": 3, "label": "browInnerUp" },
      { "index": 4, "label": "browOuterUpLeft" }, { "index": 5, "label": "browOuterUpRight" },
      { "index": 6, "label": "cheekPuff" }, { "index": 7, "label": "cheekSquintLeft" },
      { "index": 8, "label": "cheekSquintRight" }, { "index": 9, "label": "eyeBlinkLeft" },
      { "index": 10, "label": "eyeBlinkRight" }, { "index": 11, "label": "eyeLookDownLeft" },
      { "index": 12, "label": "eyeLookDownRight" }, { "index": 13, "label": "eyeLookInLeft" },
      { "index": 14, "label": "eyeLookInRight" }, { "index": 15, "label": "eyeLookOutLeft" },
      { "index": 16, "label": "eyeLookOutRight" }, { "index": 17, "label": "eyeLookUpLeft" },
      { "index": 18, "label": "eyeLookUpRight" }, { "index": 19, "label": "eyeSquintLeft" },
      { "index": 20, "label": "eyeSquintRight" }, { "index": 21, "label": "eyeWideLeft" },
      { "index": 22, "label": "eyeWideRight" }, { "index": 23, "label": "jawForward" },
      { "index": 24, "label": "jawLeft" }, { "index": 25, "label": "jawOpen" },
      { "index": 26, "label": "jawRight" }, { "index": 27, "label": "mouthClose" },
      { "index": 28, "label": "mouthDimpleLeft" }, { "index": 29, "label": "mouthDimpleRight" },
      { "index": 30, "label": "mouthFrownLeft" }, { "index": 31, "label": "mouthFrownRight" },
      { "index": 32, "label": "mouthFunnel" }, { "index": 33, "label": "mouthLeft" },
      { "index": 34, "label": "mouthLowerDownLeft" }, { "index": 35, "label": "mouthLowerDownRight" },
      { "index": 36, "label": "mouthPressLeft" }, { "index": 37, "label": "mouthPressRight" },
      { "index": 38, "label": "mouthPucker" }, { "index": 39, "label": "mouthRight" },
      { "index": 40, "label": "mouthRollLower" }, { "index": 41, "label": "mouthRollUpper" },
      { "index": 42, "label": "mouthShrugLower" }, { "index": 43, "label": "mouthShrugUpper" },
      { "index": 44, "label": "mouthSmileLeft" }, { "index": 45, "label": "mouthSmileRight" },
      { "index": 46, "label": "mouthStretchLeft" }, { "index": 47, "label": "mouthStretchRight" },
      { "index": 48, "label": "mouthUpperUpLeft" }, { "index": 49, "label": "mouthUpperUpRight" },
      { "index": 50, "label": "noseSneerLeft" }, { "index": 51, "label": "noseSneerRight" }
    ]
  }
]
```

**`graph`**
```json
{
  "nodes": [{ "id": "face-landmarker", "receiver": "face-landmarker", "label": "Face blendshapes" }],
  "edges": [],
  "record": { "nodes": ["face-landmarker"] }
}
```

**`settingsSchema`**
```json
[
  { "key": "numFaces", "label": "Faces to track", "type": "number", "default": 1 }
]
```

---

### 5. Face Emotion

**Backend fields**

| Field | Value |
|---|---|
| title | `Face Emotion` |
| slug | `face-emotion` |
| requirementLabel | `Requires camera access` |

**`inputs`**
```json
[{ "id": "face-emotion", "receiver": "face_emotion", "label": "Camera", "required": true }]
```

**`outputs`**
```json
[{
  "node": "face-emotion", "stream": "expressions",
  "modality": "video", "valueType": "numeric",
  "channels": [
    { "index": 0, "label": "neutral" }, { "index": 1, "label": "happy" },
    { "index": 2, "label": "sad" }, { "index": 3, "label": "angry" },
    { "index": 4, "label": "fearful" }, { "index": 5, "label": "disgusted" },
    { "index": 6, "label": "surprised" }
  ]
}]
```

**`graph`**
```json
{
  "nodes": [{ "id": "face-emotion", "receiver": "face-emotion", "label": "Facial expression" }],
  "edges": [],
  "record": { "nodes": ["face-emotion"] }
}
```

**`settingsSchema`**
```json
[
  { "key": "detector", "label": "Detector", "type": "select", "options": ["tiny", "ssd"], "default": "tiny" }
]
```

## Why Band Power and EMOTIV aren't one block

The processing graph (`filtering → windowing → band_power`) is device-agnostic
— it reads sampling rate off each packet's own metadata and averages across
channels by default, so a 4-channel Muse and a 14-channel EMOTIV headset both
produce the same six band channels. What isn't interchangeable is
`inputs[].receiver`: it's a literal switch key `createReceiver()` dispatches
on to decide which yq-data class to build, and Muse (Web Bluetooth) vs EMOTIV
(Cortex WebSocket + credentials) are genuinely different connection flows. So
two blocks for now, sharing nearly the same `graph`.

A later fix, entirely on the MindHive side (no `yq-data` changes needed):
a generic `"eeg"` input type, a device picker on the connect screen, and the
chosen device stored in `StudyDataSource.inputBindings` — `createReceiver()`
would read that instead of a fixed block-level string. Worth doing once
duplicate blocks actually start to hurt, not before.
