/**
 * Opportunity.proposalData persisted shape:
 *   [{ formDefinitionId, answer }]
 *
 * Legacy flat objects (field keys at the top level) are still accepted on read.
 * Duplicated from frontend/lib/opportunityProposalData.ts — keep in sync.
 */

export type OpportunityProposalAnswer = Record<string, unknown>;

export type OpportunityProposalDataEntry = {
  formDefinitionId: string;
  answer: OpportunityProposalAnswer;
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
    return { ...proposalData };
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
 * Upsert an answer entry by formDefinitionId; preserves other entries.
 * Falls back to a single-entry array when existing is legacy/empty.
 */
export function upsertProposalEntry(
  existing: unknown,
  formDefinitionId: string,
  answer: OpportunityProposalAnswer
): OpportunityProposalData {
  if (!formDefinitionId) {
    throw new Error("upsertProposalEntry requires formDefinitionId");
  }

  const entry: OpportunityProposalDataEntry = {
    formDefinitionId,
    answer: { ...answer },
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
