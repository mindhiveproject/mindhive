import Card from "../../DesignSystem/Card";
import Chip from "../../DesignSystem/Chip";

/**
 * Shared Connect entity card (Figma nodes 5082:1843 / 5093:2371), used for both
 * people and organizations: a quiet type chip, a left-aligned avatar + name
 * row, a description, tag chips, then a divider and trailing actions.
 *
 * The card is a static outline container — the trailing "Profile" button is the
 * only navigation, so nothing here is a link. Surface styling and the
 * page-fade guard live in DesignSystem/Card.
 *
 * @param {React.ReactNode} [typeLabel] - Text for the top-left type chip
 *   ("Connect Profile", "Organization").
 * @param {{ src?: string, fallbackLabel?: string, fallbackBackground?: string }} [avatar]
 * @param {React.ReactNode} title - Primary line (name).
 * @param {React.ReactNode} [subtitle] - Secondary line (occupation, location).
 * @param {React.ReactNode} [status] - Standing of the entity (e.g. verified),
 *   on its own line under the name.
 * @param {React.ReactNode} [chips] - Tag chips under the description.
 * @param {"row"|"column"} [chipsDirection="row"] - Chip layout: org tags wrap in
 *   a row, a person's organization chips stack in a column.
 * @param {React.ReactNode} [description] - Two-line summary.
 * @param {React.ReactNode} [actions] - Buttons below the divider, trailing-aligned.
 */
export default function ConnectCard({
  typeLabel = null,
  avatar,
  title,
  subtitle = null,
  status = null,
  chips = null,
  chipsDirection = "row",
  description = null,
  actions = null,
}) {
  return (
    <Card variant="outline" padding={16} style={{ maxWidth: 368 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          flex: "1 1 auto",
          minHeight: 0,
        }}
      >
        {typeLabel && (
          <Chip
            variant="static"
            tone="neutral"
            label={typeLabel}
            style={{ alignSelf: "flex-start" }}
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 78,
                height: 78,
                flexShrink: 0,
                borderRadius: "50%",
                overflow: "hidden",
                background: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)",
              }}
            >
              {avatar?.src ? (
                <img
                  src={avatar.src}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  aria-hidden
                  className="MH-Type-Heading-Small"
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--MH-Theme-Neutrals-Black, #171717)",
                    background: avatar?.fallbackBackground || undefined,
                  }}
                >
                  {avatar?.fallbackLabel}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span
                className="MH-Type-Title-Base"
                style={{
                  color: "var(--MH-Theme-Neutrals-Black, #171717)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  wordBreak: "break-word",
                }}
              >
                {title}
              </span>
              {subtitle && (
                <span
                  className="MH-Type-Body-Base"
                  style={{
                    color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          {status}

          {description && (
            <p
              className="MH-Type-Body-Base"
              style={{
                margin: 0,
                color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
              }}
            >
              {description}
            </p>
          )}

          {chips && (
            <div
              style={{
                display: "flex",
                flexDirection: chipsDirection === "column" ? "column" : "row",
                alignItems: "flex-start",
                flexWrap: chipsDirection === "column" ? "nowrap" : "wrap",
                gap: 4,
                minWidth: 0,
              }}
            >
              {chips}
            </div>
          )}
        </div>

        {actions && (
          <>
            {/* Figma keeps a fixed 16px on each side of the divider (the column
               gap), so it is not floated to the card bottom. */}
            <hr
              style={{
                margin: 0,
                width: "100%",
                height: 0,
                flexShrink: 0,
                border: "none",
                borderTop:
                  "1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6)",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {actions}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
