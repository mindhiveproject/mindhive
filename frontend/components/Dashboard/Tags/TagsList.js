import { useQuery } from "@apollo/client";
import moment from "moment";
import { GET_TAGS } from "../../Queries/Tag";

import Link from "next/link";

export default function TagsList({ query, user }) {
  const { data, error, loading } = useQuery(GET_TAGS);

  const tags = data?.tags || [];

  return (
    <div className="board">
      {tags?.map((tag, i) => (
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
            <p>{moment(tag?.createdAt).format("MMMM D, YYYY")}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
