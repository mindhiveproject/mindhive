function getLegacyMentor(opp) {
  return opp?.mentor?.id ? opp.mentor : null;
}

export function getOpportunitySponsors(opp) {
  const sponsors = (opp?.sponsors || []).filter((p) => p?.id);
  if (sponsors.length) return sponsors;
  const legacy = getLegacyMentor(opp);
  return legacy ? [legacy] : [];
}

export function getOpportunityMentors(opp) {
  const mentors = (opp?.mentors || []).filter((p) => p?.id);
  if (mentors.length) return mentors;
  const legacy = getLegacyMentor(opp);
  if (legacy && opp?.sponsorIsMentor !== false) return [legacy];
  return [];
}

export function isMentorTbd(opp) {
  return getOpportunityMentors(opp).length === 0;
}

export function isOpportunityStakeholder(opp, profileId) {
  if (!profileId) return false;
  const id = String(profileId);
  return (
    getOpportunitySponsors(opp).some((p) => String(p.id) === id) ||
    getOpportunityMentors(opp).some((p) => String(p.id) === id)
  );
}

export function isOpportunitySponsor(opp, profileId) {
  if (!profileId) return false;
  const id = String(profileId);
  return getOpportunitySponsors(opp).some((p) => String(p.id) === id);
}

export function getPrimarySponsor(opp) {
  return getOpportunitySponsors(opp)[0] || null;
}

export function displayProfileName(profile) {
  if (!profile) return "";
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username ||
    ""
  );
}

/** @deprecated Use displayProfileName — kept for existing call sites during migration */
export function mentorDisplayName(profile) {
  return displayProfileName(profile);
}

export function formatOpportunitySponsorLabel(opp) {
  const names = getOpportunitySponsors(opp)
    .map((profile) => displayProfileName(profile))
    .filter(Boolean);
  return names.join(", ") || "—";
}

export function formatOpportunityMentorLabel(opp, t) {
  if (isMentorTbd(opp)) {
    return t
      ? t("opportunities.preview.mentorTbd", {}, { default: "Mentor to be assigned" })
      : "Mentor TBD";
  }
  const names = getOpportunityMentors(opp)
    .map((profile) => displayProfileName(profile))
    .filter(Boolean);
  return names.join(", ") || "—";
}

/** Merge sponsored + mentoring opportunities, deduped by id. */
export function mergeOpportunityLists(...lists) {
  const byId = new Map();
  for (const list of lists) {
    for (const opp of list || []) {
      if (opp?.id && !byId.has(opp.id)) byId.set(opp.id, opp);
    }
  }
  return [...byId.values()];
}
