import { useQuery } from "@apollo/client";
import moment from "moment";
import { GET_PUBLIC_RESOURCES } from "../../Queries/Resource";

import Link from "next/link";

export default function ResourcesList({ query, user }) {
  const { data, error, loading } = useQuery(GET_PUBLIC_RESOURCES, {
    variables: {
      id: user?.id,
    },
  });

  const resources = data?.resources || [];

  const refetchQueries = [
    {
      query: GET_PUBLIC_RESOURCES,
    },
  ];

  return (
    <div className="board">
      <div className="headerPublic">
        <p>Title</p>
        <p>Created</p>
        <p>Last updated</p>
        <p>Author</p>
      </div>
      {resources?.map((resource, i) => (
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
              <p>{resource?.author?.username}</p>
            </div>
          </Link>

          <div className="buttonLinks">
            {/* <Link
              href={{
                pathname: `/dashboard/resources/copy`,
                query: {
                  id: resource?.id,
                },
              }}
              key={i}
            >
              <button>Customize</button>
            </Link> */}

            {user?.permissions?.map((p) => p?.name).includes("ADMIN") && (
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
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
