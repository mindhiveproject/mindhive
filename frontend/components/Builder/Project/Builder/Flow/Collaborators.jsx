import { ViewportPortal, useStore } from "@xyflow/react";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

const StyledStatus = styled.span`
  color: #8f1f14;
  font: var(--MH-Type-Label-Small);
  white-space: nowrap;
`;

/**
 * Why live collaboration is off, for the top bar. Who is here shows in the
 * facepile in the top navigation (ConnectFacepile).
 */
export function CollaborationStatus({ connected, message }) {
  const { t } = useTranslation("builder");
  if (connected && !message) return null;
  return (
    <StyledStatus>
      {message ||
        t("collaboration.offline", {}, {
          default: "Offline: your changes will be shared when you reconnect",
        })}
    </StyledStatus>
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
