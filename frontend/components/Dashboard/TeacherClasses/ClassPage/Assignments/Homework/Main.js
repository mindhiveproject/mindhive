import Link from "next/link";
import moment from "moment";
import ReviewHomework from "./Review";

export default function HomeworkMain({
  code,
  myclass,
  user,
  query,
  homeworks,
}) {
  const { homework } = query;

  if (homework) {
    return (
      <ReviewHomework
        code={code}
        myclass={myclass}
        user={user}
        query={query}
        homeworkCode={homework}
      />
    );
  }

  return (
    <div>
      {homeworks?.map((work) => (
        <Link
          key={work?.id}
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "assignments",
              action: "view",
              assignment: code,
              homework: work?.code,
            },
          }}
        >
          <div className="homeworkTab">
            <div>{work?.title}</div>
            <div>{moment(work?.createdAt).format("MMM D, YYYY")}</div>
            <div>{work?.author?.username}</div>
            <div>{work?.settings?.status}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
