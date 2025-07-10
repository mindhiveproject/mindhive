import moment from "moment";
import Link from "next/link";
import HomeworkPage from "./HomeworkPage";
import useTranslation from "next-translate/useTranslation";

export default function Homework({ query, user, profile }) {
  const { t } = useTranslation("classes");
  const homeworks = profile?.authorOfHomework || [];

  const { homework } = query;

  if (homeworks.length === 0) {
    return (
      <div className="empty">
        <div>{t("homework.noHomeworkYet")}</div>
      </div>
    );
  }

  if (homework) {
    return (
      <HomeworkPage
        code={homework}
        user={user}
        query={query}
        profile={profile}
      />
    );
  }

  return (
    <div>
      <div className="journalWrapperLine">
        <div className="journalListHeader">
          <div>{t("homework.homeworkTitle")}</div>
          <div>{t("homework.assignmentTitle")}</div>
          <div>{t("homework.dateCreated")}</div>
          <div>{t("homework.dateUpdated")}</div>
        </div>
        <div></div>
      </div>

      {homeworks.map((homework) => (
        <div className="journalWrapperLine" key={homework?.id}>
          <Link
            href={{
              pathname: `/dashboard/students/${profile?.publicId}`,
              query: {
                page: "homework",
                homework: homework?.code,
              },
            }}
          >
            <div className="journalRow">
              <div>{homework?.title}</div>
              <div>{homework?.assignment?.title}</div>
              <div>{moment(homework?.createdAt).format("MMMM D, YYYY")}</div>
              <div>{moment(homework?.updatedAt).format("MMMM D, YYYY")}</div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
