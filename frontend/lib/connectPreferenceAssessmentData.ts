/**
 * ConnectPreference.assessmentData persisted shape:
 *   [{ formDefinitionId, answer, savedAt? }]
 */

export type ConnectPreferenceAssessmentAnswer = Record<string, unknown>;

export type ConnectPreferenceAssessmentEntry = {
  formDefinitionId: string;
  answer: ConnectPreferenceAssessmentAnswer;
  savedAt?: string;
};

export type ConnectPreferenceAssessmentData = ConnectPreferenceAssessmentEntry[];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export function isAssessmentDataEntries(
  value: unknown
): value is ConnectPreferenceAssessmentData {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(
    (entry) =>
      entry != null &&
      typeof entry === "object" &&
      typeof (entry as ConnectPreferenceAssessmentEntry).formDefinitionId ===
        "string" &&
      isPlainObject((entry as ConnectPreferenceAssessmentEntry).answer)
  );
}

export function getAssessmentAnswer(
  assessmentData: unknown,
  formDefinitionId?: string | null
): ConnectPreferenceAssessmentAnswer {
  if (isAssessmentDataEntries(assessmentData)) {
    if (formDefinitionId) {
      const match = assessmentData.find(
        (entry) => entry.formDefinitionId === formDefinitionId
      );
      if (match) return { ...match.answer };
    }
    return { ...assessmentData[0].answer };
  }
  return {};
}

export function isAssessmentFormAnswerComplete(
  assessmentData: unknown,
  formDefinitionId?: string | null
): boolean {
  if (!formDefinitionId || !isAssessmentDataEntries(assessmentData)) {
    return false;
  }
  const match = assessmentData.find(
    (entry) => entry.formDefinitionId === formDefinitionId
  );
  if (!match?.answer || !isPlainObject(match.answer)) return false;
  return Object.keys(match.answer).some((key) => {
    const value = match.answer[key];
    if (value == null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  });
}

export function upsertAssessmentEntry(
  existing: unknown,
  formDefinitionId: string,
  answer: ConnectPreferenceAssessmentAnswer | Record<string, unknown>
): ConnectPreferenceAssessmentData {
  if (!formDefinitionId) {
    throw new Error("upsertAssessmentEntry requires formDefinitionId");
  }

  const entry: ConnectPreferenceAssessmentEntry = {
    formDefinitionId,
    answer: { ...answer },
    savedAt: new Date().toISOString(),
  };

  if (isAssessmentDataEntries(existing)) {
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
