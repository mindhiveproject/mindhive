import moment from "moment";
import Question from "./Question";
import useTranslation from "next-translate/useTranslation";

export default function QuestionsMain({
  projectId,
  review,
  reviewContent,
  status,
  handleItemChange,
}) {
  const { t } = useTranslation("builder");
  return (
    <div className="panelRight">
      <div className="reviewQuestions">
        <h1>
          {status === "SUBMITTED_AS_PROPOSAL" || status === "PEER_REVIEW"
            ? t("reviewDetail.proposalFeedback")
            : t("reviewDetail.studyFeedback")}
        </h1>
        <div className="subtitle">
          {t(
            status === "SUBMITTED_AS_PROPOSAL"
              ? "reviewDetail.helpStudents"
              : "reviewDetail.helpPeers"
          )}
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
            {t("reviewDetail.submittedOn", {
              date: moment(review?.createdAt).format("MMMM D, YYYY, h:mma"),
            })}
          </em>
        )}
        {review?.updatedAt && (
          <em>
            {t("reviewDetail.updatedOn", {
              date: moment(review?.updatedAt).format("MMMM D, YYYY, h:mma"),
            })}
          </em>
        )}
      </div>
    </div>
  );
}
