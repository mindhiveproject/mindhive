/**
 * Shared helpers for Opportunity intro video URLs and embed rendering.
 * Used by student ranking, explore detail, and preview flows.
 */

const DIRECT_VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|#|$)/i;

const FRAME_SRC_ALLOWED_HOSTS = new Set([
  "accounts.google.com",
  "docs.google.com",
  "drive.google.com",
  "calendar.google.com",
  "google.com",
  "youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "player.vimeo.com",
  "vimeo.com",
  "loom.com",
]);

const MAX_UNWRAP_DEPTH = 5;

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function decodeProofpointV2Param(encoded) {
  return encoded
    .replace(/-([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/_([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/_/g, "/");
}

function decodeProofpointV3Url(rawUrl) {
  const inlineMatch = rawUrl.match(/\/v\d+\/__(https?:\/\/.+?)(?:__|;|$)/);
  if (inlineMatch) return inlineMatch[1];

  try {
    const outer = new URL(rawUrl);
    const pathMatch = outer.pathname.match(/\/v\d+\/__(https?:\/\/.+)$/);
    if (!pathMatch) return null;

    let embedded = pathMatch[1];
    if (outer.search) {
      const searchPart = outer.search.slice(1).split("__")[0];
      if (searchPart) {
        embedded = `${embedded}?${searchPart}`;
      }
    }
    return embedded;
  } catch {
    return null;
  }
}

function isSafeLinksHost(host) {
  return (
    host === "safelinks.protection.outlook.com" ||
    host.endsWith(".safelinks.protection.outlook.com")
  );
}

function isProofpointHost(host) {
  return (
    host === "urldefense.proofpoint.com" ||
    host.endsWith(".urldefense.proofpoint.com") ||
    host === "urldefense.com" ||
    host.endsWith(".urldefense.com")
  );
}

/** Unwrap email-security redirect URLs (Proofpoint, Safe Links, etc.). */
export function unwrapSecurityWrappedUrl(url, depth = 0) {
  if (!url || depth >= MAX_UNWRAP_DEPTH) return url;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (isProofpointHost(host)) {
      if (parsed.pathname.includes("/v2/url")) {
        const encoded = parsed.searchParams.get("u");
        if (encoded) {
          const decoded = decodeProofpointV2Param(encoded);
          if (decoded && decoded !== url) {
            return unwrapSecurityWrappedUrl(decoded, depth + 1);
          }
        }
      }

      const v3Decoded = decodeProofpointV3Url(url);
      if (v3Decoded && v3Decoded !== url) {
        return unwrapSecurityWrappedUrl(v3Decoded, depth + 1);
      }
    }

    if (isSafeLinksHost(host)) {
      const wrapped = parsed.searchParams.get("url");
      if (wrapped) {
        const decoded = decodeURIComponent(wrapped);
        if (decoded && decoded !== url) {
          return unwrapSecurityWrappedUrl(decoded, depth + 1);
        }
      }
    }

    return url;
  } catch {
    return url;
  }
}

/** Pull a usable URL from a raw string or pasted iframe/img snippet. */
export function extractMediaUrl(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const iframeMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch) return iframeMatch[1];
  const imgMatch = trimmed.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];
  return trimmed;
}

/** Extract pasted media URL and unwrap common email-security wrappers. */
export function normalizeMediaUrl(raw) {
  const extracted = extractMediaUrl(raw);
  if (!extracted) return null;
  return unwrapSecurityWrappedUrl(extracted);
}

export function isDirectVideoFile(url) {
  if (!url) return false;
  try {
    return DIRECT_VIDEO_EXT.test(new URL(url).pathname);
  } catch {
    return DIRECT_VIDEO_EXT.test(url);
  }
}

function isFrameSrcAllowedUrl(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (FRAME_SRC_ALLOWED_HOSTS.has(host)) return true;
    return Array.from(FRAME_SRC_ALLOWED_HOSTS).some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    );
  } catch {
    return false;
  }
}

export function getEmbedUrl(rawUrl) {
  const normalizedUrl = normalizeMediaUrl(rawUrl);
  if (!normalizedUrl) return null;
  try {
    const u = new URL(normalizedUrl);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const shortsMatch = u.pathname.match(/^\/shorts\/([^/]+)/);
      if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
      const embedMatch = u.pathname.match(/^\/embed\/([^/]+)/);
      if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}`;
    }
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.replace(/^\/(video\/)?/, "").split("/")[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === "loom.com" || host.endsWith(".loom.com")) {
      const m = u.pathname.match(/\/(share|embed)\/([^/?]+)/);
      if (m) return `https://www.loom.com/embed/${m[2]}`;
    }
    if (host === "drive.google.com") {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
    return null;
  } catch {
    return null;
  }
}

