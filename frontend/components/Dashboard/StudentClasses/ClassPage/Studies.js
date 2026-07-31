import TeacherClassStudies from "../../TeacherClasses/ClassPage/Studies";

/**
 * Student class studies — same AgGrid UI as the teacher studies tab,
 * but read-only (no Study Builder column). Owned studies are featured above the grid.
 */
export default function Studies({ myclass, user }) {
  return <TeacherClassStudies myclass={myclass} user={user} readOnly />;
}
