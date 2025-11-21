import { useQuery } from "@apollo/client";
import { MY_FAVORITE_PEOPLE } from "../../../Queries/User";
import ProfileCard from "../ConnectProfileCard";
import StyledConnect from "../../../styles/StyledConnect";
import useTranslation from "next-translate/useTranslation";

export default function FavoritePeople({ user }) {
  const { t } = useTranslation("home");
  const { data, loading, error } = useQuery(MY_FAVORITE_PEOPLE);
  const people = data?.authenticatedItem?.favoritePeople || [];

  return (
    <StyledConnect>
      <div>
        <h3>{t("favoritePeople")}</h3>
        <div className="cards">
          {people.map((profile) => (
            <ProfileCard key={profile?.id} user={user} profile={profile} />
          ))}
        </div>
      </div>
    </StyledConnect>
  );
}
