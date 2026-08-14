/** Fixed FormField.name / Opportunity column for the intro-video question. */
export const INTRO_VIDEO_FIELD_NAME = "videoFile";

/** Client-side preview of the server-enforced file validation. */
export const INTRO_VIDEO_VALIDATION = {
  maxFileSize: 500 * 1024 * 1024,
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

export function questionsFromDefinition(definition) {
  const cards = definition?.cards || [];
  const fields = cards.flatMap((card) => card.fields || []);
  if (!fields.length) return [createBlankQuestion()];
  return fields.map((f) => {
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

export function buildPreviewDefinition({ title, description, questions }) {
  return {
    id: "preview",
    title: title || "",
    description: description || "",
    cards: [
      {
        id: "preview-card",
        cardType: "fields",
        title: title || "",
        description: description || "",
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