export function getOpportunityCoverUrl(opportunity) {
  return (
    opportunity?.coverImage?.url ||
    extractMediaUrl(opportunity?.coverImageUrl) ||
    null
  );
}

function getYoutubeVideoId(url) {
  const normalizedUrl = normalizeMediaUrl(url);
  if (!normalizedUrl) return null;
  try {
    const u = new URL(normalizedUrl);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return v;
      const shortsMatch = u.pathname.match(/^\/shorts\/([^/]+)/);
      if (shortsMatch) return shortsMatch[1];
      const embedMatch = u.pathname.match(/^\/embed\/([^/]+)/);
      if (embedMatch) return embedMatch[1];
    }
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      if (id) return id;
    }
  } catch {
    return null;
  }
  return null;
}

function getVimeoVideoId(url) {
  const normalizedUrl = normalizeMediaUrl(url);
  if (!normalizedUrl) return null;
  try {
    const u = new URL(normalizedUrl);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.replace(/^\/(video\/)?/, "").split("/")[0];
      return id || null;
    }
  } catch {
    return null;
  }
  return null;
}

/** Static thumbnail for YouTube/Vimeo/Loom embed URLs when no cover image exists. */
export function getEmbedVideoThumbnailUrl(rawVideoUrl) {
  const url = normalizeMediaUrl(rawVideoUrl);
  if (!url) return null;

  const youtubeId = getYoutubeVideoId(url);
  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  const vimeoId = getVimeoVideoId(url);
  if (vimeoId) {
    return `https://vumbnail.com/${vimeoId}.jpg`;
  }

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "loom.com" || host.endsWith(".loom.com")) {
      const m = u.pathname.match(/\/(share|embed)\/([^/?]+)/);
      if (m) return `https://cdn.loom.com/sessions/thumbnails/${m[2]}-with-play.gif`;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Resolve row/card thumbnail: cover image, embed platform thumb, or direct video src
 * (use a muted <video preload="metadata"> when only directVideoSrc is set).
 */
export function getOpportunityThumbnailSources(opportunity) {
  const coverUrl = getOpportunityCoverUrl(opportunity);
  const { directVideoSrc, embedUrl, fallbackIframeSrc } =
    getOpportunityVideoSources(opportunity);

  if (coverUrl) {
    return { coverUrl, directVideoSrc: null, embedThumbUrl: null };
  }

  if (directVideoSrc) {
    return { coverUrl: null, directVideoSrc, embedThumbUrl: null };
  }

  const embedThumbUrl =
    embedUrl || fallbackIframeSrc
      ? getEmbedVideoThumbnailUrl(opportunity?.videoUrl)
      : null;

  return { coverUrl: null, directVideoSrc: null, embedThumbUrl };
}

/**
 * Resolve how to render an opportunity intro video.
 * @returns {{
 *   directVideoSrc: string|null,
 *   embedUrl: string|null,
 *   fallbackIframeSrc: string|null,
 *   externalVideoUrl: string|null,
 *   coverUrl: string|null
 * }}
 */
export function getOpportunityVideoSources(opportunity) {
  const coverUrl = getOpportunityCoverUrl(opportunity);
  const uploadedVideoUrl = trimString(opportunity?.videoFile?.url);
  const normalizedVideoUrl = normalizeMediaUrl(opportunity?.videoUrl);
  const directVideoSrc =
    uploadedVideoUrl ||
    (isDirectVideoFile(normalizedVideoUrl) ? normalizedVideoUrl : null);
  const embedUrl = !directVideoSrc ? getEmbedUrl(normalizedVideoUrl) : null;
  const fallbackIframeSrc =
    !directVideoSrc &&
    !embedUrl &&
    normalizedVideoUrl &&
    isFrameSrcAllowedUrl(normalizedVideoUrl)
      ? normalizedVideoUrl
      : null;
  const externalVideoUrl =
    !directVideoSrc && !embedUrl && !fallbackIframeSrc && normalizedVideoUrl
      ? normalizedVideoUrl
      : null;

  return {
    directVideoSrc,
    embedUrl,
    fallbackIframeSrc,
    externalVideoUrl,
    coverUrl,
  };
}

export function hasOpportunityPlayableVideo(opportunity) {
  const { directVideoSrc, embedUrl, fallbackIframeSrc, externalVideoUrl } =
    getOpportunityVideoSources(opportunity);
  return Boolean(
    directVideoSrc || embedUrl || fallbackIframeSrc || externalVideoUrl,
  );
}
