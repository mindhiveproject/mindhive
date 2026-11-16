import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Same colours and assignment as the collaboration server and the TipTap
// cursors, so a person has one colour everywhere.
const COLORS = [
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#f59e0b",
  "#3b82f6",
];

export function userColor(id = "") {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function displayName(user) {
  const full = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  return full || user?.username || "Someone";
}

// Cursor updates are sent at most this often
const CURSOR_INTERVAL_MS = 50;

/**
 * Who else has this study open and what they are doing, through the
 * provider's awareness (not saved anywhere). Each person shares:
 *   user      { id, name, color }
 *   cursor    { x, y } in canvas coordinates, or null off the canvas
 *   selection ids of the blocks they selected
 *   editing   id of the block open in their side panel, or null
 *
 * Returns the other people (one entry per person, even with several tabs)
 * and setters for this person's state. Without a provider it is all empty.
 */
export default function usePresence({ provider, user }) {
  const awareness = provider?.awareness || null;
  const [states, setStates] = useState([]);

  useEffect(() => {
    if (!awareness || !user?.id) return undefined;
    awareness.setLocalStateField("user", {
      id: user.id,
      name: displayName(user),
      color: userColor(user.id),
    });
    const sync = () => {
      const list = [];
      awareness.getStates().forEach((state, clientId) => {
        if (clientId !== awareness.clientID && state?.user?.id) {
          list.push({ clientId, ...state });
        }
      });
      setStates(list);
    };
    sync();
    awareness.on("change", sync);
    return () => {
      awareness.off("change", sync);
      awareness.setLocalState(null);
    };
  }, [awareness, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- the user is fixed

  // one entry per person; their most recently active tab wins
  const others = useMemo(() => {
    const byUser = new Map();
    states.forEach((state) => {
      if (state.user.id === user?.id) return;
      const previous = byUser.get(state.user.id);
      if (!previous || (state.cursor && !previous.cursor)) {
        byUser.set(state.user.id, state);
      }
    });
    return Array.from(byUser.values());
  }, [states, user?.id]);

  const lastCursorRef = useRef(0);
  const pendingCursorRef = useRef(null);
  const setCursor = useCallback(
    (cursor) => {
      if (!awareness) return;
      const send = (value) => {
        lastCursorRef.current = Date.now();
        awareness.setLocalStateField("cursor", value);
      };
      clearTimeout(pendingCursorRef.current);
      if (!cursor) {
        send(null);
        return;
      }
      const wait = CURSOR_INTERVAL_MS - (Date.now() - lastCursorRef.current);
      if (wait <= 0) send(cursor);
      else pendingCursorRef.current = setTimeout(() => send(cursor), wait);
    },
    [awareness]
  );

  const setSelection = useCallback(
    (ids) => awareness?.setLocalStateField("selection", ids || []),
    [awareness]
  );

  const setEditing = useCallback(
    (id) => awareness?.setLocalStateField("editing", id || null),
    [awareness]
  );

  useEffect(() => () => clearTimeout(pendingCursorRef.current), []);

  return { others, setCursor, setSelection, setEditing };
}

/**
 * Per block: the other person who has it open in their side panel, or else
 * who has it selected. { [nodeId]: { name, color, editing } }
 */
export function presenceByNode(others) {
  const result = {};
  others.forEach(({ user, selection }) => {
    (selection || []).forEach((id) => {
      if (!result[id]) result[id] = { name: user.name, color: user.color, editing: false };
    });
  });
  others.forEach(({ user, editing }) => {
    if (editing) result[editing] = { name: user.name, color: user.color, editing: true };
  });
  return result;
}
