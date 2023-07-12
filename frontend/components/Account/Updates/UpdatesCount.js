import { useQuery } from "@apollo/client";
import { COUNT_NEW_UPDATES } from "../../Queries/Update";

export default function UpdatesCount({ user }) {
  const { data, error, loading } = useQuery(COUNT_NEW_UPDATES, {
    variables: {
      id: user?.id,
    },
  });

  const updates = data?.updates || [];

  if (updates.length > 0) {
    return <span className="updateCounter">{updates.length}</span>;
  }
}
