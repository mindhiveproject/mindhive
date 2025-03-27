import { Icon } from "semantic-ui-react";

import { useQuery, useMutation } from "@apollo/client";
import { EDIT_REVIEW } from "../../../Mutations/Review";
import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";
import { ALL_PUBLIC_TASKS } from "../../../Queries/Task";

import StyledFeedback from "../../../styles/StyledFeedback";
import ManageFavorite from "../../../User/ManageFavorite";

const questionTitles = {
  SUBMITTED_AS_PROPOSAL: {
    1: {
      title:
        "Is this proposal ready to move forward or do you feel it needs further development or revisions?",
    },
    2: { title: "What does the study do well?" },
    3: {
      title:
        "Is the investigation question answerable using MindHive tools? Do the proposed tasks and surveys align with the investigation question?",
    },
    4: {
      title: "Is the investigation question answerable using MindHive tools?",
    },
    5: { title: "Additional comments or suggestions" },
  },
  PEER_REVIEW: {
    1: {
      title: "How important is the investigation question?",
    },
    2: {
      title: "How well-defined is the hypothesis?",
    },
    3: {
      title:
        "How well does the study design address the investigation question?",
    },
    4: {
      title:
        "How do the researchers address potential confounds and biases in their study design?",
    },
    5: {
      title:
        "How well does the study respect participants’ privacy, health, and effort?",
    },
    6: {
      title: "What was it like to participate in the study?",
    },
  },
};

export default function Board({ user, projectId, status, reviews }) {
  const { data: publicTasksData } = useQuery(ALL_PUBLIC_TASKS);
  const publicTasks = publicTasksData?.tasks || [];

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
    <StyledFeedback>
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
