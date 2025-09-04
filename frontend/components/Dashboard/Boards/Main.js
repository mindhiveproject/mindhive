import StyledBoards from "../../styles/StyledBoards"; // Adjust path to your StyledBoards.js
import TeacherProjects from "./TeacherProjects"; // Adjust path to your TeacherProjects.js component
import Edit from "./Edit";
import ManageClasses from "./ManageClasses";

export default function ProjectsMain({ query, user }) {
  const { selector, id } = query;

  if (selector === "manage") {
    return (
      <StyledBoards>
        <ManageClasses user={user} boardId={id} />
      </StyledBoards>
    );
  }

  if (selector === "edit") {
    return (
      <StyledBoards>
        <Edit user={user} boardId={id} />
      </StyledBoards>
    );
  }
  return (
    <StyledBoards>
      {user.permissions.map((p) => p?.name).includes("TEACHER") ||
      user.permissions.map((p) => p?.name).includes("MENTOR") ||
      user.permissions.map((p) => p?.name).includes("ADMIN") ? (
        <TeacherProjects user={user} query={query} />
      ) : (
        <p>You do not have permission to view this page.</p>
      )}
    </StyledBoards>
  );
}
