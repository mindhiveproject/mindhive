import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import moment from "moment";

import { GET_PUBLIC_AND_CLASS_RESOURCES } from "../../Queries/Resource";

import Link from "next/link";
import DeleteResource from "./DeleteResource";

export default function ClassResourcesList({
  query,
  user,
  classId,
  classSlug,
  projectId,
}) {
  const { data, error, loading } = useQuery(GET_PUBLIC_AND_CLASS_RESOURCES, {
    variables: {
      classId: classId,
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

  if (user.permissions.map((p) => p?.name).includes("STUDENT")) {
    return <></>;
  }

  if (!projectId) {
    return (
      <>
        <h3>
          {t("boardManagement.noBoardAssociated")}
        </h3>
        <Link
          href={{
            pathname: `/dashboard/myclasses/${classSlug}`,
            query: {
              page: "board",
            },
          }}
        >
          <button>{t("boardManagement.createProject")}</button>
        </Link>
      </>
    );
  }

  return (
    <div className="board">
      <div className="wrapper">
        <div className="headerMy">
          <p>{t("boardManagement.titleText")}</p>
          <p>{t("boardManagement.created")}</p>
          <p>{t("boardManagement.lastUpdated")}</p>
        </div>
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
                  p: projectId,
                  c: classId,
                },
              }}
              key={i}
            >
              <button>{t("customize")}</button>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
