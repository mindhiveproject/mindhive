import Link from "next/link";
import AddLesson from "./AddLesson";
import EditLesson from "./EditLesson";

import LessonsList from "./LessonsList";

export default function LessonsMain({ query, user }) {
  const { selector } = query;

  if (!selector) {
    return (
      <>
        <h1>My lessons</h1>
        <Link href="/dashboard/lessons/add">
          <button>Add lesson</button>
        </Link>
        <LessonsList query={query} user={user} />
      </>
    );
  }
  if (selector === "add") {
    return <AddLesson user={user} />;
  }
  return <EditLesson selector={selector} user={user} query={query} />;
}
