import { useQuery } from "@apollo/client";
import moment from "moment";
import { GET_UPDATES } from "../../Queries/Update";

import Link from "next/link";

import DeleteUpdate from "./Delete";

export default function UpdatesList({ query, user }) {
  const { data, error, loading } = useQuery(GET_UPDATES, {
    variables: {
      updateArea: "PLATFORM",
    },
  });

  const updates = data?.updates || [];

  return (
    <div className="board">
      <div className="heading">
        <p>Title</p>
        <p>Link</p>
        <p>User</p>
        <p>Created At</p>
        <p>Updated At</p>
      </div>
      {updates?.map((update, i) => (
        <div className="line">
          <Link
            href={{
              pathname: `/dashboard/updates/edit`,
              query: {
                id: update?.id,
              },
            }}
          >
            <div key={i} className="item">
              <p>{update?.content?.title}</p>
              <p>
                <a href={update?.link} target="_blank">
                  Link
                </a>
              </p>
              <p>{update?.user?.username}</p>
              <p>{moment(update?.createdAt).format("MMMM D, YYYY")}</p>
              <p>
                {update?.updatedAt &&
                  moment(update?.updatedAt).format("MMMM D, YYYY")}
              </p>
            </div>
          </Link>
          <DeleteUpdate id={update?.id} />
        </div>
      ))}
    </div>
  );
}
