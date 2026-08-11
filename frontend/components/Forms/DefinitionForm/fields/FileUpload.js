// Generic file field. Backed by a Keystone file() column (e.g.
// Opportunity.videoFile). Value handling mirrors ImageUpload:
//   - string URL: existing file (display filename)
//   - File:        new pending upload (display name)
//   - object {url, filename}: existing file from GraphQL query
//   - null:        no file
import useTranslation from "next-translate/useTranslation";
import { useRef } from "react";
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

function isVideoUpload(field, existing) {
  const allowedMimes = String(field?.validation?.allowedMimes || "")
    .split(",")
    .map((mime) => mime.trim().toLowerCase());
  const fileName = String(existing?.name || existing?.url || "")
    .split(/[?#]/)[0]
    .toLowerCase();

  return (
    field?.name === "videoFile" ||
    field?.storageColumn === "videoFile" ||
    allowedMimes.some((mime) => mime.startsWith("video/")) ||
    /\.(mp4|webm|mov|m4v|ogv|ogg)$/.test(fileName)
  );
}

export default function FileUpload({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
  readOnly = false,
}) {
  const { t } = useTranslation("common");
  const inputRef = useRef(null);
  const existing = describeExisting(value);
  const pending = isPendingFile(value) ? value : null;
  const accept = field?.validation?.allowedMimes || undefined;
  const maxBytes = field?.validation?.maxFileSize;
  const hasExisting = !!(existing && !pending);
  const isVideo = isVideoUpload(field, existing);
  const interactionsDisabled = disabled && !readOnly;

  const applyFile = (file) => {
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

  const handlePick = (file) => {
    if (!file) return;
    if (hasExisting) {
      const confirmed = window.confirm(
        t("definitionForm.file.replaceConfirm", {}, {
          default:
            "Replace the current file? The existing upload will be overwritten when you save.",
        })
      );
      if (!confirmed) {
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
    }
    applyFile(file);
  };

  const handleDownload = () => {
    if (!existing?.url) return;
    const anchor = document.createElement("a");
    anchor.href = existing.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    if (existing.name) {
      anchor.download = existing.name;
    }
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
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
          {t("definitionForm.file.current", {}, { default: "Current:" })}{" "}
          {existing.url ? (
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
      {!readOnly ? (
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(e) => handlePick(e.target.files?.[0] || null)}
        />
      ) : null}
      {pending ? (
        <span className="hint" style={{ color: "#1d8f47" }}>
          {t("definitionForm.file.readyToUpload", {
            name: pending.name,
            size: formatBytes(pending.size),
          }, {
            default: "Ready to upload: {{name}} ({{size}})",
          })}
        </span>
      ) : null}
      {existing && !pending ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 4,
          }}
        >
          {existing.url ? (
            <button
              type="button"
              onClick={handleDownload}
              disabled={interactionsDisabled}
              style={{
                background: "none",
                border: "none",
                color: "var(--MH-Theme-Primary-Dark, #336f8a)",
                fontSize: 12,
                cursor: interactionsDisabled ? "not-allowed" : "pointer",
                padding: 0,
                width: "max-content",
              }}
            >
              {isVideo
                ? t("definitionForm.file.downloadVideo", {}, {
                    default: "Download video",
                  })
                : t("definitionForm.file.download", {}, {
                    default: "Download file",
                  })}
            </button>
          ) : null}
          {!readOnly ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled}
              style={{
                background: "none",
                border: "none",
                color: "#c0392b",
                fontSize: 12,
                cursor: disabled ? "not-allowed" : "pointer",
                padding: 0,
                width: "max-content",
              }}
            >
              {t("definitionForm.file.remove", {}, {
                default: "Remove file",
              })}
            </button>
          ) : null}
        </div>
      ) : null}
      {existing?.url && isVideo ? (
        <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
          <span className="hint">
            {t("definitionForm.file.previewVideo", {}, {
              default: "Preview video",
            })}
          </span>
          <video
            src={existing.url}
            controls
            preload="metadata"
            aria-label={t("definitionForm.file.previewVideo", {}, {
              default: "Preview video",
            })}
            style={{ width: "100%", maxHeight: 360, borderRadius: 12 }}
          />
        </div>
      ) : null}
      {error ? <span className="error">{error}</span> : null}
    </FieldShell>
  );
}
