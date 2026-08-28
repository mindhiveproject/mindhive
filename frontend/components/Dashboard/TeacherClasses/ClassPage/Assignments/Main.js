import Link from "next/link";
import { useRouter } from "next/router";

import { useQuery } from "@apollo/client";
import { GET_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";
import useTranslation from "next-translate/useTranslation";

import AssignmentTab from "./Tab";
import AddAssignment from "./Add";
import ViewAssignment from "./View";
import CreateAssignment from "./Create";
import EditAssignment from "./Edit";
import CopyAssignment from "./Copy";
import Overview from "../Overview/HomeworkCompletion";
import HomeworkOverview from "./HomeworkOverview";
import Button from "../../../../DesignSystem/Button";
import JustOneSecondNotice from "../../../../DesignSystem/JustOneSecondNotice";

export default function Settings({ myclass, user, query }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const { action, assignment } = query;

  const { data, loading, error } = useQuery(GET_CLASS_ASSIGNMENTS, {
    variables: { classId: myclass?.id },
    fetchPolicy: "cache-and-network",
  });
  const assignments = data?.assignments || [];
  const isListQueryPending = loading && !data;

  const listLoadingView = (
    <div
      className="assignments"
      style={{ display: "flex", justifyContent: "center" }}
    >
      <JustOneSecondNotice
        message={{
          h1: t("assignment.loadingListTitle", "Just a moment"),
          p: t(
            "assignment.loadingListBody",
            "Loading assignments linked to this class."
          ),
        }}
      />
    </div>
  );

  if (action === "create") {
    return (
      <div className="assignments">
        <CreateAssignment myclass={myclass} user={user} />
      </div>
    );
  }

  if (action === "copy" && assignment) {
    return (
      <div className="assignments">
        <CopyAssignment
          code={assignment}
          myclass={myclass}
          user={user}
        />
      </div>
    );
  }

  if (action === "add") {
    return (
      <div className="assignments">
        <AddAssignment myclass={myclass} user={user} query={query} />
      </div>
    );
  }

  if (action === "overview") {
    if (isListQueryPending) {
      return listLoadingView;
    }
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

  if (action === "edit" && assignment) {
    return (
      <div className="assignments">
        <EditAssignment
          code={assignment}
          myclass={myclass}
          user={user}
        />
      </div>
    );
  }

  if (action === "homeworkOverview" && assignment) {
    return (
      <div className="assignments">
        <HomeworkOverview
          code={assignment}
          myclass={myclass}
          user={user}
          query={query}
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

  if (isListQueryPending) {
    return listLoadingView;
  }

  if (assignments?.length === 0) {
    return (
      <div className="empty">
        <div>{t("assignment.noAssignments")}</div>
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "assignments",
              action: "add",
            },
          }}
          style={{ textDecoration: 'none' }}
        >
          <Button variant="filled">{t("assignment.linkAssignments", {}, { default: "Add assignments" })}</Button>
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
            style={{ textDecoration: 'none' }}
          >
            <Button variant="filled">{t("assignment.linkAssignments", {}, { default: "Add assignments" })}</Button>
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
            style={{ textDecoration: 'none' }}
          >
            <Button variant="outline">
              {t("assignment.classAssignmentOverview", {}, { default: "Class assignment overview" })}
            </Button>
          </Link>
        </div>
      </div>

      <AssignmentTab
        assignments={assignments}
        myclass={myclass}
        user={user}
      />
    </div>
  );
}
