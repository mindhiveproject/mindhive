import { useQuery } from "@apollo/client";
import moment from "moment";
import { GET_MY_JOURNALS } from "../../Queries/Journal";

import Link from "next/link";

export default function JournalsList({ query, user }) {
  const { data, error, loading } = useQuery(GET_MY_JOURNALS, {
    variables: {
      id: user?.id,
    },
  });

  const journals = data?.journals || [];

  if (journals?.length === 0) {
    return (
      <>
        <h3>You haven’t created any journals yet.</h3>
        <p>Once you create a journal, it will appear here.</p>
      </>
    );
  }

  return (
    <div className="journalsList">
      <div className="row">
        <div className="topHeader">
          <div>Journal name</div>
          <div>Number of notes</div>
          <div>Date created</div>
        </div>
        <div></div>
      </div>
      {journals?.map((journal, i) => (
        <div key={i} className="row">
          <Link
            href={{
              pathname: `/dashboard/journals/${journal?.code}`,
            }}
          >
            <div key={i} className="line">
              <div>{journal?.title}</div>
              <div>{journal?.posts?.length}</div>
              <div>{moment(journal?.createdAt).format("MMMM D, YYYY")}</div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
