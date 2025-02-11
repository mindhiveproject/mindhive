import FavoritePeople from "./FavoritePeople";

export default function Connections({ query, user }) {
  return (
    <>
      <h1>My connections</h1>
      <FavoritePeople user={user} />
    </>
  );
}
