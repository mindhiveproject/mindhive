import Router from "./Router";
// import AddStudy from "./AddStudy";
import { StyledBuilderArea } from "../../styles/StyledBuilder";

export default function StudyBuilder({ query, user }) {
  const { area, selector } = query;
  const tab = query?.tab || "page";

  // if (selector === "add") {
  //   return <AddStudy query={query} user={user} />;
  // }

  // if there is study id (selector)
  // query this study and check whether the user has the right to access it
  // if there is a panel, present this panel
  return (
    <StyledBuilderArea>
      <Router query={query} user={user} tab={tab} />
    </StyledBuilderArea>
  );
}
