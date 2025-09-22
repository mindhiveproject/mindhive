import { useQuery } from "@apollo/client";
import moment from "moment";

import { GET_PUBLIC_AND_PROJECT_RESOURCES } from "../../Queries/Resource";

import Link from "next/link";
import DeleteResource from "./DeleteResource";

import useTranslation from "next-translate/useTranslation";
export default function ProjectResourcesList({ query, user, projectId }) {
  const { data, error, loading } = useQuery(GET_PUBLIC_AND_PROJECT_RESOURCES, {
    variables: {
      projectId: projectId,
    },
  });

  const resources = data?.resources || [];
  const { t } = useTranslation("classes");
  const publicResources = resources.filter((resource) => resource?.isPublic);
  const projectResources = resources.filter((resource) => resource?.isCustom);

  const resourcesMerged = publicResources.map((publicResource) => {
    if (
      projectResources.filter(
        (projectResource) => projectResource?.parent?.id === publicResource?.id
      ).length > 0
    ) {
      const projectResource = projectResources.filter(
        (projectResource) => projectResource?.parent?.id === publicResource?.id
      )[0];
      return projectResource;
    } else {
      return publicResource;
    }
  });

  // const refetchQueries = [
  //   {
  //     query: GET_PUBLIC_AND_PROJECT_RESOURCES,
  //     variables: { projectId: projectId },
  //   },
  // ];

  if (user.permissions.map((p) => p?.name).includes("STUDENT")) {
    return <></>;
  }

  return (
    <div className="board">
      <div className="headerMy">
        <p>{t("boardManagement.title")}</p>
        <p>{t("boardManagement.created")}</p>
        <p>{t("boardManagement.lastUpdated")}</p>
      </div>
      {resourcesMerged?.map((resource, i) => (
        <div key={i} className="wrapper">
          <Link
            href={{
              pathname: `/dashboard/resources/view`,
              query: {
                id: resource?.id,
              },
            }}
            key={i}
          >
            <div key={i} className="item">
              <p>{resource?.title}</p>
              <p>{moment(resource?.createdAt).format("MMMM D, YYYY")}</p>
              <p>
                {resource?.updatedAt &&
                  moment(resource?.updatedAt).format("MMMM D, YYYY")}
              </p>
            </div>
          </Link>
          {resource?.isCustom ? (
            <Link
              href={{
                pathname: `/dashboard/resources/edit`,
                query: {
                  id: resource?.id,
                },
              }}
              key={i}
            >
              <button>{t("boardManagement.edit")}</button>
            </Link>
          ) : (
            <Link
              href={{
                pathname: `/dashboard/resources/copy`,
                query: {
                  id: resource?.id,
                  project: projectId,
                },
              }}
              key={i}
            >
              <button>{t("boardManagement.customize")}</button>
            </Link>
          )}
          {/* <DeleteResource
            resourceId={resource?.id}
            refetchQueries={refetchQueries}
          >
            <button>Delete</button>
          </DeleteResource> */}
        </div>
      ))}
    </div>
  );
}
