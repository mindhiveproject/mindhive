import Button from "../../DesignSystem/Button";
import { getOpportunityVideoSources } from "../../../lib/opportunityVideoEmbed";

const DEFAULT_VIDEO_STYLE = {
  width: "100%",
  maxHeight: 420,
  display: "block",
  background: "#000",
};

const DEFAULT_IFRAME_WRAP_STYLE = {
  position: "relative",
  paddingBottom: "56.25%",
  height: 0,
  background: "#000",
};

const DEFAULT_IFRAME_STYLE = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  border: 0,
};

export default function OpportunityIntroVideoPlayer({
  opportunity,
  title,
  openInNewTabLabel,
  videoStyle,
  iframeWrapStyle,
  iframeStyle,
  borderRadius,
}) {
  const {
    directVideoSrc,
    embedUrl,
    fallbackIframeSrc,
    externalVideoUrl,
    coverUrl,
  } = getOpportunityVideoSources(opportunity);

  const resolvedVideoStyle = {
    ...DEFAULT_VIDEO_STYLE,
    ...(borderRadius != null ? { borderRadius } : {}),
    ...videoStyle,
  };
  const resolvedIframeWrapStyle = {
    ...DEFAULT_IFRAME_WRAP_STYLE,
    ...(borderRadius != null
      ? { borderRadius, overflow: "hidden" }
      : {}),
    ...iframeWrapStyle,
  };
  const resolvedIframeStyle = {
    ...DEFAULT_IFRAME_STYLE,
    ...iframeStyle,
  };

  if (directVideoSrc) {
    return (
      <video
        controls
        preload="metadata"
        poster={coverUrl || undefined}
        src={directVideoSrc}
        style={resolvedVideoStyle}
      />
    );
  }

  const iframeSrc = embedUrl || fallbackIframeSrc;
  if (iframeSrc) {
    return (
      <div style={resolvedIframeWrapStyle}>
        <iframe
          src={iframeSrc}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          frameBorder="0"
          style={resolvedIframeStyle}
        />
      </div>
    );
  }

  if (externalVideoUrl) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 120,
          padding: 24,
          ...(borderRadius != null ? { borderRadius } : {}),
          background: "var(--MH-Theme-Neutrals-Lighter, #f7f9f8)",
        }}
      >
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            window.open(externalVideoUrl, "_blank", "noopener,noreferrer")
          }
        >
          {openInNewTabLabel}
        </Button>
      </div>
    );
  }

  return null;
}
