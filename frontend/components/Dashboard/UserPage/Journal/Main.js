import moment from "moment";
import Link from "next/link";
import JournalPage from "./JournalPage";

export default function Journal({ query, user, profile }) {
  const journals = profile?.journals || [];

  const { journal } = query;

  if (journals.length === 0) {
    return (
      <div className="empty">
        <div>The student hasn’t created any journals yet.</div>
      </div>
    );
  }

  if (journal) {
    return <JournalPage code={journal} user={user} query={query} />;
  }

  return (
    <div>
      <div className="journalWrapperLine">
        <div className="journalListHeader">
          <div>Journal name</div>
          <div>Number of notes</div>
          <div>Date created</div>
        </div>
        <div></div>
      </div>

      {journals.map((journal) => (
        <div className="journalWrapperLine" key={journal?.id}>
          <Link
            href={{
              pathname: `/dashboard/students/${profile?.publicId}`,
              query: {
                page: "journal",
                journal: journal?.code,
              },
            }}
          >
            <div className="journalRow">
              <div>{journal?.title}</div>
              <div>{journal?.posts.length}</div>
              <div>{moment(journal?.createdAt).format("MMMM D, YYYY")}</div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
