/**
 * Shared helpers for Opportunity intro video URLs and embed rendering.
 * Used by student ranking, explore detail, and preview flows.
 */

const DIRECT_VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|#|$)/i;

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
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

export function isDirectVideoFile(url) {
  if (!url) return false;
  try {
    return DIRECT_VIDEO_EXT.test(new URL(url).pathname);
  } catch {
    return DIRECT_VIDEO_EXT.test(url);
  }
}

export function getEmbedUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
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
  if (!url) return null;
  try {
    const u = new URL(url);
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
  if (!url) return null;
  try {
    const u = new URL(url);
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
  const url = extractMediaUrl(rawVideoUrl);
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
 * @returns {{ directVideoSrc: string|null, embedUrl: string|null, fallbackIframeSrc: string|null, coverUrl: string|null }}
 */
export function getOpportunityVideoSources(opportunity) {
  const coverUrl = getOpportunityCoverUrl(opportunity);
  const uploadedVideoUrl = trimString(opportunity?.videoFile?.url);
  const rawVideoUrl = extractMediaUrl(opportunity?.videoUrl);
  const directVideoSrc =
    uploadedVideoUrl ||
    (isDirectVideoFile(rawVideoUrl) ? rawVideoUrl : null);
  const embedUrl = !directVideoSrc ? getEmbedUrl(rawVideoUrl) : null;
  const fallbackIframeSrc =
    !directVideoSrc && !embedUrl && rawVideoUrl ? rawVideoUrl : null;

  return { directVideoSrc, embedUrl, fallbackIframeSrc, coverUrl };
}

export function hasOpportunityPlayableVideo(opportunity) {
  const { directVideoSrc, embedUrl, fallbackIframeSrc } =
    getOpportunityVideoSources(opportunity);
  return Boolean(directVideoSrc || embedUrl || fallbackIframeSrc);
}
