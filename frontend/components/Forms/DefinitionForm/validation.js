// Per-field client-side validation. Returns a map { [fieldName]: "error message" }
// or {} if everything is valid. Server is still the source of truth, but
// catching obvious issues here gives instant feedback.
//
// Conditional-logic validation (showWhen) is Tier-G — skipped in v1.

export function validateValues(values, fields) {
  const errors = {};
  for (const f of fields) {
    if (!f?.name) continue;
    if (f.fieldType === "read_only_html") continue;
    const v = values[f.name];
    const isEmpty =
      v === null ||
      v === undefined ||
      v === "" ||
      (Array.isArray(v) && v.length === 0);

    if (f.isRequired && isEmpty) {
      errors[f.name] = "This field is required.";
      continue;
    }

    const rules = f.validation || {};

    if (typeof v === "string") {
      if (rules.maxLength && v.length > rules.maxLength) {
        errors[f.name] = `Must be at most ${rules.maxLength} characters.`;
        continue;
      }
      if (rules.wordLimit) {
        const words = v.trim().split(/\s+/).filter(Boolean).length;
        if (words > rules.wordLimit) {
          errors[f.name] = `Must be at most ${rules.wordLimit} words.`;
          continue;
        }
      }
      if (rules.pattern) {
        try {
          const re = new RegExp(rules.pattern);
          if (!re.test(v)) {
            errors[f.name] = rules.patternMessage || "Invalid format.";
            continue;
          }
        } catch {
          // ignore unparseable regex — admin's problem, surfaced via Keystone admin
        }
      }
    }

    if (typeof v === "number") {
      if (rules.min != null && v < rules.min) {
        errors[f.name] = `Must be at least ${rules.min}.`;
        continue;
      }
      if (rules.max != null && v > rules.max) {
        errors[f.name] = `Must be at most ${rules.max}.`;
        continue;
      }
    }
  }
  return errors;
}
