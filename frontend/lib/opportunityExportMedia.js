/**
 * Matching-round export media helpers: intro video, cover illustration, and
 * follow-up MediaAsset attachments. Kept in JS so it can be verified without
 * TS loaders.
 */

import {
  getOpportunityIntroVideoFilename,
  getOpportunityIntroVideoUrl,
  hasOpportunityIntroVideo,
} from "./opportunityIntroVideo";

function trimMediaString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function filenameFromUrl(url) {
  const trimmed = trimMediaString(url);
  if (!trimmed) return "";
  try {
    const path = trimmed.split("?")[0].split("#")[0];
    const segment = path.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(segment);
  } catch {
    return "";
  }
}

function sanitizeZipFilename(name) {
  const cleaned = String(name || "")
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned.slice(0, 80) || "file";
}

function extensionFromUrlOrName(value, fallback = "jpg") {
  const match = String(value || "").match(/\.([a-z0-9]{2,5})(?:\?|#|$)/i);
  return match ? match[1].toLowerCase() : fallback;
}

function stripFileExtension(name) {
  return String(name || "").replace(/\.[a-z0-9]{2,5}$/i, "");
}

export function slugifyForFilename(text) {
  const slug = String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "untitled";
}

export function opportunityZipFolder(opportunity) {
  const id = opportunity?.id || "opportunity";
  const slug = slugifyForFilename(opportunity?.title);
  return `${id}-${slug}`;
}

export function mergeOpportunityMedia(listOpportunity, detailOpportunity) {
  const list = listOpportunity || {};
  const detail = detailOpportunity || {};
  return {
    id: list.id || detail.id || "",
    title: list.title || detail.title || "",
    videoUrl: detail.videoUrl !== undefined ? detail.videoUrl : list.videoUrl,
    videoFile: detail.videoFile || list.videoFile || null,
    coverImage: detail.coverImage || list.coverImage || null,
    coverImageUrl:
      detail.coverImageUrl !== undefined
        ? detail.coverImageUrl
        : list.coverImageUrl,
    proposalData:
      detail.proposalData !== undefined
        ? detail.proposalData
        : list.proposalData,
  };
}

export function getOpportunityCoverImageUrl(opportunity) {
  return (
    trimMediaString(opportunity?.coverImage?.url) ||
    trimMediaString(opportunity?.coverImageUrl)
  );
}

export function hasOpportunityCoverImage(opportunity) {
  return Boolean(getOpportunityCoverImageUrl(opportunity));
}

function coverImageExtension(opportunity) {
  const fromField = trimMediaString(opportunity?.coverImage?.extension).replace(
    /^\./,
    "",
  );
  if (fromField) return fromField.toLowerCase();
  return extensionFromUrlOrName(getOpportunityCoverImageUrl(opportunity), "jpg");
}

export function getOpportunityCoverImageFilename(opportunity) {
  if (!hasOpportunityCoverImage(opportunity)) return "";
  return `${slugifyForFilename(opportunity?.title)}.${coverImageExtension(
    opportunity,
  )}`;
}

export function buildIntroVideoZipPath(opportunity) {
  const fileUrl = trimMediaString(opportunity?.videoFile?.url);
  if (!fileUrl) return "";
  const original =
    getOpportunityIntroVideoFilename(opportunity) ||
    filenameFromUrl(fileUrl) ||
    "video";
  return `${opportunityZipFolder(opportunity)}/intro-video-${sanitizeZipFilename(
    original,
  )}`;
}

export function buildCoverImageZipPath(opportunity) {
  if (!hasOpportunityCoverImage(opportunity)) return "";
  return `${opportunityZipFolder(opportunity)}/illustration.${coverImageExtension(
    opportunity,
  )}`;
}

function isProposalDataEntries(value) {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(
    (entry) =>
      entry != null &&
      typeof entry === "object" &&
      typeof entry.formDefinitionId === "string" &&
      entry.answer != null &&
      typeof entry.answer === "object" &&
      !Array.isArray(entry.answer),
  );
}

function proposalAnswerObjects(proposalData) {
  if (isProposalDataEntries(proposalData)) {
    return proposalData.map((entry) => entry.answer);
  }
  if (
    proposalData != null &&
    typeof proposalData === "object" &&
    !Array.isArray(proposalData)
  ) {
    return [proposalData];
  }
  return [];
}

function isMediaAssetRef(value) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  if (!trimMediaString(value.id)) return false;
  return Boolean(
    trimMediaString(value.url) ||
      trimMediaString(value.title) ||
      trimMediaString(value.fileName) ||
      trimMediaString(value.comment) ||
      value.image ||
      value.exportDocument,
  );
}

function isMediaAssetList(value) {
  if (!Array.isArray(value) || value.length === 0) return false;
  const objects = value.filter(
    (item) => item != null && typeof item === "object" && !Array.isArray(item),
  );
  if (objects.length === 0) return false;
  if (
    objects.every(
      (item) =>
        typeof item.formDefinitionId === "string" && item.answer != null,
    )
  ) {
    return false;
  }
  return objects.some((item) => trimMediaString(item.id));
}

function toMediaAssetRef(value) {
  if (typeof value === "string") {
    const id = value.trim();
    return id ? { id, url: "", title: "", fileName: "" } : null;
  }
  const id = trimMediaString(value?.id);
  if (!id) return null;
  return {
    id,
    url: trimMediaString(value.url),
    title: trimMediaString(value.title),
    fileName: trimMediaString(value.fileName),
  };
}

export function collectMediaAssetRefsFromProposalData(proposalData) {
  const refs = [];
  const seen = new Set();
  const push = (value) => {
    const ref = toMediaAssetRef(value);
    if (!ref || seen.has(ref.id)) return;
    seen.add(ref.id);
    refs.push(ref);
  };

  for (const answer of proposalAnswerObjects(proposalData)) {
    for (const value of Object.values(answer || {})) {
      if (isMediaAssetList(value)) {
        for (const item of value) {
          if (item && trimMediaString(item.id)) push(item);
        }
      } else if (isMediaAssetRef(value)) {
        push(value);
      }
    }
  }
  return refs;
}

export function collectMediaAssetIdsFromOpportunities(
  listOpportunities,
  detailById,
) {
  const ids = [];
  const seen = new Set();
  for (const listOpportunity of listOpportunities || []) {
    const media = mergeOpportunityMedia(
      listOpportunity,
      detailById?.get(listOpportunity.id),
    );
    for (const ref of collectMediaAssetRefsFromProposalData(
      media.proposalData,
    )) {
      if (!seen.has(ref.id)) {
        seen.add(ref.id);
        ids.push(ref.id);
      }
    }
  }
  return ids;
}

// Same URL picking as resolveMediaAssetUrl / resolveMediaAssetExportDocumentUrl
// in Mutations/MediaAsset.js (kept local so this helper stays GraphQL-free).
function resolveAssetImageUrl(asset) {
  return trimMediaString(asset?.image?.url) || trimMediaString(asset?.url);
}

function resolveAssetPdfUrl(asset) {
  return trimMediaString(asset?.exportDocument?.url);
}

function assetDisplayName(asset, ref) {
  return (
    trimMediaString(asset?.exportDocument?.filename) ||
    trimMediaString(asset?.fileName) ||
    trimMediaString(asset?.title) ||
    trimMediaString(ref?.fileName) ||
    trimMediaString(ref?.title) ||
    filenameFromUrl(
      resolveAssetPdfUrl(asset) ||
        resolveAssetImageUrl(asset) ||
        trimMediaString(ref?.url),
    ) ||
    "attachment"
  );
}

function buildFollowUpZipFilename(assetId, baseName, url, fallbackExt) {
  const ext = extensionFromUrlOrName(url, fallbackExt);
  const stem = sanitizeZipFilename(stripFileExtension(baseName) || "attachment");
  return `${assetId}-${stem}.${ext}`;
}

export function getFollowUpAssetDownloads(opportunity, assetById) {
  const folder = opportunityZipFolder(opportunity);
  const downloads = [];
  const usedUrls = new Set();
  const usedZipPaths = new Set();
  const refs = collectMediaAssetRefsFromProposalData(opportunity?.proposalData);

  for (const ref of refs) {
    const asset = assetById?.get(ref.id) || null;
    const pdfUrl = resolveAssetPdfUrl(asset);
    const imageUrl = resolveAssetImageUrl(asset);
    const fallbackUrl = trimMediaString(ref.url);
    const baseName = assetDisplayName(asset, ref);

    const add = (kind, url, fallbackExt) => {
      const trimmed = trimMediaString(url);
      if (!trimmed || usedUrls.has(trimmed)) return;
      usedUrls.add(trimmed);
      let filename = buildFollowUpZipFilename(
        ref.id,
        baseName,
        trimmed,
        fallbackExt,
      );
      if (usedZipPaths.has(`${folder}/${filename}`)) {
        const stem = filename.replace(/\.[^.]+$/, "");
        const ext = filename.includes(".")
          ? filename.slice(filename.lastIndexOf(".") + 1)
          : fallbackExt;
        filename = `${stem}-${kind}.${ext}`;
      }
      const zipPath = `${folder}/${filename}`;
      usedZipPaths.add(zipPath);
      downloads.push({
        kind,
        url: trimmed,
        zipPath,
      });
    };

    add("followUpPdf", pdfUrl, "pdf");
    add("followUpImage", imageUrl, "jpg");
    if (!pdfUrl && !imageUrl) {
      add("followUpFile", fallbackUrl, "bin");
    }
  }

  return downloads;
}

export function getOpportunityMediaCsvFields(opportunity, assetById) {
  const followUp = getFollowUpAssetDownloads(opportunity, assetById);
  return {
    hasIntroVideo: hasOpportunityIntroVideo(opportunity),
    introVideoFilename: getOpportunityIntroVideoFilename(opportunity),
    introVideoUrl: getOpportunityIntroVideoUrl(opportunity),
    introVideoZipPath: buildIntroVideoZipPath(opportunity),
    hasCoverImage: hasOpportunityCoverImage(opportunity),
    coverImageFilename: getOpportunityCoverImageFilename(opportunity),
    coverImageZipPath: buildCoverImageZipPath(opportunity),
    followUpAssetCount: followUp.length,
    followUpAssetZipPaths: followUp.map((item) => item.zipPath).join("; "),
  };
}

export function getOpportunityMediaDownloads(opportunity, assetById) {
  const downloads = [];
  const videoZipPath = buildIntroVideoZipPath(opportunity);
  const videoUrl = trimMediaString(opportunity?.videoFile?.url);
  if (videoZipPath && videoUrl) {
    downloads.push({ kind: "video", url: videoUrl, zipPath: videoZipPath });
  }
  const coverZipPath = buildCoverImageZipPath(opportunity);
  const coverUrl = getOpportunityCoverImageUrl(opportunity);
  if (coverZipPath && coverUrl) {
    downloads.push({
      kind: "illustration",
      url: coverUrl,
      zipPath: coverZipPath,
    });
  }
  downloads.push(...getFollowUpAssetDownloads(opportunity, assetById));
  return downloads;
}

export function collectOpportunityMediaDownloads(
  listOpportunities,
  detailById,
  assetById,
) {
  const downloads = [];
  for (const listOpportunity of listOpportunities || []) {
    const media = mergeOpportunityMedia(
      listOpportunity,
      detailById?.get(listOpportunity.id),
    );
    downloads.push(...getOpportunityMediaDownloads(media, assetById));
  }
  return downloads;
}
