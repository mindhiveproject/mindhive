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
  const card = definition?.cards?.[0];
  const fields = card?.fields || [];
  if (!fields.length) return [createBlankQuestion()];
  return fields.map((f) =>
    createBlankQuestion({
      name: f.name || null,
      fieldType: f.fieldType || "text",
      label: f.label || "",
      helperText: f.helperText || "",
      placeholder: f.placeholder || "",
      isRequired: !!f.isRequired,
      optionsText: optionsToLines(f.options),
      typeChosen: true,
    })
  );
}

export function questionsToMutationFields(questions) {
  return questions.map((q, order) => {
    const fieldType = q.fieldType;
    const payload = {
      name: q.name || undefined,
      fieldType,
      label: q.label,
      helperText: q.helperText || "",
      placeholder: q.placeholder || "",
      isRequired: !!q.isRequired,
      order,
    };
    if (fieldType === "select" || fieldType === "multiselect") {
      payload.options = parseOptionLines(q.optionsText);
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
        fields: questions.map((q, order) => ({
          id: q.localId,
          name: q.name || `q_${order}`,
          fieldType: q.fieldType,
          label: q.label,
          helperText: q.helperText,
          placeholder: q.placeholder,
          isRequired: q.isRequired,
          order,
          options: parseOptionLines(q.optionsText),
        })),
      },
    ],
  };
}
