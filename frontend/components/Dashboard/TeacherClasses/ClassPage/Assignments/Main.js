import Link from "next/link";
import { useRouter } from "next/router";

import { useQuery } from "@apollo/client";
import { GET_MY_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";

import AssignmentTab from "./Tab";
import AddAssignment from "./Add";
import ViewAssignment from "./View";
import Overview from "../Overview/HomeworkCompletion";

export default function Settings({ myclass, user, query }) {
  const router = useRouter();
  const { action, assignment } = query;

  const { data, loading, error } = useQuery(GET_MY_CLASS_ASSIGNMENTS, {
    variables: { userId: user?.id, classId: myclass?.id },
  });
  const assignments = data?.assignments || [];

  if (action === "add") {
    return (
      <div className="assignments">
        <AddAssignment myclass={myclass} user={user} query={query} />
      </div>
    );
  }

  if (action === "overview") {
    return (
      <div className="assignments">
        <Overview
          myclass={myclass}
          user={user}
          query={query}
          assignments={assignments}
        />
      </div>
    );
  }

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
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "assignments",
              action: "add",
            },
          }}
        >
          <button>Add assignment</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="assignments">
      <div className="subheader">
        <div>
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "assignments",
                action: "add",
              },
            }}
          >
            <button>Add assignment</button>
          </Link>
        </div>
        <div>
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "assignments",
                action: "overview",
              },
            }}
          >
            <button className="secondary">Class homework overview</button>
          </Link>
        </div>
      </div>

      {assignments.map((assignment) => (
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
