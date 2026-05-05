"use client";

import Button from "../../../../../../../../DesignSystem/Button";

const LIST_STYLE = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
  width: "100%",
};

const ROW_INNER_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  textAlign: "left",
  minWidth: 0,
};

const TITLE_STYLE = {
  display: "block",
  fontWeight: 600,
  lineHeight: "1.25",
};

const SUB_STYLE = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "#6a6a6a",
  marginTop: "2px",
  lineHeight: "1.3",
};

function itemKey(item, index) {
  return `${item.title}-${index}-${item.link || "nolink"}`;
}

/**
 * One DesignSystem button per resource row for InfoTooltip `action`.
 * Linked items open in a new tab; items without a URL render as disabled buttons.
 */
export default function ResourcesTooltipResourceButtons({
  items,
  openLinkLabel,
  noLinkHint,
}) {
  return (
    <div style={LIST_STYLE}>
      {(items || []).map((item, index) => {
        const href = item.link && String(item.link).trim();
        const key = itemKey(item, index);

        if (href) {
          return (
            <Button
              key={key}
              type="button"
              variant="outline"
              onClick={() => {
                window.open(href, "_blank", "noopener,noreferrer");
              }}
              style={{
                width: "100%",
                justifyContent: "flex-start",
                borderRadius: "10px",
                height: "auto",
                minHeight: "44px",
                paddingTop: "10px",
                paddingBottom: "10px",
                paddingLeft: "14px",
                paddingRight: "14px",
              }}
            >
              <span style={ROW_INNER_STYLE}>
                <img
                  src={item.img}
                  alt=""
                  width={20}
                  height={20}
                  style={{ flexShrink: 0 }}
                  aria-hidden
                />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={TITLE_STYLE}>{item.title}</span>
                  <span style={SUB_STYLE}>{openLinkLabel}</span>
                </span>
              </span>
            </Button>
          );
        }

        return (
          <Button
            key={key}
            type="button"
            variant="outline"
            disabled
            style={{
              width: "100%",
              justifyContent: "flex-start",
              borderRadius: "10px",
              height: "auto",
              minHeight: "44px",
              paddingTop: "10px",
              paddingBottom: "10px",
              paddingLeft: "14px",
              paddingRight: "14px",
            }}
          >
            <span style={ROW_INNER_STYLE}>
              <img
                src={item.img}
                alt=""
                width={20}
                height={20}
                style={{ flexShrink: 0, opacity: 0.55 }}
                aria-hidden
              />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={TITLE_STYLE}>{item.title}</span>
                <span style={SUB_STYLE}>{item.alt || noLinkHint}</span>
              </span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}
