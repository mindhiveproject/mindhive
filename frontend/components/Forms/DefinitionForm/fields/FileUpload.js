// Generic file field. Backed by a Keystone file() column (e.g.
// Opportunity.videoFile). Value handling mirrors ImageUpload:
//   - string URL: existing file (display filename)
//   - File:        new pending upload (display name)
//   - object {url, filename}: existing file from GraphQL query
//   - null:        no file
import { fieldLabel, fieldHelper } from "../i18n";
import { FieldShell, fieldShellErrorProps } from "../styles";

function describeExisting(value) {
  if (!value) return null;
  if (typeof value === "string") return { url: value, name: value };
  if (typeof File !== "undefined" && value instanceof File) return null;
  if (typeof value === "object") {
    return {
      url: value.url || null,
      name: value.filename || value.name || "file",
      size: value.filesize || value.size || null,
    };
  }
  return null;
}

function isPendingFile(value) {
  return typeof File !== "undefined" && value instanceof File;
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

export default function FileUpload({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
}) {
  const existing = describeExisting(value);
  const pending = isPendingFile(value) ? value : null;
  const accept = field?.validation?.allowedMimes || undefined;
  const maxBytes = field?.validation?.maxFileSize;

  const handlePick = (file) => {
    if (!file) {
      onChange(null);
      return;
    }
    if (maxBytes && file.size > maxBytes) {
      // eslint-disable-next-line no-console
      console.warn(
        `File too large: ${file.name} (${file.size} bytes; limit ${maxBytes}).`
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
        <div style={{ fontSize: 13, color: "#5f6871" }}>
          Current: {existing.url ? (
            <a
              href={existing.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#336f8a" }}
            >
              {existing.name}
            </a>
          ) : (
            existing.name
          )}
          {existing.size ? (
            <span style={{ color: "#888", marginLeft: 6 }}>
              ({formatBytes(existing.size)})
            </span>
          ) : null}
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
          Ready to upload: {pending.name} ({formatBytes(pending.size)})
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
          Remove file
        </button>
      ) : null}
      {error ? <span className="error">{error}</span> : null}
    </FieldShell>
  );
}
