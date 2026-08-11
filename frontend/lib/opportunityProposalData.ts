/**
 * Opportunity.proposalData persisted shape:
 *   [{ formDefinitionId, answer, savedAt? }]
 *
 * Legacy flat objects (field keys at the top level) are still accepted on read.
 * Entries without `savedAt` remain valid (backward compatible).
 */

export type OpportunityProposalAnswer = {
  relevance?: string;
  requiresSpecialResources?: string;
  specialResourcesNotes?: string;
  datasetProvision?: string[];
  datasetProvisionOther?: string;
  expectedDeliverables?: string[];
  expectedDeliverablesOther?: string;
  anticipatedObstacles?: string;
  fieldResearchRequired?: string;
  fieldResearchTravelDetails?: string;
  requiredSoftware?: string[];
  requiredSoftwareOther?: string;
  requiredHardware?: string[];
  requiredHardwareOther?: string;
  additionalNotes?: string;
  internshipInterest?: string;
  [key: string]: unknown;
};

export type OpportunityProposalDataEntry = {
  formDefinitionId: string;
  answer: OpportunityProposalAnswer;
  /** ISO timestamp of the last upsert; optional for legacy entries. */
  savedAt?: string;
};

export type OpportunityProposalData = OpportunityProposalDataEntry[];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

/** True when value is a non-empty array of { formDefinitionId, answer }. */
export function isProposalDataEntries(
  value: unknown
): value is OpportunityProposalData {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(
    (entry) =>
      entry != null &&
      typeof entry === "object" &&
      typeof (entry as OpportunityProposalDataEntry).formDefinitionId ===
        "string" &&
      isPlainObject((entry as OpportunityProposalDataEntry).answer)
  );
}

/**
 * Flat answer object for form hydrate / export.
 * Prefers an entry matching formDefinitionId, else first entry, else legacy flat object.
 */
export function getProposalAnswer(
  proposalData: unknown,
  formDefinitionId?: string | null
): OpportunityProposalAnswer {
  if (isProposalDataEntries(proposalData)) {
    if (formDefinitionId) {
      const match = proposalData.find(
        (entry) => entry.formDefinitionId === formDefinitionId
      );
      if (match) return { ...match.answer };
    }
    return { ...proposalData[0].answer };
  }

  if (isPlainObject(proposalData)) {
    return { ...proposalData } as OpportunityProposalAnswer;
  }

  return {};
}

/** formDefinitionId from the first matching / first entry, or null for legacy flat. */
export function getProposalFormDefinitionId(
  proposalData: unknown,
  preferredFormDefinitionId?: string | null
): string | null {
  if (!isProposalDataEntries(proposalData)) return null;
  if (preferredFormDefinitionId) {
    const match = proposalData.find(
      (entry) => entry.formDefinitionId === preferredFormDefinitionId
    );
    if (match) return match.formDefinitionId;
  }
  return proposalData[0]?.formDefinitionId || null;
}

/**
 * Original opportunity intake form id from proposalData, excluding follow-up
 * questionnaire form ids (matching-round forms live on separate preview tabs).
 * Returns null for legacy flat proposalData (no per-form entries).
 */
export function getIntakeProposalFormDefinitionId(
  proposalData: unknown,
  excludeFormDefinitionIds: Iterable<string> = []
): string | null {
  if (!isProposalDataEntries(proposalData)) return null;
  const exclude = new Set(
    Array.from(excludeFormDefinitionIds || []).filter(Boolean)
  );
  const match = proposalData.find(
    (entry) =>
      entry?.formDefinitionId && !exclude.has(entry.formDefinitionId)
  );
  return match?.formDefinitionId || null;
}

/**
 * ISO `savedAt` for a proposalData entry, or null when missing / legacy.
 */
export function getProposalEntrySavedAt(
  proposalData: unknown,
  formDefinitionId?: string | null
): string | null {
  if (!formDefinitionId || !isProposalDataEntries(proposalData)) return null;
  const match = proposalData.find(
    (entry) => entry.formDefinitionId === formDefinitionId
  );
  const savedAt = match?.savedAt;
  return typeof savedAt === "string" && savedAt.trim() ? savedAt : null;
}

/**
 * True when proposalData has a non-empty answer object for formDefinitionId.
 * Empty `{}` (or missing entry) counts as incomplete.
 *
 * `videoFile` is optional back-compat for video-only follow-up saves that wrote
 * Opportunity.videoFile but left an empty proposalData answer (before the
 * JSON completion marker existed). When the entry has `savedAt`, an empty
 * answer, and a video url on the opportunity, treat as complete.
 */
export function isProposalFormAnswerComplete(
  proposalData: unknown,
  formDefinitionId?: string | null,
  videoFile?: { url?: string | null } | null
): boolean {
  if (!formDefinitionId || !isProposalDataEntries(proposalData)) return false;
  const match = proposalData.find(
    (entry) => entry.formDefinitionId === formDefinitionId
  );
  if (!match?.answer || !isPlainObject(match.answer)) return false;
  const hasAnswerContent = Object.keys(match.answer).some((key) => {
    const value = match.answer[key];
    if (value == null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  });
  if (hasAnswerContent) return true;

  const videoUrl =
    videoFile && typeof videoFile.url === "string" ? videoFile.url.trim() : "";
  if (
    videoUrl &&
    typeof match.savedAt === "string" &&
    match.savedAt.trim() &&
    Object.keys(match.answer).length === 0
  ) {
    return true;
  }
  return false;
}

/**
 * Upsert an answer entry by formDefinitionId; preserves other entries.
 * Always stamps `savedAt` with the current time (ISO string).
 * Falls back to a single-entry array when existing is legacy/empty.
 */
export function upsertProposalEntry(
  existing: unknown,
  formDefinitionId: string,
  answer: OpportunityProposalAnswer | Record<string, unknown>
): OpportunityProposalData {
  if (!formDefinitionId) {
    throw new Error("upsertProposalEntry requires formDefinitionId");
  }

  const entry: OpportunityProposalDataEntry = {
    formDefinitionId,
    answer: { ...answer },
    savedAt: new Date().toISOString(),
  };

  if (isProposalDataEntries(existing)) {
    const idx = existing.findIndex(
      (e) => e.formDefinitionId === formDefinitionId
    );
    if (idx >= 0) {
      const next = existing.slice();
      next[idx] = entry;
      return next;
    }
    return [...existing, entry];
  }

  return [entry];
}
