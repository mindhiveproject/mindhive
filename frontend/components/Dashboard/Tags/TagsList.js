import { useQuery } from "@apollo/client";
import moment from "moment";
import { GET_TAGS } from "../../Queries/Tag";

import Link from "next/link";

import DeleteTag from "./Delete";

export default function TagsList({ query, user }) {
  const { data, error, loading } = useQuery(GET_TAGS);

  const tags = data?.tags || [];

  return (
    <div className="board">
      <div className="heading">
        <p>Title</p>
        <p>Level</p>
        <p>Created At</p>
        <p>Updated At</p>
      </div>
      {tags?.map((tag, i) => (
        <div className="line">
          <Link
            href={{
              pathname: `/dashboard/tags/edit`,
              query: {
                id: tag?.id,
              },
            }}
          >
            <div key={i} className="item">
              <p>{tag?.title}</p>
              <p>{tag?.level}</p>
              <p>{moment(tag?.createdAt).format("MMMM D, YYYY")}</p>
              <p>{moment(tag?.updatedAt).format("MMMM D, YYYY")}</p>
            </div>
          </Link>
          <DeleteTag id={tag?.id} />
        </div>
      ))}
    </div>
  );
}
