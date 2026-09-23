import Tooltip from "../../../DesignSystem/Tooltip";

export const CONNECT_FACEPILE_SIZE_PX = 41;
export const CONNECT_FACEPILE_OVERLAP_PX = 15;

export const CONNECT_FACEPILE_CHEVRON_BUTTON_STYLE = {
  width: CONNECT_FACEPILE_SIZE_PX,
  height: CONNECT_FACEPILE_SIZE_PX,
  padding: 0,
  background: "var(--MH-Theme-Tertiary-Light, #F6F9F8)",
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
};

const WRAPPER_STYLE = {
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
};

const AVATAR_BASE_STYLE = {
  width: CONNECT_FACEPILE_SIZE_PX,
  height: CONNECT_FACEPILE_SIZE_PX,
  borderRadius: "50%",
  overflow: "hidden",
  flexShrink: 0,
  boxSizing: "border-box",
  background: "var(--MH-Theme-Neutrals-Light, #e6e6e6)",
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  font: "var(--MH-Type-Label-Small, 500 12px/16px Inter, sans-serif)",
};

const PHOTO_STYLE = {
  width: CONNECT_FACEPILE_SIZE_PX,
  height: CONNECT_FACEPILE_SIZE_PX,
  objectFit: "cover",
  display: "block",
};

const CHEVRON_ICON_STYLE = `
.connectFacepile .DesignSystem-IconButton-Icon svg {
  width: 11px;
  height: 8px;
}
`;

function photoUrl(collaborator) {
  return (
    collaborator?.image?.image?.publicUrlTransformed ||
    collaborator?.image?.keystoneImage?.url ||
    ""
  );
}

function initial(collaborator) {
  const name = collaborator?.username || "";
  return name.slice(0, 1).toUpperCase() || "?";
}

export function ConnectFacepileChevron() {
  return (
    <svg
      width="11"
      height="8"
      viewBox="0 0 11 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M5.16949 8L0 3H10.339L5.16949 8Z" fill="currentColor" />
    </svg>
  );
}

export default function ConnectFacepile({ collaborators = [], children }) {
  return (
    <div className="connectFacepile" style={WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: CHEVRON_ICON_STYLE }} />
      {collaborators.map((collaborator, index) => {
        const src = photoUrl(collaborator);
        return (
          <span
            key={collaborator?.id || index}
            style={{
              display: "inline-flex",
              flexShrink: 0,
              marginRight: -CONNECT_FACEPILE_OVERLAP_PX,
              zIndex: index + 1,
              position: "relative",
            }}
          >
            <Tooltip
              content={collaborator?.username}
              side="bottom"
            >
              <span style={AVATAR_BASE_STYLE}>
                {src ? (
                  <img
                    src={src}
                    alt=""
                    width={CONNECT_FACEPILE_SIZE_PX}
                    height={CONNECT_FACEPILE_SIZE_PX}
                    style={PHOTO_STYLE}
                  />
                ) : (
                  initial(collaborator)
                )}
              </span>
            </Tooltip>
          </span>
        );
      })}
      <span style={{ position: "relative", zIndex: collaborators.length + 1 }}>
        {children}
      </span>
    </div>
  );
}
