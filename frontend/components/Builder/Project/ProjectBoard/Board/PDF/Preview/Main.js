import Card from "./Card";

export default function Preview({ cards, user, submitStatuses = {} }) {
  return (
    <div
      style={{
        backgroundColor: "#f6f9f8",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        borderRadius: "12px",
        padding: "16px",
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
        <Card key={card?.id || index} card={card} cardId={card?.id} user={user} submitStatuses={submitStatuses} />
      ))}
    </div>
  );
}
