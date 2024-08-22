import Link from "next/link";
import AddJournal from "./AddJournal";
import JournalPage from "./JournalPage";

import JournalsList from "./JournalsList";

import StyledJournal from "../../styles/StyledJournal";

export default function JournalMain({ query, user }) {
  const { selector } = query;

  if (!selector) {
    return (
      <StyledJournal>
        <h1>My journals</h1>
        <Link href="/dashboard/journals/add">
          <button>Add journal</button>
        </Link>
        <div>
          <p>
            Use the journal to document any MindHive related thoughts or notes,
            including but not limited to:
          </p>
          <ul>
            <li>Follow-up ideas or reflections on MindHive studies</li>
            <li>Something you read that you might want to use later</li>
            <li>A research idea that came to you in the shower</li>
            <li>
              Something that was discussed in class that you don't want to
              forget
            </li>
          </ul>
        </div>
        <JournalsList query={query} user={user} />
      </StyledJournal>
    );
  }
  if (selector === "add") {
    return (
      <StyledJournal>
        <AddJournal user={user} />;
      </StyledJournal>
    );
  }
  return (
    <StyledJournal>
      <JournalPage code={selector} user={user} query={query} />
    </StyledJournal>
  );
}
