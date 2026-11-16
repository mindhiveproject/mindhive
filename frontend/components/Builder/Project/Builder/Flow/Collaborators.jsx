import { ViewportPortal, useStore } from "@xyflow/react";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

const StyledCollaborators = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .avatars {
    display: flex;
  }

  .avatar {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    margin-left: -6px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    color: #ffffff;
    font: var(--MH-Type-Label-Base);
    cursor: default;
  }

  .avatar:first-child {
    margin-left: 0;
  }

  .status {
    color: #8f1f14;
    font: var(--MH-Type-Label-Small);
    white-space: nowrap;
  }
`;

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

/** The people working on the study right now, for the top bar. */
export function CollaboratorsBar({ others, connected, message }) {
  const { t } = useTranslation("builder");
  if (!others.length && connected && !message) return null;
  return (
    <StyledCollaborators>
      {(message || !connected) && (
        <span className="status">
          {message ||
            t("collaboration.offline", {}, {
              default: "Offline: your changes will be shared when you reconnect",
            })}
        </span>
      )}
      <div className="avatars">
        {others.map(({ user }) => (
          <div
            key={user.id}
            className="avatar"
            style={{ background: user.color }}
            title={user.name}
            aria-label={user.name}
          >
            {initials(user.name)}
          </div>
        ))}
      </div>
    </StyledCollaborators>
  );
}

/** Other people's pointers, drawn on the canvas where they point. */
export function RemoteCursors({ others }) {
  // keep pointers and names the same size at any zoom
  const zoom = useStore((state) => state.transform[2]);
  return (
    <ViewportPortal>
      {others
        .filter((person) => person.cursor)
        .map(({ user, cursor }) => (
          <div
            key={user.id}
            style={{
              position: "absolute",
              transform: `translate(${cursor.x}px, ${cursor.y}px) scale(${1 / zoom})`,
              transformOrigin: "0 0",
              pointerEvents: "none",
              zIndex: 1000,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path
                d="M1 1 L1 15 L5 11 L8 17 L10.5 16 L7.5 10 L13 10 Z"
                fill={user.color}
                stroke="#ffffff"
                strokeWidth="1.2"
              />
            </svg>
            <div
              style={{
                marginLeft: 14,
                marginTop: -4,
                padding: "2px 6px",
                borderRadius: 4,
                background: user.color,
                color: "#ffffff",
                font: "var(--MH-Type-Label-Small)",
                whiteSpace: "nowrap",
              }}
            >
              {user.name}
            </div>
          </div>
        ))}
    </ViewportPortal>
  );
}
