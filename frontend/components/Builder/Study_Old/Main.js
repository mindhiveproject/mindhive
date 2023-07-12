import StudyState from "./StudyState";
import AddStudy from "./AddStudy";

export default function StudyBuilder({ query, user }) {
  const { area, selector } = query;

  if (selector === "add") {
    return <AddStudy query={query} user={user} />;
  }

  // if there is study id (selector)
  // query this study and check whether the user has the right to access it
  // if there is a panel, present this panel
  return <StudyState query={query} user={user} />;
}
