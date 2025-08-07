import { Icon } from "semantic-ui-react";

import { useQuery, useMutation } from "@apollo/client";
import { EDIT_REVIEW } from "../../../Mutations/Review";
import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";
import { ALL_PUBLIC_TASKS } from "../../../Queries/Task";

import StyledFeedback from "../../../styles/StyledFeedback";
import ManageFavorite from "../../../User/ManageFavorite";
import useTranslation from 'next-translate/useTranslation';



export default function Board({ user, projectId, status, reviews }) {
  const { t } = useTranslation('builder');
  const { data: publicTasksData } = useQuery(ALL_PUBLIC_TASKS);
  const publicTasks = publicTasksData?.tasks || [];

  const questionTitles = {
    SUBMITTED_AS_PROPOSAL: {
      1: {
        title: t('reviewTemplate.proposalReadyQuestion'),
      },
      2: { title: t('reviewTemplate.whatDoesStudyDoWell') },
      3: {
        title: t('reviewTemplate.isQuestionAnswerable'),
      },
      4: {
        title: t('reviewTemplate.isQuestionAnswerable'),
      },
      5: { title: t('reviewTemplate.additionalComments') },
    },
    PEER_REVIEW: {
      1: {
        title: t('reviewTemplate.importanceQuestion'),
      },
      2: {
        title: t('reviewTemplate.hypothesisQuestion'),
      },
      3: {
        title: t('reviewTemplate.designQuestion'),
      },
      4: {
        title: t('reviewTemplate.confoundsQuestion'),
      },
      5: {
        title: t('reviewTemplate.respectQuestion'),
      },
      6: {
        title: t('reviewTemplate.participationQuestion'),
      },
    },
  };

  const [editReview, { data }] = useMutation(EDIT_REVIEW, {});

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
                    <img src="/assets/icons/profile/user.svg" width="30px" />
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
                <div className="reviewer">Anonymous reviewer</div>
              )}

              <div>
                {review.content
                  .filter((card) => card.responseType === "selectOne")
                  .filter((card) => card.answer)
                  .map((card, num) => {
                    const [option] = card?.responseOptions.filter(
                      (option) => option?.value === card?.answer
                    );
                    return (
                      <div key={num} className={`status  ${option?.value}`}>
                        <img src={`/assets/icons/status/${option?.icon}.svg`} />
                        <div>
                          <div className="title">{option?.title}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="voteArea">
                <div
                  onClick={() => voteReview({ id: review?.id, votedBefore })}
                >
                  {votedBefore ? (
                    <Icon name="thumbs up" size="large" />
                  ) : (
                    <img src="/assets/icons/thumbsUp.svg" />
                  )}
                </div>

                <div className="votesCounter">{review?.upvotedBy?.length}</div>
              </div>
            </div>

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
                  <div key={num} className="task">
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

            <div className="cards">
              {review.content
                .filter(
                  (card) =>
                    card.responseType !== "selectOne" &&
                    card.responseType !== "taskSelector"
                )
                .filter((card) => card.answer)
                .map((card, num) => (
                  <div key={num} className="reviewerComment">
                    <div className="questionTitle">
                      {questionTitles[status] &&
                        questionTitles[status][card?.name]?.title}
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
