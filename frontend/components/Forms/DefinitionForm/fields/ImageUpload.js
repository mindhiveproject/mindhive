// Image field. Backed by a Keystone image() column on the target entity
// (e.g. Opportunity.coverImage). The value flowing through form state is
// one of:
//   - a string URL (existing image returned by the GraphQL query)
//   - a File object (a new upload the user just picked)
//   - null (no image)
//
// storage.buildUpdate wraps File values as { upload: file } so the
// apollo-upload-client middleware can ship the multipart payload.
//
// The "shape" of the entity[storageColumn] value coming in is
// { url, ... } (the Keystone image type). hydrate() returns that whole
// object; we display its `url` as the existing preview.
import { fieldLabel, fieldHelper } from "../i18n";
import { FieldShell, fieldShellErrorProps } from "../styles";

function currentUrl(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof File !== "undefined" && value instanceof File) return null;
  if (typeof value === "object" && value.url) return value.url;
  return null;
}

function isPendingFile(value) {
  return typeof File !== "undefined" && value instanceof File;
}

export default function ImageUpload({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
}) {
  const existing = currentUrl(value);
  const pending = isPendingFile(value) ? value : null;
  const maxBytes = field?.validation?.maxFileSize;
  const accept = field?.validation?.allowedMimes || "image/*";

  const handlePick = (file) => {
    if (!file) {
      onChange(null);
      return;
    }
    if (maxBytes && file.size > maxBytes) {
      // Surface via parent's error map indirectly — the renderer doesn't
      // know about per-field validation errors set from inside, so we
      // just refuse the pick and emit a console hint for now. The
      // server-side limit is the source of truth.
      // eslint-disable-next-line no-console
      console.warn(
        `Image too large: ${file.name} (${file.size} bytes; limit ${maxBytes}).`
      );
      return;
    }
    onChange(file);
  };

  return (
    <FieldShell as="div" {...fieldShellErrorProps(error)}>
      <span className="label-text">
        {fieldLabel(field, locale)}
        {field.isRequired && <span className="required">*</span>}
      </span>
      {fieldHelper(field, locale) ? (
        <span className="hint">{fieldHelper(field, locale)}</span>
      ) : null}
      {existing && !pending ? (
        <div
          style={{
            marginBottom: 8,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #d3dae0",
            maxWidth: 280,
          }}
        >
          <img
            src={existing}
            alt={fieldLabel(field, locale) || "Image"}
            style={{ display: "block", width: "100%", height: "auto" }}
          />
        </div>
      ) : null}
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(e) => handlePick(e.target.files?.[0] || null)}
      />
      {pending ? (
        <span className="hint" style={{ color: "#1d8f47" }}>
          Ready to upload: {pending.name}
        </span>
      ) : null}
      {existing && !pending ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          style={{
            marginTop: 4,
            background: "none",
            border: "none",
            color: "#c0392b",
            fontSize: 12,
            cursor: "pointer",
            padding: 0,
            width: "max-content",
          }}
        >
          Remove image
        </button>
      ) : null}
      {error ? <span className="error">{error}</span> : null}
    </FieldShell>
  );
}
