import { useRef, useCallback, useState, useMemo } from "react";
import { useUnsavedChangesGuard } from "../../../../../../../lib/useUnsavedChangesGuard";
import Card from "./Card";

// Cards holding a collaboration connection at once; the least recently used
// one is closed when another card is opened.
const MAX_ACTIVE_CARDS = 3;

export default function Preview({ cards, user, submitStatuses = {}, proposalId, onUnsavedChangesChange }) {
  const cardSaveStateRef = useRef({});
  const [anyPending, setAnyPending] = useState(false);
  const [activeCardIds, setActiveCardIds] = useState([]);

  // Autosave makes most changes safe to leave; only failed saves need a warning
  // when switching views. Closing the tab also warns while a save is pending.
  const handleSaveStateChange = useCallback(
    (cardId, state) => {
      if (cardId == null) return;
      if (state) {
        cardSaveStateRef.current[cardId] = state;
      } else {
        delete cardSaveStateRef.current[cardId];
      }
      const states = Object.values(cardSaveStateRef.current);
      setAnyPending(states.some((s) => s.pending));
      onUnsavedChangesChange?.(states.some((s) => s.failed));
    },
    [onUnsavedChangesChange]
  );
  useUnsavedChangesGuard(anyPending);

  const activateCard = useCallback((cardId) => {
    setActiveCardIds((prev) =>
      prev[0] === cardId
        ? prev
        : [cardId, ...prev.filter((id) => id !== cardId)].slice(0, MAX_ACTIVE_CARDS)
    );
  }, []);

  const deactivateCard = useCallback((cardId) => {
    setActiveCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : prev
    );
  }, []);

  // Stable per-card callbacks so cards don't re-run their effects every render.
  const callbacks = useMemo(() => {
    const byId = {};
    cards.forEach((card) => {
      const id = card?.id;
      if (id == null) return;
      byId[id] = {
        onActivate: () => activateCard(id),
        onDeactivate: () => deactivateCard(id),
        onSaveStateChange: (state) => handleSaveStateChange(id, state),
      };
    });
    return byId;
    // Recompute only when the set of card ids changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.map((card) => card?.id).join(","), activateCard, deactivateCard, handleSaveStateChange]);

  return (
    <div
      style={{
        backgroundColor: "#f6f9f8",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        borderRadius: "12px",
        padding: "16px 16px 16px 0",
        overflow: "visible",
        touchAction: "pan-y",
        WebkitUserDrag: "none",
        userDrag: "none",
        width: "100%",
        position: "relative",
        isolation: "isolate",
      }}
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      {cards.map((card, index) => (
        <Card
          key={card?.id || index}
          card={card}
          cardId={card?.id}
          user={user}
          submitStatuses={submitStatuses}
          proposalId={proposalId}
          isActive={activeCardIds.includes(card?.id)}
          {...(callbacks[card?.id] || {})}
        />
      ))}
    </div>
  );
}
