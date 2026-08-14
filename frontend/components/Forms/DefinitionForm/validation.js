// Per-field client-side validation. Returns a map
// { [fieldName]: { code, ...meta } } or {} if everything is valid.
// Server is still the source of truth, but catching obvious issues here
// gives instant feedback.
//
// Conditional-logic validation (showWhen) is Tier-G — skipped in v1.
// Visibility scoping happens in the parent via getVisibleFields().

import { fieldLabel } from "./i18n";

function isSelectLike(fieldType) {
  return fieldType === "select" || fieldType === "select_one_icon";
}

/**
 * Keystone select enums reject empty string. Parse GraphQL messages like:
 * "Opportunity.preferGroupFormat: is not a possible value for Prefer Group Format"
 * → ["preferGroupFormat"]
 */
export function parseInvalidSelectFieldNames(message) {
  if (!message || typeof message !== "string") return [];
  const names = [];
  const re = /\.(\w+):\s*is not a possible value/gi;
  let match;
  while ((match = re.exec(message)) !== null) {
    names.push(match[1]);
  }
  return [...new Set(names)];
}

/** Collect field names from an Apollo / GraphQL error payload. */
export function parseInvalidSelectFieldNamesFromError(err) {
  const chunks = [];
  if (err?.message) chunks.push(err.message);
  for (const g of err?.graphQLErrors || []) {
    if (g?.message) chunks.push(g.message);
  }
  return parseInvalidSelectFieldNames(chunks.join(" "));
}

export function validateValues(values, fields) {
  const errors = {};
  for (const f of fields) {
    if (!f?.name) continue;
    if (f.fieldType === "read_only_html") continue;
    const v = values[f.name];
    let isEmpty =
      v === null ||
      v === undefined ||
      v === "" ||
      (Array.isArray(v) && v.length === 0);

    if (f.fieldType === "link_list" && Array.isArray(v)) {
      isEmpty = !v.some(
        (row) =>
          row &&
          typeof row === "object" &&
          typeof row.url === "string" &&
          row.url.trim().length > 0
      );
    }

    if (f.fieldType === "media_asset_list" && Array.isArray(v)) {
      isEmpty = !v.some(
        (row) =>
          row &&
          (typeof row === "string"
            ? row.trim().length > 0
            : typeof row === "object" && row.id)
      );
    }

    // Select enums: empty / unknown values fail on the server with a cryptic
    // GraphQL message — require a real option before save.
    if (isSelectLike(f.fieldType)) {
      const optionValues = (f.options || []).map((o) => o?.value);
      const invalidOption =
        !isEmpty &&
        optionValues.length > 0 &&
        !optionValues.includes(v);
      if (isEmpty || invalidOption) {
        errors[f.name] = { code: "selectRequired" };
        continue;
      }
    }

    if (f.isRequired && isEmpty) {
      errors[f.name] = { code: "required" };
      continue;
    }

    const rules = f.validation || {};

    if (typeof v === "string") {
      if (rules.maxLength && v.length > rules.maxLength) {
        errors[f.name] = { code: "maxLength", max: rules.maxLength };
        continue;
      }
      if (rules.wordLimit) {
        const words = v.trim().split(/\s+/).filter(Boolean).length;
        if (words > rules.wordLimit) {
          errors[f.name] = { code: "wordLimit", max: rules.wordLimit };
          continue;
        }
      }
      if (rules.pattern) {
        try {
          const re = new RegExp(rules.pattern);
          if (!re.test(v)) {
            errors[f.name] = {
              code: "pattern",
              patternMessage: rules.patternMessage || null,
            };
            continue;
          }
        } catch {
          // ignore unparseable regex — admin's problem, surfaced via Keystone admin
        }
      }
    }

    if (typeof v === "number") {
      if (rules.min != null && v < rules.min) {
        errors[f.name] = { code: "min", min: rules.min };
        continue;
      }
      if (rules.max != null && v > rules.max) {
        errors[f.name] = { code: "max", max: rules.max };
        continue;
      }
    }
  }
  return errors;
}

export function formatFieldError(field, detail, t, locale = "en") {
  if (!detail?.code) return "";
  switch (detail.code) {
    case "required":
      return t("definitionForm.fieldRequired", {}, {
        default: "This field is required.",
      });
    case "selectRequired": {
      const label = fieldLabel(field, locale) || field?.name || "This field";
      return t(
        "definitionForm.selectRequired",
        { field: label },
        { default: "{{field}} must be chosen." },
      );
    }
    case "maxLength":
      return t("definitionForm.maxLength", { max: detail.max }, {
        default: "Must be at most {{max}} characters.",
      });
    case "wordLimit":
      return t("definitionForm.wordLimit", { max: detail.max }, {
        default: "Must be at most {{max}} words.",
      });
    case "pattern":
      return (
        detail.patternMessage ||
        t("definitionForm.invalidFormat", {}, { default: "Invalid format." })
      );
    case "min":
      return t("definitionForm.min", { min: detail.min }, {
        default: "Must be at least {{min}}.",
      });
    case "max":
      return t("definitionForm.max", { max: detail.max }, {
        default: "Must be at most {{max}}.",
      });
    default:
      return t("definitionForm.invalidFormat", {}, { default: "Invalid format." });
  }
}
