import { useEffect, useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";

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
  // not hidden: the join pulse is drawn outside the circle
  overflow: "visible",
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
  borderRadius: "50%",
};

// How long the ring pulses when someone opens the study
const JOIN_PULSE_MS = 2400;

const FACEPILE_CSS = `
.connectFacepile .DesignSystem-IconButton-Icon svg {
  width: 11px;
  height: 8px;
}
.connectFacepile .connectFacepileAvatar {
  position: relative;
  transition: box-shadow 0.25s ease, filter 0.25s ease, opacity 0.25s ease;
}
.connectFacepile .connectFacepileAvatar--here {
  box-shadow:
    0 0 0 2px var(--MH-Theme-Neutrals-White, #ffffff),
    0 0 0 4px var(--presence-color);
}
.connectFacepile .connectFacepileAvatar--away {
  filter: grayscale(1);
}
/* an opaque wash rather than transparency, so the avatar underneath in the
   pile does not show through */
.connectFacepile .connectFacepileAvatar--away::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  opacity: 0.5;
  pointer-events: none;
}
.connectFacepile .connectFacepileAvatar--joined::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 3px solid var(--presence-color);
  pointer-events: none;
  animation: connectFacepileJoin ${JOIN_PULSE_MS / 2}ms ease-out 2;
}
@keyframes connectFacepileJoin {
  from { transform: scale(1); opacity: 0.9; }
  to { transform: scale(1.55); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .connectFacepile .connectFacepileAvatar--joined::after {
    animation: none;
  }
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

/**
 * The ids in `presence` that were not there on the previous change, for
 * JOIN_PULSE_MS. The people already here when presence first arrives do not
 * pulse.
 */
function useJustJoined(presence) {
  const previousRef = useRef(null);
  const timersRef = useRef(new Map());
  const [joined, setJoined] = useState(() => new Set());
  const key = presence ? Object.keys(presence).sort().join(",") : null;

  useEffect(() => {
    if (!presence) {
      previousRef.current = null;
      return;
    }
    const ids = Object.keys(presence).filter((id) => !presence[id].self);
    const previous = previousRef.current;
    previousRef.current = new Set(ids);
    if (!previous) return;
    const fresh = ids.filter((id) => !previous.has(id));
    if (!fresh.length) return;
    setJoined((current) => new Set([...current, ...fresh]));
    fresh.forEach((id) => {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.set(
        id,
        setTimeout(() => {
          timersRef.current.delete(id);
          setJoined((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          });
        }, JOIN_PULSE_MS)
      );
    });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  return joined;
}

/**
 * The people on a study or board. With `presence` (live study canvas only:
 * { [userId]: { color, name } | { self: true } }), the people who have it
 * open now come first with a ring in their colour, pulse as they arrive, and
 * the others are dimmed. Without it, everyone shows the same.
 */
export default function ConnectFacepile({
  collaborators = [],
  presence = null,
  // Avatars shown before a "+N" chip for the rest.
  max = 5,
  children,
}) {
  const { t } = useTranslation("builder");
  const joined = useJustJoined(presence);

  const isHere = (collaborator) => !!presence?.[collaborator?.id];
  const ordered = presence
    ? [
        ...collaborators.filter(isHere),
        ...collaborators.filter((c) => !isHere(c)),
      ]
    : collaborators;
  const shown = ordered.slice(0, max);
  const hidden = ordered.slice(max);

  return (
    <div className="connectFacepile" style={WRAPPER_STYLE}>
      <style dangerouslySetInnerHTML={{ __html: FACEPILE_CSS }} />
      {shown.map((collaborator, index) => {
        const src = photoUrl(collaborator);
        const here = presence?.[collaborator?.id];
        const ringed = here && !here.self;
        const className = [
          "connectFacepileAvatar",
          ringed && "connectFacepileAvatar--here",
          presence && !here && "connectFacepileAvatar--away",
          ringed && joined.has(collaborator.id) && "connectFacepileAvatar--joined",
        ]
          .filter(Boolean)
          .join(" ");
        const label = ringed
          ? t(
              "collaboration.hereNow",
              { name: collaborator?.username },
              { default: `${collaborator?.username} · here now` }
            )
          : collaborator?.username;
        return (
          <span
            key={collaborator?.id || index}
            style={{
              display: "inline-flex",
              flexShrink: 0,
              marginRight: -CONNECT_FACEPILE_OVERLAP_PX,
              // with presence the people here sit on top, so their rings show
              zIndex: presence ? shown.length - index : index + 1,
              position: "relative",
            }}
          >
            <Tooltip content={label} side="bottom">
              <span
                className={className}
                style={
                  ringed
                    ? { ...AVATAR_BASE_STYLE, "--presence-color": here.color }
                    : AVATAR_BASE_STYLE
                }
              >
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
      {hidden.length > 0 && (
        <span
          style={{
            display: "inline-flex",
            flexShrink: 0,
            marginRight: -CONNECT_FACEPILE_OVERLAP_PX,
            zIndex: shown.length + 1,
            position: "relative",
          }}
        >
          <Tooltip
            content={hidden.map((c) => c?.username).filter(Boolean).join(", ")}
            side="bottom"
          >
            <span className="connectFacepileAvatar" style={AVATAR_BASE_STYLE}>
              +{hidden.length}
            </span>
          </Tooltip>
        </span>
      )}
      <span style={{ position: "relative", zIndex: shown.length + 2 }}>
        {children}
      </span>
    </div>
  );
}
