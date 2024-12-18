import { Icon } from "semantic-ui-react";
import moment from "moment";

export default function Comment({ number, review }) {
  const permissions = review?.author?.permissions?.map((p) => p?.name);
  const isMentor = permissions?.includes("MENTOR");
  const isTeacher = permissions?.includes("TEACHER");
  const isScientist = permissions?.includes("SCIENTIST");

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

  const reviewProcessed = {
    id: review?.id,
    content: review.content.map((content) => ({
      ...content,
      title: content.question,
    })),
    title: `${role} ${number + 1}`,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    upvotedBy: review?.upvotedBy,
  };

  return (
    <div className="reviewerSection">
      <div className="reviewerTitle">
        <img src="/assets/icons/review/reviewer.svg" />
        <div>{reviewProcessed.title}</div>
        <div>
          <Icon name="thumbs up outline" size="big" />
          <span>{reviewProcessed?.upvotedBy?.length}</span>
        </div>
      </div>

      {/* {reviewProcessed?.createdAt && (
        <em>
          {moment(reviewProcessed?.createdAt).format("MMMM D, YYYY, h:mma")}
        </em>
      )} */}

      <div className="reviewerComments">
        {reviewProcessed.content
          .filter((card) => card?.answer)
          .map((card, num) => (
            <div key={num} className="reviewerComment">
              <div className="question">{card?.title}</div>
              <div className="answer">{card?.answer}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
