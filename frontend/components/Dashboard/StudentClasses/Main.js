import Link from "next/link";
import ClassPage from "./ClassPage/Main";

import ClassesList from "./ClassesList";
import StyledClass from "../../styles/StyledClass";

export default function StudentClasses({ query, user }) {
  const { selector } = query;

  if (!selector) {
    return (
      <StyledClass>
        <h1>My classes</h1>
        <Link href="/signup/student">
          <button>Join class</button>
        </Link>
        <ClassesList query={query} user={user} />
      </StyledClass>
    );
  }

  return (
    <StyledClass>
      <ClassPage code={selector} user={user} query={query} />
    </StyledClass>
  );
}
