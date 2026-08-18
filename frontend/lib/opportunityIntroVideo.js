/**
 * Intro video on Opportunity lives in two fields: uploaded `videoFile` and
 * pasted `videoUrl`. Teachers treat them as one "has intro video" signal.
 */

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function getOpportunityIntroVideoUrl(opportunity) {
  return trimString(opportunity?.videoUrl);
}

export function getOpportunityIntroVideoFileUrl(opportunity) {
  return trimString(opportunity?.videoFile?.url);
}

export function getOpportunityIntroVideoFilename(opportunity) {
  return trimString(opportunity?.videoFile?.filename);
}

/** True when the opportunity has an uploaded file or a non-empty video URL. */
export function hasOpportunityIntroVideo(opportunity) {
  return Boolean(
    getOpportunityIntroVideoFileUrl(opportunity) ||
      getOpportunityIntroVideoUrl(opportunity),
  );
}

/**
 * How the intro video was provided.
 * - `file`: uploaded Opportunity.videoFile
 * - `url`: pasted videoUrl only
 * - `none`: neither
 */
export function getOpportunityIntroVideoKind(opportunity) {
  if (getOpportunityIntroVideoFileUrl(opportunity)) return "file";
  if (getOpportunityIntroVideoUrl(opportunity)) return "url";
  return "none";
}
