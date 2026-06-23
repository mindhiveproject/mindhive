import { useQuery } from "@apollo/client";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import { useEffect } from "react";

import { GET_REVIEW } from "../../../Queries/Review";

import Navigation from "./Navigation";
import StudyDetails from "./StudyDetails/Main";
import Questions from "./Review/Main";

import useForm from "../../../../lib/useForm";

import { useTemplateQuestions } from "./Review/Template";
import Feedback from "../Feedback/Main";
import {
  getCurriculumType,
  mergeReviewContentWithTemplate,
} from "../../../../lib/curriculumTypes";

export default function UserReview({
  query,
  user,
  tab,
  project,
  status,
  actionCardType,
  canReview,
}) {
  const { t } = useTranslation("builder");
  const curriculumType = getCurriculumType(project);

  const { data } = useQuery(GET_REVIEW, {
    variables: {
      projectId: project?.id,
      authorId: user?.id,
      stage: status,
    },
    fetchPolicy: "network-only",
  });

  const reviews = data?.reviews || [];
  const review = reviews.length ? reviews[0] : {};

  const templates = useTemplateQuestions(curriculumType);
  const defaultContent = templates[status] || [];

  const { inputs, handleChange, resetForm, handleMultipleUpdate } = useForm(
    {
      id: review?.id,
      content: defaultContent,
      authorId: user?.id,
      projectId: project?.id,
      stage: status,
    },
    { freezeInitialSync: true }
  );

  useEffect(() => {
    if (!defaultContent?.length) {
      return;
    }
    const merged = mergeReviewContentWithTemplate(
      review?.content,
      defaultContent
    );
    handleMultipleUpdate({
      id: review?.id,
      content: merged,
    });
  }, [review?.id, review?.content, curriculumType, status]);

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
        status={status}
      />

      <div className={canReview ? `double` : `single`}>
        <div className="panelLeft">
          <div className="headerMenu">
            <Link
              href={{
                pathname: `/dashboard/review/project`,
                query: {
                  id: project?.id,
                  stage: query?.stage,
                  tab: "proposal",
                },
              }}
              className={
                tab === "proposal"
                  ? "headerMenuTitle selectedMenuTitle"
                  : "headerMenuTitle"
              }
            >
              <p>{t("reviewDetail.proposalTab")}</p>
            </Link>

            <Link
              href={{
                pathname: `/dashboard/review/project`,
                query: {
                  id: project?.id,
                  stage: query?.stage,
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
                {t("reviewDetail.commentsTab")} (
                {project?.reviews?.filter((r) => r?.stage === status).length})
              </p>
            </Link>
          </div>

          {tab === "proposal" && (
            <StudyDetails
              project={project}
              status={status}
              actionCardType={actionCardType}
            />
          )}
          {tab === "reviews" && (
            <Feedback
              user={user}
              projectId={project?.id}
              status={status}
              curriculumType={curriculumType}
              reviews={
                project?.reviews?.filter((review) => review.stage === status) ||
                []
              }
            />
          )}
        </div>

        {canReview && (
          <Questions
            projectId={project?.id}
            user={user}
            review={review}
            reviewContent={inputs?.content || []}
            status={status}
            handleItemChange={handleItemChange}
          />
        )}
      </div>
    </div>
  );
}
