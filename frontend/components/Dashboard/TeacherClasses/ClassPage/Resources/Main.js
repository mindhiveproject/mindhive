import Link from "next/link";

import { useQuery } from "@apollo/client";
import { GET_CLASS_RESOURCES } from "../../../../Queries/Resource";
import useTranslation from "next-translate/useTranslation";

import ResourceTab from "./Tab";
import AddResource from "./Add";
import ViewResource from "./View";
import EditResource from "./Edit";
import CreateResource from "./Create";
import JustOneSecondNotice from "../../../../DesignSystem/JustOneSecondNotice";
import Button from "../../../../DesignSystem/Button";

export default function ClassResources({ myclass, user, query }) {
  const { t } = useTranslation("classes");
  const { action, resource: resourceId } = query;

  const { data, loading, error } = useQuery(GET_CLASS_RESOURCES, {
    variables: { classId: myclass?.id },
    fetchPolicy: "cache-and-network",
  });
  const resources = data?.resources || [];
  const isListQueryPending = loading && !data;

  if (action === "create") {
    return (
      <div className="resources">
        <CreateResource myclass={myclass} user={user} />
      </div>
    );
  }

  if (action === "add") {
    return (
      <div className="resources">
        <AddResource myclass={myclass} user={user} query={query} />
      </div>
    );
  }
  if (action === "edit" && resourceId) {
    return (
      <div className="resources">
        <EditResource
          resourceId={resourceId}
          myclass={myclass}
          user={user}
        />
      </div>
    );
  }
  if (action === "view" && resourceId) {
    return (
      <div className="resources">
        <ViewResource
          resourceId={resourceId}
          myclass={myclass}
          user={user}
          query={query}
        />
      </div>
    );
  }
  if (isListQueryPending) {
    return (
      <div
        className="resources"
        style={{ display: "flex", justifyContent: "center" }}
      >
        <JustOneSecondNotice
          message={{
            h1: t("resource.loadingListTitle", "Just a moment"),
            p: t(
              "resource.loadingListBody",
              "Loading resources linked to this class."
            ),
          }}
        />
      </div>
    );
  }

  if (resources?.length === 0) {
    return (
      <div className="empty">
        <div>{t("resource.noResources", "No resources linked to this class yet.")}</div>
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "resources",
              action: "add",
            },
          }}
          style={{ textDecoration: "none" }}
        >
          <Button variant="filled">{t("resource.addResources", {}, { default: "Add resources" })}</Button>
        </Link>
      </div>
    );
  }















  
  return (
    <div className="resources">
      <div className="subheader">
        <div>
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "resources",
                action: "add",
              },
            }}
            style={{ textDecoration: "none" }}
          >
            <Button variant="filled">{t("resource.addResources", {}, { default: "Add resources" })}</Button>
          </Link>
        </div>
      </div>

      <ResourceTab
        resources={resources}
        myclass={myclass}
        user={user}
      />
    </div>
  );
}
