import { useQuery } from "@apollo/client";
import moment from "moment";

import { GET_MY_UPDATES } from "../../Queries/Update";

import UpdateCard from "./UpdateCard";

export default function MyUpdates({ user }) {
  const { data, error, loading } = useQuery(GET_MY_UPDATES, {
    variables: {
      id: user?.id,
    },
  });

  const updates = data?.updates || [];

  return (
    <div className="updatesBoard">
      <h2>Latest updates</h2>
      {updates.length === 0 && <p>There are no updates at the moment.</p>}
      <div className="updates">
        {updates.map((update, num) => (
          <UpdateCard key={num} user={user} update={update} />
        ))}
      </div>
    </div>
  );
}
