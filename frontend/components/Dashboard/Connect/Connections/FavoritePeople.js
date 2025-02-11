import { useQuery } from "@apollo/client";
import { MY_FAVORITE_PEOPLE } from "../../../Queries/User";
import ProfileCard from "../Bank/Card";
import StyledConnect from "../../../styles/StyledConnect";

export default function FavoritePeople({ user }) {
  const { data, loading, error } = useQuery(MY_FAVORITE_PEOPLE);
  const people = data?.authenticatedItem?.favoritePeople || [];

  return (
    <StyledConnect>
      <div>
        <h3>Favorite people</h3>
        <div className="cards">
          {people.map((profile) => (
            <ProfileCard key={profile?.id} user={user} profile={profile} />
          ))}
        </div>
      </div>
    </StyledConnect>
  );
}
