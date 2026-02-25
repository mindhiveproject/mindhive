import { useRef, useCallback } from "react";
import Card from "./Card";

export default function Preview({ cards, user, submitStatuses = {}, proposalId, onUnsavedChangesChange }) {
  const cardUnsavedRef = useRef({});

  const handleUnsavedChange = useCallback(
    (cardId, hasChanges) => {
      if (cardId != null) {
        cardUnsavedRef.current[cardId] = hasChanges;
      }
      const hasAny = Object.values(cardUnsavedRef.current).some(Boolean);
      onUnsavedChangesChange?.(hasAny);
    },
    [onUnsavedChangesChange]
  );

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
          onUnsavedChange={onUnsavedChangesChange ? (hasChanges) => handleUnsavedChange(card?.id, hasChanges) : undefined}
        />
      ))}
    </div>
  );
}
