/** Tab keys for the SponsorConnect opportunity editor. */
export const OPPORTUNITY_EDITOR_TABS = {
  chat: "chat",
  status: "status",
  proposal: "proposal",
};

export function formTabKey(formDefinitionId) {
  return `form:${formDefinitionId}`;
}

export function parseFormTabKey(tab) {
  if (typeof tab !== "string" || !tab.startsWith("form:")) return null;
  const id = tab.slice("form:".length);
  return id || null;
}

export function resolveOpportunityEditorTab(queryTab, { followUpForms = [] } = {}) {
  const tab = typeof queryTab === "string" ? queryTab : "";
  if (
    tab === OPPORTUNITY_EDITOR_TABS.chat ||
    tab === OPPORTUNITY_EDITOR_TABS.status ||
    tab === OPPORTUNITY_EDITOR_TABS.proposal
  ) {
    return tab;
  }
  const formId = parseFormTabKey(tab);
  if (formId && followUpForms.some((f) => f.id === formId)) {
    return formTabKey(formId);
  }
  return OPPORTUNITY_EDITOR_TABS.proposal;
}

/**
 * Teacher "Show to sponsors" flag on ConnectRound.settings.
 * Missing / false → sponsors must not see follow-up questionnaires.
 */
export function isRoundSponsorFormsVisible(round) {
  const settings = round?.settings;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return false;
  }
  return Boolean(settings.sponsorFormsVisible);
}

/**
 * Distinct follow-up form definitions attached via linked matching rounds
 * that teachers have released to sponsors (`settings.sponsorFormsVisible`).
 * First round that references a form wins for round/network context.
 */
export function collectFollowUpForms(rounds = []) {
  const byId = new Map();
  for (const round of rounds) {
    if (!isRoundSponsorFormsVisible(round)) continue;
    for (const fd of round?.formDefinitions || []) {
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
  }
  return Array.from(byId.values());
}
