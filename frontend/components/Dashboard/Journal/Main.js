import Link from "next/link";
import AddJournal from "./AddJournal";
import JournalPage from "./JournalPage";
import JournalsList from "./JournalsList";
import StyledJournal from "../../styles/StyledJournal";
import { Icon, PopupContent, Popup } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

export default function JournalMain({ query, user }) {
  const { t } = useTranslation("common");
  const { selector } = query;

  if (!selector) {
    return (
      <StyledJournal>
        <h1>{t("journal.menuTitle")}</h1>
        <div className="header">
          <Link href="/dashboard/journals/add">
            <button>{t("journal.createNewJournal")}</button>
          </Link>
          <Popup trigger={<Icon name="info" size="large" />}>
            <PopupContent>
              <div>
                <p>{t("journal.info.intro")}</p>
                <p>{t("journal.info.ideas")}</p>
                <p>{t("journal.info.read")}</p>
                <p>{t("journal.info.shower")}</p>
                <p>{t("journal.info.class")}</p>
              </div>
            </PopupContent>
          </Popup>
        </div>
        <JournalsList query={query} user={user} />
      </StyledJournal>
    );
  }
  if (selector === "add") {
    return (
      <StyledJournal>
        <AddJournal user={user} />
      </StyledJournal>
    );
  }
  return (
    <StyledJournal>
      <JournalPage code={selector} user={user} query={query} />
    </StyledJournal>
  );
}
