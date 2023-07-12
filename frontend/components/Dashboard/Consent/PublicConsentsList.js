import { useQuery } from "@apollo/client";
import moment from "moment";
import { GET_PUBLIC_CONSENTS } from "../../Queries/Consent";

import Link from "next/link";

export default function ConsentsList({ query, user }) {
  const { data, error, loading } = useQuery(GET_PUBLIC_CONSENTS, {
    variables: {
      id: user?.id,
    },
  });

  const consents = data?.consents || [];

  return (
    <div className="board">
      {consents?.map((consent, i) => (
        <Link
          key={i}
          href={{
            pathname: `/dashboard/irb/${consent?.code}`,
          }}
        >
          <div className="item">
            <p>{consent?.title}</p>
            <p>{consent?.description}</p>
            <p>{moment(consent?.createdAt).format("MMMM D, YYYY")}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
