import Board from "./Board";
import useTranslation from "next-translate/useTranslation";

export default function Reviews({ projectId, user, reviews }) {
  const { t } = useTranslation("builder");
  const byReviewers = reviews
    .map((review, num) => {
      const permissions = review?.author?.permissions?.map((p) => p?.name);
      const isMentor = permissions.includes("MENTOR");
      const isTeacher = permissions.includes("TEACHER");
      const isScientist = permissions.includes("SCIENTIST");

      let role = t("reviewDetail.reviewer");
      if (isScientist) {
        role = t("reviewDetail.scientist");
      }
      if (isMentor) {
        role = t("reviewDetail.mentor");
      }
      if (isTeacher) {
        role = t("reviewDetail.teacher");
      }

      return {
        id: review?.id,
        content: review.content.map((content) => ({
          ...content,
          title: content.question,
        })),
        title: `${role} ${num + 1}`,
        hiddenTitle: review?.author?.username,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        upvotedBy: review?.upvotedBy,
      };
    })
    .sort((a, b) => {
      return b?.upvotedBy?.length - a?.upvotedBy?.length;
    });

  return <Board projectId={projectId} sections={byReviewers} user={user} />;
}
