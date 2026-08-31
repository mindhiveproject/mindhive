export type OpportunityPerson = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
} | null;

function getLegacyMentor(opportunity: any): OpportunityPerson {
  return opportunity?.mentor?.id ? opportunity.mentor : null;
}

export function getOpportunitySponsors(opportunity: any): OpportunityPerson[] {
  const sponsors = (opportunity?.sponsors || []).filter(
    (p: OpportunityPerson) => p?.id
  );
  if (sponsors.length) return sponsors;
  const legacy = getLegacyMentor(opportunity);
  return legacy ? [legacy] : [];
}

export function getOpportunityMentors(opportunity: any): OpportunityPerson[] {
  const mentors = (opportunity?.mentors || []).filter(
    (p: OpportunityPerson) => p?.id
  );
  if (mentors.length) return mentors;
  const legacy = getLegacyMentor(opportunity);
  // Legacy: mentor was also the assigned mentor when sponsorIsMentor !== false
  if (legacy && opportunity?.sponsorIsMentor !== false) return [legacy];
  return [];
}

export function getOpportunityStakeholderIds(opportunity: any): string[] {
  const ids = new Set<string>();
  for (const person of [
    ...getOpportunitySponsors(opportunity),
    ...getOpportunityMentors(opportunity),
  ]) {
    if (person?.id) ids.add(String(person.id));
  }
  return [...ids];
}

export function isOpportunityStakeholder(
  opportunity: any,
  profileId: string | null | undefined
): boolean {
  if (!profileId) return false;
  return getOpportunityStakeholderIds(opportunity).includes(String(profileId));
}

export function isOpportunitySponsor(
  opportunity: any,
  profileId: string | null | undefined
): boolean {
  if (!profileId) return false;
  return getOpportunitySponsors(opportunity).some(
    (p) => String(p?.id) === String(profileId)
  );
}

export function getPrimarySponsor(opportunity: any): OpportunityPerson {
  return getOpportunitySponsors(opportunity)[0] || null;
}

/** Sponsors always; mentors additionally when assigned. Deduped by profile id. */
export function getNotificationRecipients(opportunity: any): OpportunityPerson[] {
  const byId = new Map<string, OpportunityPerson>();
  for (const person of [
    ...getOpportunitySponsors(opportunity),
    ...getOpportunityMentors(opportunity),
  ]) {
    if (person?.id) byId.set(String(person.id), person);
  }
  return [...byId.values()];
}

export function displayName(p: OpportunityPerson) {
  if (!p) return "there";
  return (
    `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
    p.username ||
    "there"
  );
}
