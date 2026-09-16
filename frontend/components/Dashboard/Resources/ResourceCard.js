import Card from "../../DesignSystem/Card";
import Chip from "../../DesignSystem/Chip";

/**
 * Resource Center listing card. Layout follows ConnectCard (outline surface,
 * optional type chip, title/meta, tag chips, divider + trailing actions) without
 * an avatar. The card is a static container; actions are passed in.
 *
 * @param {React.ReactNode} [typeLabel]
 * @param {React.ReactNode} title
 * @param {React.ReactNode} [subtitle]
 * @param {React.ReactNode} [description]
 * @param {React.ReactNode} [chips]
 * @param {React.ReactNode} [actions]
 */
export default function ResourceCard({
  typeLabel = null,
  title,
  subtitle = null,
  description = null,
  chips = null,
  actions = null,
}) {
  return (
    <Card variant="outline" padding={16} style={{ height: "100%" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 16,
          flex: "1 1 auto",
          minHeight: 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {typeLabel && (
            <Chip
              variant="static"
              tone="info"
              label={typeLabel}
              style={{ alignSelf: "flex-start" }}
            />
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {subtitle}
              </span>
            )}
            {description && (
              <p
                className="MH-Type-Body-Base"
                style={{
                  margin: 0,
                  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
                }}
              >
                {description}
              </p>
            )}
            {chips && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 4,
                  minWidth: 0,
                }}
              >
                {chips}
              </div>
            )}
          </div>
        </div>

        {actions && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
          </div>
        )}
      </div>
    </Card>
  );
}
