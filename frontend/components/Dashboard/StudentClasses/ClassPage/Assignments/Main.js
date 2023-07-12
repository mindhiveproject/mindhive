import Link from "next/link";
import { useRouter } from "next/router";

import { useQuery } from "@apollo/client";
import { GET_MY_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";

import AssignmentTab from "./Tab";

export default function Settings({ myclass, user, query }) {
  const router = useRouter();
  const { action, assignment } = query;

  const { data, loading, error } = useQuery(GET_MY_CLASS_ASSIGNMENTS, {
    variables: { userId: user?.id, classId: myclass?.id },
  });
  const assignments = data?.assignments || [];

  if (action === "view" && assignment) {
    return (
      <div className="assignments">
        <ViewAssignment
          code={assignment}
          myclass={myclass}
          user={user}
          query={query}
        />
      </div>
    );
  }

  if (assignments?.length === 0) {
    return (
      <div className="empty">
        <div>There are no assignments yet.</div>
      </div>
    );
  }

  return (
    <div className="assignments">
      {assignments
        .filter((a) => a?.public)
        .map((assignment) => (
          <AssignmentTab
            key={assignment?.id}
            myclass={myclass}
            user={user}
            query={query}
            assignment={assignment}
          />
        ))}
    </div>
  );
}
