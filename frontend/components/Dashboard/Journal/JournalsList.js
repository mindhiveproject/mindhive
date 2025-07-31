import { useQuery } from "@apollo/client";
import moment from "moment";
import { GET_MY_JOURNALS } from "../../Queries/Journal";
import Link from "next/link";
import DeleteJournal from "./DeleteJournal";
import useTranslation from "next-translate/useTranslation";

export default function JournalsList({ query, user }) {
  const { t } = useTranslation("common");
  const { data, error, loading } = useQuery(GET_MY_JOURNALS, {
    variables: {
      id: user?.id,
    },
  });

  const journals = data?.journals || [];

  if (journals?.length === 0) {
    return (
      <>
        <h3>{t("journal.noJournalsYet")}</h3>
        <p>{t("journal.noJournalsYetDesc")}</p>
      </>
    );
  }

  return (
    <div className="journalsList">
      <h3>{t("journal.myJournals")}</h3>
      <div className="row">
        <div className="topHeader">
          <div>{t("journal.journalName")}</div>
          <div>{t("journal.numberOfNotes")}</div>
          <div>{t("journal.dateCreated")}</div>
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
          <DeleteJournal user={user} journal={journal} />
        </div>
      ))}
    </div>
  );
}
