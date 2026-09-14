// Maps a DataSourceBlock input's declared `receiver` key to a live yq-data
// receiver instance. yq-data is browser-only (Web Bluetooth, AudioWorklet,
// getUserMedia), so it is always imported dynamically from here.

// Receiver types that read pixels off a shared <video> element rather than
// owning a connection of their own — useSourceRuntime mounts a hidden video
// element for these before calling createReceiver.
const CAMERA_RECEIVER_TYPES = new Set(["video", "face_landmark", "face_emotion"]);

export function needsVideoElement(receiverType) {
  return CAMERA_RECEIVER_TYPES.has(receiverType);
}

// yq-data's vision receivers (FaceLandmarkReceiver, FaceEmotionReceiver, ...)
// read frames off a <video> element but never open the camera themselves —
// that's VideoReceiver's job (see yq-data's "one camera, several analyses").
// This opens one per vision input rather than sharing a single camera across
// a block's inputs, at the cost of one extra getUserMedia prompt when a block
// declares more than one vision input on the same camera.
async function openCamera(yq, videoElement) {
  const camera = new yq.VideoReceiver(videoElement);
  await camera.connect();
  await camera.startStream();
  return camera;
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

// Returns { receiver, camera }. `receiver` is what the caller connects,
// starts and attaches to the pipeline; `camera` is only set for vision
// receivers that needed a VideoReceiver opened underneath them first — the
// caller keeps it only to disconnect it later, it never joins the pipeline.
export async function createReceiver(receiverType, { videoElement } = {}) {
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
      return { receiver: new yq.VideoReceiver(videoElement) };
    case "face_landmark": {
      if (!videoElement) {
        throw new Error("A camera input needs a video element to connect to.");
      }
      const camera = await openCamera(yq, videoElement);
      return { receiver: new yq.FaceLandmarkReceiver(videoElement), camera };
    }
    case "face_emotion": {
      if (!videoElement) {
        throw new Error("A camera input needs a video element to connect to.");
      }
      const camera = await openCamera(yq, videoElement);
      return { receiver: new yq.FaceEmotionReceiver(videoElement), camera };
    }
    case "audio":
    case "microphone":
      return { receiver: new yq.MicrophoneReceiver() };
    case "lsl":
      return { receiver: new yq.LSLReceiver() };
    case "marker":
      return { receiver: new yq.MarkerReceiver() };
    default:
      throw new Error(`No receiver is registered for "${receiverType}" yet.`);
  }
}

// A friendly device label for the connected-state subtitle ("Muse F1DH",
// "MacBook Pro Camera"), read off whatever the receiver ended up connected to.
export function describeReceiver(receiver, receiverType) {
  if (receiverType === "video") {
    const track = receiver?.videoStream?.getVideoTracks?.()[0];
    return track?.label || "Camera";
  }
  if (!receiver?.deviceName) return null;
  return receiver?.deviceID
    ? `${receiver.deviceName} ${receiver.deviceID}`
    : receiver.deviceName;
}
