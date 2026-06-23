// Middle pane (when a field is selected). Edits the per-field
// properties an admin will most commonly touch: label, helper text,
// placeholder, required, field type, storage routing, options for
// selects/multiselects, basic validation.
//
// json_array sub-field editing comes in Phase 7. For v1, the
// jsonArraySchema is shown as JSON in a textarea so admins can still
// tweak it inline.
import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@apollo/client";

import {
  UPDATE_FORM_FIELD,
  DELETE_FORM_FIELD,
} from "../../../Mutations/FormDefinition";
import { ADMIN_FORM_DEFINITION } from "../../../Queries/FormDefinition";
import {
  EditorPanelShell,
  FieldRow,
  Section,
  PrimaryButton,
  SecondaryButton,
  PillCheckbox,
} from "./EditorPanelStyles";
import I18nField, { cleanI18n } from "./I18nField";
import JsonArraySchemaEditor from "./JsonArraySchemaEditor";

const FIELD_TYPES = [
  "text",
  "textarea",
  "rich_text",
  "number",
  "date",
  "select",
  "multiselect",
  "checkbox",
  "image",
  "file",
  "video_url",
  "tag_multiselect",
  "json_array",
  "read_only_html",
];

const ROLE_OPTIONS = [
  "sponsor",
  "mentor",
  "teacher",
  "student",
  "scientist",
  "admin",
];

const HAS_OPTIONS = new Set(["select", "multiselect"]);
const HAS_VALIDATION_NUMBER = new Set(["number"]);
const HAS_VALIDATION_TEXT = new Set(["text", "textarea", "rich_text"]);
const HAS_VALIDATION_FILE = new Set(["image", "file"]);
const HAS_JSON_ARRAY = new Set(["json_array"]);

function tryParseJson(s) {
  if (s == null || s === "") return null;
  try {
    return JSON.parse(s);
  } catch {
    return undefined; // signal parse error
  }
}

function fmtJson(v) {
  if (v == null) return "";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "";
  }
}

function fmtOptions(opts) {
  if (!Array.isArray(opts) || opts.length === 0) return "";
  return opts.map((o) => `${o.value}|${o.label || ""}`).join("\n");
}

function parseOptions(raw) {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [value, ...rest] = line.split("|");
      return {
        value: (value || "").trim(),
        label: (rest.join("|") || value || "").trim(),
        order: i,
      };
    })
    .filter((o) => o.value);
}

