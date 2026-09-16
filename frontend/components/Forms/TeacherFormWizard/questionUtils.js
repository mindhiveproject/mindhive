/** Fixed FormField.name / Opportunity column for the intro-video question. */
export const INTRO_VIDEO_FIELD_NAME = "videoFile";

/** Client-side preview of the server-enforced file validation.
 * Capped at 100MB to match production nginx `client_max_body_size` (100m). */
export const INTRO_VIDEO_VALIDATION = {
  maxFileSize: 100 * 1024 * 1024,
  allowedMimes: "video/mp4,video/webm",
};

export function isIntroVideoQuestion(questionOrField) {
  if (!questionOrField) return false;
  return (
    questionOrField.fieldType === "file" ||
    questionOrField.name === INTRO_VIDEO_FIELD_NAME ||
    questionOrField.storageColumn === INTRO_VIDEO_FIELD_NAME
  );
}

export function parseOptionLines(raw) {
  if (!raw) return [];
  return String(raw)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [value, ...rest] = line.split("|");
      const trimmedValue = (value || "").trim();
      return {
        value: trimmedValue,
        label: (rest.join("|") || trimmedValue).trim(),
        order: i,
      };
    })
    .filter((o) => o.value);
}

export function optionsToLines(options) {
  if (!Array.isArray(options) || options.length === 0) return "";
  return options
    .map((o) => {
      if (!o) return "";
      if (o.label && o.label !== o.value) return `${o.value}|${o.label}`;
      return o.value || "";
    })
    .filter(Boolean)
    .join("\n");
}

export function createBlankQuestion(overrides = {}) {
  return {
    localId: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: null,
    fieldType: "text",
    label: "",
    helperText: "",
    placeholder: "",
    isRequired: false,
    optionsText: "",
    // UI-only: expanded type picker until the teacher picks a type.
    typeChosen: false,
    ...overrides,
  };
}

export function reorderArray(arr, fromIndex, toIndex) {
  if (
    !Array.isArray(arr) ||
    fromIndex == null ||
    toIndex == null ||
    fromIndex === toIndex
  ) {
    return arr;
  }
  const next = arr.slice();
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
}

export function insertQuestionAt(list, index, question = createBlankQuestion()) {
  const next = Array.isArray(list) ? list.slice() : [];
  const at = Math.max(0, Math.min(index, next.length));
  next.splice(at, 0, question);
  return next;
}

/**
 * Raw (non-localized) `dual_textarea` sub-prompts, mirroring the precedence in
 * DefinitionForm/i18n `dualTextareaSubLabels`. The wizard edits raw strings, so
 * it reads the source text rather than the localized variant.
 */
function dualTextareaSubPrompts(field) {
  const options = Array.isArray(field?.options) ? field.options : [];
  const sorted = options
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const validation = field?.validation || {};
  const subA = sorted[0]?.label || sorted[0]?.value || validation.subLabelA;
  const subB = sorted[1]?.label || sorted[1]?.value || validation.subLabelB;
  return {
    subA: String(subA || "").trim(),
    subB: String(subB || "").trim(),
  };
}

/**
 * `dual_textarea` is a MindHive-seeded review type the wizard does not offer,
 * so it is expanded into the teacher's own vocabulary: each of its two answer
 * boxes becomes a long-answer question. Box A keeps the field's main prompt
 * (its sub-label is guidance, so it becomes helper text); box B is prompted by
 * its own sub-label. Copies that already lost their sub-labels collapse to a
 * single long answer, which is what they actually render as.
 */
function expandDualTextarea(field) {
  const { subA, subB } = dualTextareaSubPrompts(field);
  const first = createBlankQuestion({
    name: field.name || null,
    fieldType: "textarea",
    label: field.label || "",
    helperText: field.helperText || subA,
    placeholder: field.placeholder || "",
    isRequired: !!field.isRequired,
    typeChosen: true,
  });
  if (!subB) return [first];
  return [
    first,
    createBlankQuestion({
      fieldType: "textarea",
      label: subB,
      isRequired: !!field.isRequired,
      typeChosen: true,
    }),
  ];
}

export function questionsFromDefinition(definition) {
  const cards = definition?.cards || [];
  const fields = cards.flatMap((card) => card.fields || []);
  if (!fields.length) return [createBlankQuestion()];
  return fields.flatMap((f) => {
    if (f.fieldType === "dual_textarea") return expandDualTextarea(f);
    const introVideo = isIntroVideoQuestion(f);
    return createBlankQuestion({
      name: introVideo ? INTRO_VIDEO_FIELD_NAME : f.name || null,
      fieldType: introVideo ? "file" : f.fieldType || "text",
      label: f.label || "",
      helperText: f.helperText || "",
      placeholder: f.placeholder || "",
      isRequired: !!f.isRequired,
      optionsText: optionsToLines(f.options),
      originalOptions: Array.isArray(f.options) ? f.options : null,
      typeChosen: true,
    });
  });
}

export function questionsToMutationFields(questions) {
  return questions.map((q, order) => {
    const fieldType = q.fieldType;
    const introVideo = fieldType === "file";
    const payload = {
      name: introVideo
        ? INTRO_VIDEO_FIELD_NAME
        : q.name || undefined,
      fieldType,
      label: q.label,
      helperText: q.helperText || "",
      placeholder: q.placeholder || "",
      isRequired: !!q.isRequired,
      order,
    };
    if (fieldType === "select" || fieldType === "multiselect") {
      payload.options = parseOptionLines(q.optionsText);
    } else if (Array.isArray(q.originalOptions) && q.originalOptions.length) {
      payload.options = q.originalOptions;
    }
    return payload;
  });
}

export function buildPreviewDefinition({
  title,
  description,
  questions,
  omitCardHeader = false,
}) {
  return {
    id: "preview",
    title: title || "",
    description: description || "",
    cards: [
      {
        id: "preview-card",
        cardType: "fields",
        title: omitCardHeader ? "" : title || "",
        description: omitCardHeader ? "" : description || "",
        order: 0,
        fields: questions.map((q, order) => {
          const introVideo = q.fieldType === "file";
          return {
            id: q.localId,
            name: introVideo
              ? INTRO_VIDEO_FIELD_NAME
              : q.name || `q_${order}`,
            fieldType: q.fieldType,
            label: q.label,
            helperText: q.helperText,
            placeholder: q.placeholder,
            isRequired: q.isRequired,
            order,
            options: parseOptionLines(q.optionsText),
            // Preview mirrors the server-enforced Opportunity.videoFile mapping.
            ...(introVideo
              ? {
                  storage: "column",
                  storageColumn: INTRO_VIDEO_FIELD_NAME,
                  storageEntity: "self",
                  validation: INTRO_VIDEO_VALIDATION,
                }
              : {}),
          };
        }),
      },
    ],
  };
}
