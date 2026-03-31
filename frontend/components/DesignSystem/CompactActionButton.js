"use client";

import { useState } from "react";

const ROOT_BASE_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "30px",
  height: "30px",
  padding: "0 4px",
  borderRadius: "8px",
  border: "1px solid var(--MH-Theme-Neutrals-Light, #E6E6E6)",
  background: "var(--MH-Theme-Neutrals-White, #FFFFFF)",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  boxSizing: "border-box",
  cursor: "pointer",
  transition:
    "background-color 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s, opacity 0.2s",
};

const LABEL_BASE_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  padding: "4px",
  borderRadius: "8px",
  background: "#FFFFFF",
  border: "1px solid #E6E6E6",
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  boxSizing: "border-box",
  cursor: "default",
};

const LABEL_SELECTED_STYLE = {
  background: "rgba(101, 85, 143, 0.12)",
};

const HOVER_STYLE = {
  background: "#D3E0E3",
  border: "none",
};

const DELETE_HOVER_STYLE = {
  background: "#FEECEB",
  border: "1px solid #FEECEB",
};

const PRESSED_STYLE = {
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
};

const DISABLED_STYLE = {
  border: "1px solid rgba(101, 85, 143, 0.12)",
  opacity: 0.2,
  cursor: "default",
};

const KIND_STYLES = {
  close: {},
  asset: {},
  delete: {
    color: "var(--MH-Theme-Warning-Base, #B9261A)",
  },
};

const ICON_WRAPPER_STYLE = {
  width: 20,
  height: 20,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const LABEL_ICON_WRAPPER_STYLE = {
  width: 24,
  height: 24,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  opacity: 0.7,
};

const FOCUS_VISIBLE_STYLE = `
.DesignSystem-CompactActionButton:focus-visible {
  outline: 2px solid var(--MH-Theme-Primary-Dark, #336F8A);
  outline-offset: 2px;
}
`;

const DeleteIcon = () => (
  <img src="/assets/icons/visualize/delete.svg" alt="Delete icon" aria-hidden />
);

const ImagePlusIcon = () => (
  <img src="/assets/tiptapIcons/imagePlus.svg" alt="Image add icon" width="20" height="20" aria-hidden />
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function getDefaultIcon(kind) {
  if (kind === "delete") return <DeleteIcon />;
  if (kind === "asset") return <ImagePlusIcon />;
  return <CloseIcon />;
}

export default function CompactActionButton({
  kind = "close",
  mode = "action",
  selected = false,
  icon = null,
  disabled = false,
  type = "button",
  onClick,
  className,
  style = {},
  title,
  ariaLabel,
  ...rest
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  if (mode === "label") {
    const labelStyle = {
      ...LABEL_BASE_STYLE,
      ...(selected ? LABEL_SELECTED_STYLE : {}),
      ...style,
    };
    return (
      <span
        className={
          className
            ? `DesignSystem-CompactActionButtonLabel ${className}`
            : "DesignSystem-CompactActionButtonLabel"
        }
        style={labelStyle}
        title={title}
        aria-label={ariaLabel}
        aria-disabled="true"
        {...rest}
      >
        <span style={LABEL_ICON_WRAPPER_STYLE}>{icon ?? getDefaultIcon(kind)}</span>
      </span>
    );
  }

  let buttonStyle = {
    ...ROOT_BASE_STYLE,
    ...(KIND_STYLES[kind] || KIND_STYLES.close),
  };

  if (disabled) {
    buttonStyle = { ...buttonStyle, ...DISABLED_STYLE };
  } else if (pressed) {
    buttonStyle = { ...buttonStyle, ...PRESSED_STYLE };
  } else if (hovered) {
    buttonStyle =
      kind === "delete"
        ? { ...buttonStyle, ...DELETE_HOVER_STYLE }
        : { ...buttonStyle, ...HOVER_STYLE };
  }

  buttonStyle = { ...buttonStyle, ...style };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FOCUS_VISIBLE_STYLE }} />
      <button
        type={type}
        className={
          className
            ? `DesignSystem-CompactActionButton ${className}`
            : "DesignSystem-CompactActionButton"
        }
        style={buttonStyle}
        onClick={onClick}
        disabled={disabled}
        title={title}
        aria-label={ariaLabel}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPressed(false);
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        {...rest}
      >
        <span style={ICON_WRAPPER_STYLE}>{icon ?? getDefaultIcon(kind)}</span>
      </button>
    </>
  );
}