export default function FieldEditor({ field, definitionId, onDeleted }) {
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [label, setLabel] = useState("");
  const [labelI18n, setLabelI18n] = useState(null);
  const [helperText, setHelperText] = useState("");
  const [helperTextI18n, setHelperTextI18n] = useState(null);
  const [placeholder, setPlaceholder] = useState("");
  const [placeholderI18n, setPlaceholderI18n] = useState(null);
  const [isRequired, setIsRequired] = useState(false);
  const [storage, setStorage] = useState("json_bucket");
  const [storageColumn, setStorageColumn] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [storageEntity, setStorageEntity] = useState("self");
  const [visibilityRoles, setVisibilityRoles] = useState([]);
  const [optionsText, setOptionsText] = useState("");
  // validation broken out by common rule
  const [maxLength, setMaxLength] = useState("");
  const [wordLimit, setWordLimit] = useState("");
  const [minN, setMinN] = useState("");
  const [maxN, setMaxN] = useState("");
  const [maxFileSize, setMaxFileSize] = useState("");
  const [allowedMimes, setAllowedMimes] = useState("");
  const [jsonArraySchema, setJsonArraySchema] = useState(null);

  const [flash, setFlash] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!field) return;
    setName(field.name || "");
    setFieldType(field.fieldType || "text");
    setLabel(field.label || "");
    setLabelI18n(field.labelI18n || null);
    setHelperText(field.helperText || "");
    setHelperTextI18n(field.helperTextI18n || null);
    setPlaceholder(field.placeholder || "");
    setPlaceholderI18n(field.placeholderI18n || null);
    setIsRequired(!!field.isRequired);
    setStorage(field.storage || "json_bucket");
    setStorageColumn(field.storageColumn || "");
    setStorageBucket(field.storageBucket || "");
    setStorageEntity(field.storageEntity || "self");
    setVisibilityRoles(
      Array.isArray(field.visibilityRoles) ? field.visibilityRoles : []
    );
    setOptionsText(fmtOptions(field.options));
    const v = field.validation || {};
    setMaxLength(v.maxLength ?? "");
    setWordLimit(v.wordLimit ?? "");
    setMinN(v.min ?? "");
    setMaxN(v.max ?? "");
    setMaxFileSize(v.maxFileSize ?? "");
    setAllowedMimes(v.allowedMimes || "");
    setJsonArraySchema(
      field.jsonArraySchema && typeof field.jsonArraySchema === "object"
        ? field.jsonArraySchema
        : null
    );
    setFlash(null);
    setErrorMsg(null);
  }, [field?.id]);

  const [updateField, { loading }] = useMutation(UPDATE_FORM_FIELD, {
    refetchQueries: [
      { query: ADMIN_FORM_DEFINITION, variables: { id: definitionId } },
    ],
    awaitRefetchQueries: true,
  });
  const [deleteField, { loading: deleting }] = useMutation(DELETE_FORM_FIELD, {
    refetchQueries: [
      { query: ADMIN_FORM_DEFINITION, variables: { id: definitionId } },
    ],
    awaitRefetchQueries: true,
  });

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete field "${field.label || field.name}"? Existing entity data using this field will remain in the database under the key "${field.name}".`
      )
    ) {
      return;
    }
    await deleteField({ variables: { id: field.id } });
    if (onDeleted) onDeleted();
  };

  const roleSet = useMemo(
    () => new Set(visibilityRoles),
    [visibilityRoles]
  );
  const toggleRole = (r) => {
    setVisibilityRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const buildValidation = () => {
    const v = {};
    if (HAS_VALIDATION_TEXT.has(fieldType)) {
      if (maxLength !== "") v.maxLength = Number(maxLength);
      if (wordLimit !== "") v.wordLimit = Number(wordLimit);
    }
    if (HAS_VALIDATION_NUMBER.has(fieldType)) {
      if (minN !== "") v.min = Number(minN);
      if (maxN !== "") v.max = Number(maxN);
    }
    if (HAS_VALIDATION_FILE.has(fieldType)) {
      if (maxFileSize !== "") v.maxFileSize = Number(maxFileSize);
      if (allowedMimes !== "") v.allowedMimes = allowedMimes;
    }
    return Object.keys(v).length ? v : null;
  };

  const handleSave = async () => {
    setFlash(null);
    setErrorMsg(null);

    const options = HAS_OPTIONS.has(fieldType)
      ? parseOptions(optionsText)
      : null;

    await updateField({
      variables: {
        id: field.id,
        input: {
          name,
          fieldType,
          label,
          labelI18n: cleanI18n(labelI18n),
          helperText,
          helperTextI18n: cleanI18n(helperTextI18n),
          placeholder,
          placeholderI18n: cleanI18n(placeholderI18n),
          isRequired,
          storage,
          storageColumn,
          storageBucket,
          storageEntity,
          visibilityRoles: visibilityRoles.length > 0 ? visibilityRoles : null,
          options,
          validation: buildValidation(),
          jsonArraySchema: HAS_JSON_ARRAY.has(fieldType)
            ? jsonArraySchema
            : null,
        },
      },
    });
    setFlash("Saved.");
  };

  if (!field) return null;

  const showOptions = HAS_OPTIONS.has(fieldType);
  const showJsonArray = HAS_JSON_ARRAY.has(fieldType);

  return (
    <EditorPanelShell>
      <Section>
        <h2>Field · {field.label || field.name}</h2>
      </Section>

      <FieldRow>
        <span className="label-text">Machine name</span>
        <span className="hint">
          snake_case. Used as the json-bucket key and as the form-state key.
          Renaming a published field is discouraged — old data stays under the
          old key.
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FieldRow>

      <FieldRow>
        <span className="label-text">Field type</span>
        <select
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value)}
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </FieldRow>

      <FieldRow>
        <span className="label-text">Label (English baseline)</span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <I18nField
          bag={labelI18n}
          onChange={setLabelI18n}
          toggleLabel="Add label translations"
        />
      </FieldRow>

      <FieldRow>
        <span className="label-text">Helper text</span>
        <textarea
          value={helperText}
          onChange={(e) => setHelperText(e.target.value)}
        />
        <I18nField
          bag={helperTextI18n}
          onChange={setHelperTextI18n}
          multiline
          toggleLabel="Add helper text translations"
        />
      </FieldRow>

      <FieldRow>
        <span className="label-text">Placeholder</span>
        <input
          type="text"
          value={placeholder}
          onChange={(e) => setPlaceholder(e.target.value)}
        />
        <I18nField
          bag={placeholderI18n}
          onChange={setPlaceholderI18n}
          toggleLabel="Add placeholder translations"
        />
      </FieldRow>

      <FieldRow as="div">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
          />
          <span>Required</span>
        </label>
      </FieldRow>

      <FieldRow>
        <span className="label-text">Storage</span>
        <select value={storage} onChange={(e) => setStorage(e.target.value)}>
          <option value="column">column (typed DB column)</option>
          <option value="json_bucket">json_bucket (flexible bucket)</option>
        </select>
        <span className="hint">
          column: the value goes into a typed DB column on the target entity.
          json_bucket: the value is stored under <code>name</code> in a json()
          column you specify below.
        </span>
      </FieldRow>

      <FieldRow>
        <span className="label-text">Storage column</span>
        <span className="hint">
          When storage=column, the column name (e.g. <code>title</code>).
          Must already exist on the entity.
        </span>
        <input
          type="text"
          value={storageColumn}
          onChange={(e) => setStorageColumn(e.target.value)}
          disabled={storage !== "column"}
        />
      </FieldRow>

      <FieldRow>
        <span className="label-text">Storage bucket</span>
        <span className="hint">
          When storage=json_bucket, the json column to write into (e.g.{" "}
          <code>extraDetails</code>, <code>proposalData</code>,{" "}
          <code>info</code>).
        </span>
        <input
          type="text"
          value={storageBucket}
          onChange={(e) => setStorageBucket(e.target.value)}
          disabled={storage !== "json_bucket"}
        />
      </FieldRow>

      <FieldRow>
        <span className="label-text">Storage entity</span>
        <select
          value={storageEntity}
          onChange={(e) => setStorageEntity(e.target.value)}
        >
          <option value="self">Self (the form's target entity)</option>
          <option value="organization">Linked Organization</option>
        </select>
        <span className="hint">
          "organization" routes this field to the Profile's linked Organization
          — useful for sponsor account forms.
        </span>
      </FieldRow>

      {showOptions ? (
        <FieldRow>
          <span className="label-text">Options (one per line)</span>
          <span className="hint">
            Format: <code>value|Label</code>. Example:{" "}
            <code>yes|Yes</code>
          </span>
          <textarea
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            rows={6}
          />
        </FieldRow>
      ) : null}

      {HAS_VALIDATION_TEXT.has(fieldType) ? (
        <Section>
          <FieldRow style={{ flex: 1 }}>
            <span className="label-text">Max length</span>
            <input
              type="number"
              value={maxLength}
              onChange={(e) => setMaxLength(e.target.value)}
            />
          </FieldRow>
          <FieldRow style={{ flex: 1 }}>
            <span className="label-text">Word limit</span>
            <input
              type="number"
              value={wordLimit}
              onChange={(e) => setWordLimit(e.target.value)}
            />
          </FieldRow>
        </Section>
      ) : null}

      {HAS_VALIDATION_NUMBER.has(fieldType) ? (
        <Section>
          <FieldRow style={{ flex: 1 }}>
            <span className="label-text">Min</span>
            <input
              type="number"
              value={minN}
              onChange={(e) => setMinN(e.target.value)}
            />
          </FieldRow>
          <FieldRow style={{ flex: 1 }}>
            <span className="label-text">Max</span>
            <input
              type="number"
              value={maxN}
              onChange={(e) => setMaxN(e.target.value)}
            />
          </FieldRow>
        </Section>
      ) : null}

      {HAS_VALIDATION_FILE.has(fieldType) ? (
        <Section>
          <FieldRow style={{ flex: 1 }}>
            <span className="label-text">Max file size (bytes)</span>
            <input
              type="number"
              value={maxFileSize}
              onChange={(e) => setMaxFileSize(e.target.value)}
            />
          </FieldRow>
          <FieldRow style={{ flex: 1 }}>
            <span className="label-text">Allowed MIME types</span>
            <input
              type="text"
              value={allowedMimes}
              onChange={(e) => setAllowedMimes(e.target.value)}
              placeholder="image/*"
            />
          </FieldRow>
        </Section>
      ) : null}

      {showJsonArray ? (
        <FieldRow>
          <span className="label-text">JSON Array schema</span>
          <span className="hint">
            Defines the sub-fields used in each row of this array field.
          </span>
          <JsonArraySchemaEditor
            value={jsonArraySchema}
            onChange={setJsonArraySchema}
          />
        </FieldRow>
      ) : null}

      <FieldRow>
        <span className="label-text">Visible to roles (overrides card)</span>
        <span className="hint">Empty = inherit from the card.</span>
        <div className="pills">
          {ROLE_OPTIONS.map((r) => (
            <PillCheckbox
              key={r}
              $checked={roleSet.has(r)}
              onClick={() => toggleRole(r)}
              type="button"
            >
              {r}
            </PillCheckbox>
          ))}
        </div>
      </FieldRow>

      {errorMsg ? (
        <Section>
          <span style={{ color: "#871b16", fontSize: 13 }}>{errorMsg}</span>
        </Section>
      ) : null}

      <Section>
        <PrimaryButton type="button" onClick={handleSave} disabled={loading}>
          {loading ? "Saving…" : "Save field"}
        </PrimaryButton>
        <SecondaryButton
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          style={{ color: "#c0392b", borderColor: "#f5c2bf" }}
        >
          {deleting ? "Deleting…" : "Delete field"}
        </SecondaryButton>
        {flash ? <span className="flash">{flash}</span> : null}
      </Section>
    </EditorPanelShell>
  );
}
