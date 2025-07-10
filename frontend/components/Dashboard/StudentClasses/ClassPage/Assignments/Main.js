import Link from "next/link";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import { useQuery } from "@apollo/client";
import { GET_CLASS_ASSIGNMENTS_FOR_STUDENTS } from "../../../../Queries/Assignment";

import AssignmentTab from "./Tab";

export default function Settings({ myclass, user, query }) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { action, assignment } = query;

  const { data, loading, error } = useQuery(
    GET_CLASS_ASSIGNMENTS_FOR_STUDENTS,
    {
      variables: { userId: user?.id, classId: myclass?.id },
    }
  );
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
        <div>{t("assignments.noAssignments")}</div>
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
