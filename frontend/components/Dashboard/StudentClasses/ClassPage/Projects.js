import TeacherClassProjects from "../../TeacherClasses/ClassPage/Projects";

/**
 * Student class projects — same AgGrid UI as the teacher projects tab,
 * but read-only (no template management / create flows).
 */
export default function Projects({ myclass, user, query }) {
  return (
    <TeacherClassProjects
      myclass={myclass}
      user={user}
      query={query}
      readOnly
    />
  );
}
