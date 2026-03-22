/**
 * Unsigned upload to Cloudinary (same preset as lab.js assemble).
 * Returns secure URL + public_id for persisting on MediaAsset.
 */
const CLOUD_NAME = "mindhive-science";
const UPLOAD_PRESET = "mindhive";

function safePublicIdSegment(name) {
  const base = String(name || "image")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40);
  return base || "image";
}

/**
 * @param {File} file
 * @param {string} scopeId - Board id used for namespacing uploads in Cloudinary
 * @returns {Promise<{ secureUrl: string, publicId: string }>}
 */
export async function uploadMediaImageToCloudinary(file, scopeId) {
  const formData = new FormData();
  formData.append("file", file);
  const publicId = `media-library/${scopeId}/${Date.now()}_${safePublicIdSegment(file.name)}`;
  formData.append("public_id", publicId);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed (${res.status})`);
  }

  const data = await res.json();
  if (!data.secure_url) {
    throw new Error("Upload response missing secure_url");
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id || publicId,
  };
}
