import { useQuery, useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { EDIT_REVIEW } from "../../../Mutations/Review";
import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";
import { ALL_PUBLIC_TASKS } from "../../../Queries/Task";

import StyledFeedback from "../../../styles/StyledFeedback";
import ManageFavorite from "../../../User/ManageFavorite";
import { useTemplateQuestions } from "../ProjectReview/Review/Template";

function getQuestionTitle(card, status, templates) {
  if (card?.question) {
    return card.question;
  }

  const templateItem = templates[status]?.find((item) => item.name === card?.name);
  return templateItem?.question || "";
}

export default function Board({
  user,
  projectId,
  status,
  reviews,
  curriculumType,
}) {
  const { t } = useTranslation("builder");
  const templates = useTemplateQuestions(curriculumType);
  const { data: publicTasksData } = useQuery(ALL_PUBLIC_TASKS);
  const publicTasks = publicTasksData?.tasks || [];

  const [editReview] = useMutation(EDIT_REVIEW, {});

  const voteReview = async ({ id, votedBefore }) => {
    await editReview({
      variables: {
        id: id,
        input: {
          upvotedBy: votedBefore
            ? { disconnect: { id: user?.id } }
            : { connect: { id: user?.id } },
        },
      },
      refetchQueries: [
        { query: PROPOSAL_REVIEWS_QUERY, variables: { id: projectId } },
      ],
    });
  };

  return (
    <StyledFeedback id="feedbackArea">
      {reviews.map((review, num) => {
        const votedBefore = review?.upvotedBy
          ?.map((u) => u?.id)
          .includes(user?.id);

        const recommendedTasksArray = review.content
          .filter(
            (card) => card?.responseType === "taskSelector" && card?.answer
          )
          .map((card) => card.answer);
        let recommendedTasks = [];
        if (recommendedTasksArray && recommendedTasksArray.length) {
          recommendedTasks = recommendedTasksArray[0];
        }

        return (
          <div key={num} className="section">
            <div className="topLine">
              {status === "SUBMITTED_AS_PROPOSAL" ? (
                <div className="reviewer">
                  {review?.author?.image?.image?.publicUrlTransformed ? (
                    <img
                      src={review?.author?.image?.image?.publicUrlTransformed}
                      alt={review?.author?.username}
                      width="30px"
                    />
                  ) : (
                    <img
                      src="/assets/icons/profile/user.svg"
                      alt=""
                      width="30px"
                    />
                  )}
                  <div>
                    <a
                      href={`/dashboard/connect/with?id=${review?.author?.publicId}`}
                      target="_blank"
                    >
                      {review?.author?.firstName && review?.author?.lastName
                        ? `${review?.author?.firstName} ${review?.author?.lastName}`
                        : `${review?.author?.username}`}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="reviewer">
                  {t("reviewDetail.anonymousReviewer", {}, {
                    default: "Anonymous reviewer",
                  })}
                </div>
              )}

              <div>
                {review.content
                  .filter((card) => card.responseType === "selectOne")
                  .filter((card) => card.answer)
                  .map((card, cardNum) => {
                    const [option] = card?.responseOptions.filter(
                      (option) => option?.value === card?.answer
                    );
                    return (
                      <div
                        key={cardNum}
                        className={`status  ${option?.value}`}
                      >
                        <img
                          src={`/assets/icons/status/${option?.icon}.svg`}
                          alt=""
                        />
                        <div>
                          <div className="title">{option?.title}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="voteArea">
                <button
                  type="button"
                  className={`voteButton${votedBefore ? " voteButtonActive" : ""}`}
                  onClick={() => voteReview({ id: review?.id, votedBefore })}
                  aria-pressed={votedBefore}
                  aria-label={t("review.upvoteFeedback", {}, {
                    default: "Upvote this feedback",
                  })}
                >
                  <img src="/assets/icons/thumbsUp.svg" alt="" />
                </button>

                <div className="votesCounter">{review?.upvotedBy?.length}</div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              {recommendedTasks.length > 0 && (
                <>
                  <p>{t("review.suggestedTasks")}</p>
                  <div className="tasksArea">
                    {recommendedTasks.map((id) => {
                      const tasksWithId = publicTasks.filter(
                        (task) => task?.id === id
                      );
                      let task = {};
                      if (tasksWithId && tasksWithId.length) {
                        task = tasksWithId[0];
                      }
                      return (
                        <div key={id} className="task">
                          <ManageFavorite user={user} id={id} />
                          <a
                            href={`/dashboard/discover/tasks?name=${task?.slug}`}
                            target="_blank"
                          >
                            <div className="questionAnswer">{task.title}</div>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="cards">
              {review.content
                .filter(
                  (card) =>
                    card.responseType !== "selectOne" &&
                    card.responseType !== "taskSelector"
                )
                .filter((card) => card.answer)
                .map((card, cardNum) => (
                  <div key={cardNum} className="reviewerComment">
                    <div className="questionTitle">
                      {getQuestionTitle(card, status, templates)}
                    </div>
                    <div className="questionAnswer">{card?.answer}</div>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </StyledFeedback>
  );
}
