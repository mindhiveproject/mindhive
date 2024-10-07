import Question from "./Question";

export default function QuestionsMain({
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}
