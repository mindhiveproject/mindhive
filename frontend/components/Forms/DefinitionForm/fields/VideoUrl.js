// Video-URL field. Plain text input plus a live embed preview when the
// URL points at a known platform (YouTube, Vimeo, Loom, Google Drive)
// or a direct video file. Mirrors the preview logic the legacy
// Opportunity Explore Detail uses; kept local here so the field stays
// self-contained.
import { fieldLabel, fieldHelper, fieldPlaceholder } from "../i18n";
import { FieldShell, fieldShellErrorProps } from "../styles";

// Pull an embeddable URL out of either a raw URL or a pasted
// <iframe src="..."> snippet.
function extractUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const iframeMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch) return iframeMatch[1];
  return trimmed;
}

function detectEmbed(rawUrl) {
  const url = extractUrl(rawUrl);
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "youtu.be") {
      let id = null;
      if (host === "youtu.be") id = u.pathname.slice(1);
      else id = u.searchParams.get("v") || u.pathname.split("/").pop();
      if (id) return { type: "iframe", src: `https://www.youtube.com/embed/${id}` };
    }

    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return { type: "iframe", src: `https://player.vimeo.com/video/${id}` };
    }

    if (host.endsWith("loom.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[parts.length - 1];
      if (id) return { type: "iframe", src: `https://www.loom.com/embed/${id}` };
    }

    if (host.endsWith("drive.google.com")) {
      // Best-effort: try to swap /view to /preview.
      return { type: "iframe", src: url.replace(/\/view.*$/, "/preview") };
    }

    // Direct video file?
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(u.pathname)) {
      return { type: "video", src: url };
    }

    return { type: "iframe", src: url };
  } catch {
    return null;
  }
}

export default function VideoUrl({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
}) {
  const embed = detectEmbed(value);
  return (
    <FieldShell {...fieldShellErrorProps(error)}>
      <span className="label-text">
        {fieldLabel(field, locale)}
        {field.isRequired && <span className="required">*</span>}
      </span>
      {fieldHelper(field, locale) ? (
        <span className="hint">{fieldHelper(field, locale)}</span>
      ) : null}
      <input
        type="text"
        value={value ?? ""}
        placeholder={fieldPlaceholder(field, locale) || "https://youtube.com/..."}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {embed ? (
        <div
          style={{
            marginTop: 8,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #d3dae0",
            maxWidth: 480,
          }}
        >
          {embed.type === "iframe" ? (
            <iframe
              src={embed.src}
              title={fieldLabel(field, locale) || "Video preview"}
              width="100%"
              height="270"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              style={{ border: 0, display: "block" }}
            />
          ) : (
            <video
              src={embed.src}
              controls
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              <track kind="captions" />
            </video>
          )}
        </div>
      ) : null}
      {error ? <span className="error">{error}</span> : null}
    </FieldShell>
  );
}
