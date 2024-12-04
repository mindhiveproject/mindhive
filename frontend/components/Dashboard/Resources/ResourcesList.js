import { useQuery } from "@apollo/client";
import moment from "moment";
import { GET_MY_RESOURCES } from "../../Queries/Resource";

import Link from "next/link";
import DeleteResource from "./DeleteResource";

export default function ResourcesList({ query, user }) {
  const { data, error, loading } = useQuery(GET_MY_RESOURCES, {
    variables: {
      id: user?.id,
    },
  });

  const resources = data?.resources || [];

  const refetchQueries = [
    {
      query: GET_MY_RESOURCES,
      variables: { id: user?.id },
    },
  ];

  return (
    <div className="board">
      {resources?.map((resource, i) => (
        <div key={i} className="wrapper">
          <Link
            href={{
              pathname: `/dashboard/resources/edit`,
              query: {
                id: resource?.id,
              },
            }}
            key={i}
          >
            <div key={i} className="item">
              <p>{resource?.title}</p>
              <p>{moment(resource?.createdAt).format("MMMM D, YYYY")}</p>
            </div>
          </Link>
          <DeleteResource
            resourceId={resource?.id}
            refetchQueries={refetchQueries}
          >
            <button>Delete</button>
          </DeleteResource>
        </div>
      ))}
    </div>
  );
}
