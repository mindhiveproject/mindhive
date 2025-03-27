import moment from "moment";
import Question from "./Question";

export default function QuestionsMain({
  projectId,
  review,
  reviewContent,
  status,
  handleItemChange,
}) {
  return (
    <div className="panelRight">
      <div className="reviewQuestions">
        <h1>
          {status === "SUBMITTED_AS_PROPOSAL" || status === "PEER_REVIEW"
            ? "Proposal Feedback"
            : "Study Feedback"}
        </h1>
        <div className="subtitle">
          Help {status === "SUBMITTED_AS_PROPOSAL" ? "students" : "your peers"}{" "}
          create studies by offering feedback and suggestions.
        </div>
        <div className="reviewItems">
          {reviewContent?.map((item, i) => (
            <Question
              key={`${projectId}-${i}`}
              stage={status}
              item={item}
              handleItemChange={handleItemChange}
              answer={item?.answer || ""}
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
