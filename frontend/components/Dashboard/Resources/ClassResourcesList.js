import { useQuery } from "@apollo/client";
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
          You don't have a project board associated with this class. Please
          first create the project board.
        </h3>
        <Link
          href={{
            pathname: `/dashboard/myclasses/${classSlug}`,
            query: {
              page: "board",
            },
          }}
        >
          <button>Create a project board</button>
        </Link>
      </>
    );
  }

  return (
    <div className="board">
      <div className="wrapper">
        <div className="headerMy">
          <p>Title</p>
          <p>Created</p>
          <p>Last updated</p>
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
              <button>Edit</button>
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
              <button>Customize</button>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
