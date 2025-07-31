import Card from "./Card";

export default function Preview({ cards, user }) {
  return (
    <>
      {cards.map((card) => (
        <Card card={card} cardId={card?.id} user={user} />
      ))}
    </>
  );
}
