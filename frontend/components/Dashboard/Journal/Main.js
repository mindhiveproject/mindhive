import Link from "next/link";
import AddJournal from "./AddJournal";
import JournalPage from "./JournalPage";

import JournalsList from "./JournalsList";

import StyledJournal from "../../styles/StyledJournal";

import { Icon, PopupContent, Popup } from "semantic-ui-react";

export default function JournalMain({ query, user }) {
  const { selector } = query;

  if (!selector) {
    return (
      <StyledJournal>
        <h1>Journal</h1>

        <div className="header">
          <Link href="/dashboard/journals/add">
            <button>Create a new Journal</button>
          </Link>

          <Popup trigger={<Icon name="info" size="large" />}>
            <PopupContent>
              <div>
                <p>
                  Use the journal to document any MindHive related thoughts or
                  notes, including but not limited to:
                </p>

                <p>Follow-up ideas or reflections on MindHive studies</p>
                <p>Something you read that you might want to use later</p>
                <p>A research idea that came to you in the shower</p>
                <p>
                  Something that was discussed in class that you don't want to
                  forget
                </p>
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
