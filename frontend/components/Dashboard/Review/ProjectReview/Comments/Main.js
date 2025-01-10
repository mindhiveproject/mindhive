import Board from "./Board";

export default function Reviews({ projectId, user, reviews }) {
  const byReviewers = reviews
    .map((review, num) => {
      const permissions = review?.author?.permissions?.map((p) => p?.name);
      const isMentor = permissions.includes("MENTOR");
      const isTeacher = permissions.includes("TEACHER");
      const isScientist = permissions.includes("SCIENTIST");

      let role = "Reviewer";
      if (isScientist) {
        role = "Scientist";
      }
      if (isMentor) {
        role = "Mentor";
      }
      if (isTeacher) {
        role = "Teacher";
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
