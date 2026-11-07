// Maps a DataSourceBlock input's declared `receiver` key to a live yq-data
// receiver instance. yq-data is browser-only (Web Bluetooth, AudioWorklet,
// getUserMedia), so it is always imported dynamically from here.

// Receiver types that read pixels off a shared <video> element rather than
// owning a connection of their own — useSourceRuntime mounts a hidden video
// element for these before calling createReceiver.
const CAMERA_RECEIVER_TYPES = new Set([
  "video",
  "face_landmark",
  "face_landmark_pair",
  "face_emotion",
  "pose",
  "rppg",
]);

export function needsVideoElement(receiverType) {
  return CAMERA_RECEIVER_TYPES.has(receiverType);
}

// yq-data's vision receivers (FaceLandmarkReceiver, FaceEmotionReceiver, ...)
// read frames off a <video> element but never open the camera themselves —
// that's VideoReceiver's job (see yq-data's "one camera, several analyses").
// This opens one per vision input rather than sharing a single camera across
// a block's inputs, at the cost of one extra getUserMedia prompt when a block
// declares more than one vision input on the same camera.
async function openCamera(yq, videoElement, deviceId) {
  const camera = new yq.VideoReceiver(videoElement, deviceId ? { deviceId } : undefined);
  await camera.connect();
  await camera.startStream();
  return camera;
}

// What yq-data's FaceOverlay draws on the preview for each camera-backed
// receiver. The geometry it reads is only emitted when asked for (see
// createReceiver), so a receiver with no entry here asks for none.
const OVERLAY_LAYERS = {
  face_landmark: { box: false, landmarks: false, connections: "mesh" },
  face_landmark_pair: { box: false, landmarks: false, connections: "contours" },
  face_emotion: { box: true, label: true, landmarks: false, connections: "contours" },
  // The joints as points, joined by MediaPipe's skeleton.
  pose: { box: false, label: false, landmarks: true, connections: "contours" },
};

export function overlayLayers(receiverType) {
  return OVERLAY_LAYERS[receiverType] || null;
}

// Cortex client credentials identify the MindHive app to EMOTIV, not the
// individual researcher or participant — one app-level registration covers
// every headset paired to it, so these are read from env rather than stored
// per data source.
function emotivCredentials() {
  const clientId = process.env.NEXT_PUBLIC_EMOTIV_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_EMOTIV_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "EMOTIV is not configured: set NEXT_PUBLIC_EMOTIV_CLIENT_ID and NEXT_PUBLIC_EMOTIV_CLIENT_SECRET."
    );
  }
  return { clientId, clientSecret };
}

// `deviceId` picks a specific camera for the camera-backed receivers; without
// one the browser's default is used.
//
// Returns { receiver, camera }. `receiver` is what the caller connects,
// starts and attaches to the pipeline; `camera` is only set for vision
// receivers that needed a VideoReceiver opened underneath them first — the
// caller keeps it only to disconnect it later, it never joins the pipeline.
export async function createReceiver(receiverType, { videoElement, deviceId } = {}) {
  const yq = await import("yq-data");
  switch (receiverType) {
    case "muse":
      return { receiver: new yq.MuseReceiver() };
    case "emotiv":
      return { receiver: new yq.EMOTIVReceiver(emotivCredentials()) };
    case "video":
      if (!videoElement) {
        throw new Error("A camera input needs a video element to connect to.");
      }
      return { receiver: new yq.VideoReceiver(videoElement, deviceId ? { deviceId } : undefined) };
    case "face_landmark": {
      if (!videoElement) {
        throw new Error("A camera input needs a video element to connect to.");
      }
      const camera = await openCamera(yq, videoElement, deviceId);
      // The landmarks only feed the preview overlay; the graph records nodes
      // by declared output (see yqAggregateRecorder), so they are never saved.
      return {
        receiver: new yq.FaceLandmarkReceiver(videoElement, { emitLandmarks: true }),
        camera,
      };
    }
    // Two people in one frame, each on their own blendshape stream
    // (blendshapes_face_1 / _face_2) — what a face synchrony graph reads.
    case "face_landmark_pair": {
      if (!videoElement) {
        throw new Error("A camera input needs a video element to connect to.");
      }
      const camera = await openCamera(yq, videoElement, deviceId);
      return {
        receiver: new yq.FaceLandmarkReceiver(videoElement, {
          numFaces: 2,
          emitLandmarks: true,
        }),
        camera,
      };
    }
    case "pose":
    case "rppg": {
      if (!videoElement) {
        throw new Error("A camera input needs a video element to connect to.");
      }
      const camera = await openCamera(yq, videoElement, deviceId);
      const Receiver = receiverType === "pose" ? yq.PoseReceiver : yq.RPPGReceiver;
      return { receiver: new Receiver(videoElement), camera };
    }
    case "face_emotion": {
      if (!videoElement) {
        throw new Error("A camera input needs a video element to connect to.");
      }
      const camera = await openCamera(yq, videoElement, deviceId);
      return {
        receiver: new yq.FaceEmotionReceiver(videoElement, {
          emitFaceBox: true,
          emitLandmarks: true,
        }),
        camera,
      };
    }
    case "audio":
    case "microphone":
      return { receiver: new yq.MicrophoneReceiver() };
    // Emits per phrase, not per interval — nothing arrives while nobody speaks.
    // `emitAffect` adds the valence/arousal stream the old YQ device had.
    case "voice_emotion":
      return { receiver: new yq.VoiceEmotionReceiver({ emitAffect: true }) };
    case "lsl":
      return { receiver: new yq.LSLReceiver() };
    case "marker":
      return { receiver: new yq.MarkerReceiver() };
    default:
      throw new Error(`No receiver is registered for "${receiverType}" yet.`);
  }
}

// Receivers disagree about what `connect` takes: EMOTIV must be told which
// Cortex streams to subscribe to (raw EEG and motion; band power is derived by
// the graph, as for Muse), the rest take nothing.
export async function connectReceiver(receiverType, receiver) {
  if (receiverType === "emotiv") {
    await receiver.connect(["eeg", "mot"]);
  } else {
    await receiver.connect();
  }
  await receiver.startStream?.();
}

// The camera track a camera-backed input is reading: held by the receiver
// itself for "video", by the VideoReceiver under it for the vision receivers.
function cameraTrack(receiver, camera) {
  return (camera?.videoStream ?? receiver?.videoStream)?.getVideoTracks?.()[0];
}

// A friendly device label for the connected-state subtitle ("Muse F1DH",
// "MacBook Pro Camera"), read off whatever the receiver ended up connected to.
export function describeReceiver(receiver, receiverType, camera) {
  if (needsVideoElement(receiverType)) {
    return cameraTrack(receiver, camera)?.label || "Camera";
  }
  if (!receiver?.deviceName) return null;
  return receiver?.deviceID
    ? `${receiver.deviceName} ${receiver.deviceID}`
    : receiver.deviceName;
}

// The cameras the browser offers and which one this input is on, for the
// preview's picker. Labels are only filled in once camera permission has been
// granted, which connecting has just done.
export async function cameraChoices(receiver, camera) {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return {
    cameraId: cameraTrack(receiver, camera)?.getSettings?.().deviceId,
    cameras: devices
      .filter((device) => device.kind === "videoinput")
      .map((device) => ({ id: device.deviceId, label: device.label || "Camera" })),
  };
}
