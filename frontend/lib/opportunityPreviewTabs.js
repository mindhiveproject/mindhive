import { formTabKey, parseFormTabKey } from "./opportunityEditorTabs";

/** Tab keys for the teacher opportunity preview modal. */
export const OPPORTUNITY_PREVIEW_TABS = {
  chat: "chat",
  detail: "detail",
  people: "people",
};

/**
 * Follow-up form definitions attached to a single matching round.
 * Unlike collectFollowUpForms, this does not gate on sponsorFormsVisible —
 * teachers reviewing opportunities should see forms they requested.
 */
export function collectActiveRoundFollowUpForms(round) {
  if (!round) return [];
  const byId = new Map();
  for (const fd of round.formDefinitions || []) {
    if (!fd?.id || byId.has(fd.id)) continue;
    byId.set(fd.id, {
      id: fd.id,
      title: fd.title || fd.key || fd.id,
      key: fd.key,
      version: fd.version,
      status: fd.status,
      roundId: round.id,
      roundTitle: round.title,
      networkId: round.classNetwork?.id || null,
      networkTitle: round.classNetwork?.title || null,
    });
  }
  return Array.from(byId.values());
}

/**
 * Prefer the active matching round's forms (from context or opp.rounds).
 * Falls back to an empty list when no active round is known.
 */
export function resolvePreviewFollowUpForms({
  activeRoundId,
  rounds = [],
  contextFormDefinitions = null,
  roundTitle = null,
  networkId = null,
  networkTitle = null,
} = {}) {
  if (Array.isArray(contextFormDefinitions) && contextFormDefinitions.length > 0) {
    const byId = new Map();
    for (const fd of contextFormDefinitions) {
      if (!fd?.id || byId.has(fd.id)) continue;
      byId.set(fd.id, {
        id: fd.id,
        title: fd.title || fd.key || fd.id,
        key: fd.key,
        version: fd.version,
        status: fd.status,
        roundId: activeRoundId || null,
        roundTitle: roundTitle || null,
        networkId: networkId || null,
        networkTitle: networkTitle || null,
      });
    }
    return Array.from(byId.values());
  }

  if (!activeRoundId) return [];
  const round = (rounds || []).find((r) => r?.id === activeRoundId);
  return collectActiveRoundFollowUpForms(round);
}

export function resolveOpportunityPreviewTab(
  tab,
  { followUpForms = [], showChat = false } = {},
) {
  const value = typeof tab === "string" ? tab : "";
  if (value === OPPORTUNITY_PREVIEW_TABS.chat && showChat) {
    return OPPORTUNITY_PREVIEW_TABS.chat;
  }
  if (value === OPPORTUNITY_PREVIEW_TABS.people) {
    return OPPORTUNITY_PREVIEW_TABS.people;
  }
  if (value === OPPORTUNITY_PREVIEW_TABS.detail) {
    return OPPORTUNITY_PREVIEW_TABS.detail;
  }
  const formId = parseFormTabKey(value);
  if (formId && followUpForms.some((f) => f.id === formId)) {
    return formTabKey(formId);
  }
  return OPPORTUNITY_PREVIEW_TABS.detail;
}

export { formTabKey, parseFormTabKey };
