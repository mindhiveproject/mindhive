import { useQuery } from "@apollo/client";
import moment from "moment";
import { GET_MY_LESSONS } from "../../Queries/Lesson";

import Link from "next/link";

export default function LessonsList({ query, user }) {
  const { data, error, loading } = useQuery(GET_MY_LESSONS, {
    variables: {
      id: user?.id,
    },
  });

  const lessons = data?.lessons || [];

  console.log(lessons);

  return (
    <div className="board">
      {lessons?.map((lesson, i) => (
        <Link
          href={{
            pathname: `/dashboard/lessons/edit`,
            query: {
              id: lesson?.id,
            },
          }}
        >
          <div key={i} className="item">
            <p>{lesson?.title}</p>
            <p>{moment(lesson?.createdAt).format("MMMM D, YYYY")}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
