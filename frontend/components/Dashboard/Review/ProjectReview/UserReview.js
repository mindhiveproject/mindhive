import { useQuery } from "@apollo/client";
import Link from "next/link";

import { GET_REVIEW } from "../../../Queries/Review";

import Navigation from "./Navigation";
import StudyDetails from "./StudyDetails/Main";
import Comments from "./Comments/Main";
import Questions from "./Review/Main";

import useForm from "../../../../lib/useForm";

import { TemplateQuestions } from "./Review/Template";
import { useEffect } from "react";

// getting the state of the user review
export default function UserReview({ query, user, tab, project, canReview }) {
  // try to get the user review
  const { data, loading, error } = useQuery(GET_REVIEW, {
    variables: {
      projectId: project?.id,
      authorId: user?.id,
      stage: project?.status,
    },
    fetchPolicy: "network-only",
  });

  const reviews = data?.reviews || [];
  const review = reviews.length ? reviews[0] : {};

  // TODO make it dynamic later
  const defaultContent = TemplateQuestions["SUBMITTED_AS_PROPOSAL"];

  const { inputs, handleChange, resetForm, handleMultipleUpdate } = useForm({
    id: review?.id,
    content: defaultContent,
    authorId: user?.id,
    projectId: project?.id,
    stage: "SUBMITTED_AS_PROPOSAL",
  });

  useEffect(() => {
    async function updateContent() {
      handleMultipleUpdate({
        id: review?.id,
        content: review?.content,
      });
    }
    if (review?.content) {
      updateContent();
    }
  }, [review?.content]);

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
        project={project}
        inputs={inputs}
        canReview={canReview}
        handleChange={handleChange}
        resetForm={resetForm}
      />

      <div className={canReview ? `double` : `single`}>
        <div className="panelLeft">
          <div className="headerMenu">
            <Link
              href={{
                pathname: `/dashboard/review/project`,
                query: {
                  id: project?.id,
                  tab: "proposal",
                },
              }}
              className={
                tab === "proposal"
                  ? "headerMenuTitle selectedMenuTitle"
                  : "headerMenuTitle"
              }
            >
              <p>Proposal</p>
            </Link>

            <Link
              href={{
                pathname: `/dashboard/review/project`,
                query: {
                  id: project?.id,
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
                  project?.reviews?.filter(
                    (r) => r?.stage === "SUBMITTED_AS_PROPOSAL"
                  ).length
                }
                )
              </p>
            </Link>
          </div>

          {tab === "proposal" && <StudyDetails project={project} />}
          {tab === "reviews" && (
            <Comments
              projectId={project?.id}
              user={user}
              reviews={
                project?.reviews?.filter(
                  (review) => review.stage === "SUBMITTED_AS_PROPOSAL"
                ) || []
              }
            />
          )}
        </div>

        {canReview && (
          <Questions
            review={review}
            reviewContent={inputs?.content || []}
            stage={"SUBMITTED_AS_PROPOSAL"}
            handleItemChange={handleItemChange}
          />
        )}
      </div>
    </div>
  );
}
