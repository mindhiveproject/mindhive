import Card from "./Card";

export default function Preview({ cards }) {
  return (
    <>
      {cards.map((card) => (
        <Card card={card} cardId={card?.id} />
      ))}
    </>
  );
}
