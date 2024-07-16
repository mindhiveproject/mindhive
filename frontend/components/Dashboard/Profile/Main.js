import { useQuery } from "@apollo/client";
import ProfileType from "./Steps/1-ProfileType";
import About from "./Steps/2-AboutMe";
import { GET_PROFILE } from "../../Queries/User";

export default function ProfileMain({ query }) {
  const { selector, page } = query;

  // query the full profile of the user
  const { data } = useQuery(GET_PROFILE);
  console.log({ data });
  const user = data?.authenticatedItem;

  return (
    <div>
      <div>
        <h1>Create Profile</h1>
        <p>
          Your profile is incomplete. Enter the remaining information to
          complete your profile and begin contributing to the MindHive
          community.
        </p>
        <div>Header with the progress bar</div>
      </div>

      {page === "type" && <ProfileType />}
      {page === "about" && <About query={query} user={user} />}
    </div>
  );
}
