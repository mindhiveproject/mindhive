import { useQuery } from "@apollo/client";
import Link from "next/link";

import { GET_REVIEW } from "../../../Queries/Review";

import Navigation from "./Navigation";
import StudyOverview from "./StudyOverview/Main";
import StudyDetails from "./StudyDetails/Main";
import Comments from "./Comments/Main";
import Questions from "./Review/Main";

import useForm from "../../../../lib/useForm";

import {
  proposalStageQuestions,
  inReviewStageQuestions,
} from "./Review/Template";

// getting the state of the user review
export default function UserReview({ query, user, tab, study, canReview }) {
  // try to get the user review
  const { data, loading, error } = useQuery(GET_REVIEW, {
    variables: {
      studyId: study?.id,
      authorId: user?.id,
      stage: study?.status,
    },
    fetchPolicy: "network-only",
  });

  const reviews = data?.reviews || [];
  const review = reviews.length ? reviews[0] : {};

  const defaultContent =
    study?.status === "SUBMITTED_AS_PROPOSAL"
      ? proposalStageQuestions
      : inReviewStageQuestions;

  const { inputs, handleChange } = useForm({
    id: review?.id,
    content: review?.content || defaultContent,
    authorId: user?.id,
    studyId: study?.id,
    proposalId: study?.proposalMain?.id,
    stage: study?.status,
  });

  const handleItemChange = ({ className, name, value }) => {
    const updatedContent = [...inputs?.content];
    const content = updatedContent.map((item) => {
      if (item.name === name) {
        const updatedItem = { ...item };
        updatedItem[className] = value;
        return updatedItem;
      }
      return item;
    });
    handleChange({
      target: {
        name: "content",
        value: content,
      },
    });
  };

  return (
    <div className="reviewContainer">
      <Navigation
        study={study}
        inputs={inputs}
        canReview={canReview}
        handleChange={handleChange}
      />

      <div className={canReview ? `double` : `single`}>
        <div className="panelLeft">
          <div className="headerMenu">
            <Link
              href={{
                pathname: `/dashboard/review/comment`,
                query: {
                  id: study?.id,
                  tab: "study",
                },
              }}
              className={
                tab === "study"
                  ? "headerMenuTitle selectedMenuTitle"
                  : "headerMenuTitle"
              }
            >
              <p>Study Overview</p>
            </Link>

            <Link
              href={{
                pathname: `/dashboard/review/comment`,
                query: {
                  id: study?.id,
                  tab: "proposal",
                },
              }}
              className={
                tab === "proposal"
                  ? "headerMenuTitle selectedMenuTitle"
                  : "headerMenuTitle"
              }
            >
              <p>Study Details</p>
            </Link>

            <Link
              href={{
                pathname: `/dashboard/review/comment`,
                query: {
                  id: study?.id,
                  tab: "reviews",
                },
              }}
              className={
                tab === "reviews"
                  ? "headerMenuTitle selectedMenuTitle"
                  : "headerMenuTitle"
              }
            >
              <p>
                Comments (
                {
                  study?.reviews?.filter((r) => r?.stage === study?.status)
                    .length
                }
                )
              </p>
            </Link>
          </div>

          {tab === "study" && <StudyOverview study={study} user={user} />}
          {tab === "proposal" && <StudyDetails study={study} />}
          {tab === "reviews" && (
            <Comments
              studyId={study?.id}
              user={user}
              reviews={
                study?.reviews?.filter(
                  (review) => review.stage === study?.status
                ) || []
              }
            />
          )}
        </div>

        {canReview && (
          <Questions
            review={review}
            reviewContent={inputs?.content}
            stage={study?.status}
            handleItemChange={handleItemChange}
          />
        )}
      </div>
    </div>
  );
}
