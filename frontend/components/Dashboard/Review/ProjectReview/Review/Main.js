import moment from "moment";
import Question from "./Question";

export default function QuestionsMain({
  review,
  reviewContent,
  stage,
  handleItemChange,
}) {
  return (
    <div className="panelRight">
      <div className="reviewQuestions">
        <h1>
          {stage === "SUBMITTED_AS_PROPOSAL"
            ? "Proposal Feedback"
            : "Study Feedback"}
        </h1>
        <div className="reviewItems">
          {reviewContent?.map((item, i) => (
            <Question
              stage={stage}
              item={item}
              handleItemChange={handleItemChange}
              answer={item?.answer}
            />
          ))}
        </div>
        {review?.createdAt && (
          <em>
            Submitted on{" "}
            {moment(review?.createdAt).format("MMMM D, YYYY, h:mma")}
          </em>
        )}
        {review?.updatedAt && (
          <em>
            Updated on {moment(review?.updatedAt).format("MMMM D, YYYY, h:mma")}
          </em>
        )}
      </div>
    </div>
  );
}
