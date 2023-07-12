import Link from "next/link";
import AddClass from "./AddClass";
import ClassPage from "./ClassPage/Main";

import ClassesList from "./ClassesList";
import StyledClass from "../../styles/StyledClass";

export default function TeacherClasses({ query, user }) {
  const { selector } = query;

  if (!selector) {
    return (
      <StyledClass>
        <h1>Teacher classes</h1>
        <Link href="/dashboard/myclasses/add">
          <button>Add class</button>
        </Link>
        <ClassesList query={query} user={user} />
      </StyledClass>
    );
  }
  if (selector === "add") {
    return <AddClass user={user} />;
  }

  return (
    <StyledClass>
      <ClassPage code={selector} user={user} query={query} />
    </StyledClass>
  );
}
