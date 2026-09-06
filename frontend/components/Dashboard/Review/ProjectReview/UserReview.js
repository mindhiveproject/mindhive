import { useQuery } from "@apollo/client";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import clsx from "clsx";

import { GET_REVIEW } from "../../../Queries/Review";

import Navigation from "./Navigation";
import StudyDetails from "./StudyDetails/Main";
import Questions from "./Review/Main";

import useForm from "../../../../lib/useForm";

import { useTemplateQuestions } from "./Review/Template";
import {
  useReviewFormDefinition,
  reviewContentFromFormDefinition,
} from "./Review/MilestoneReviewForm";
import Feedback from "../Feedback/Main";
import {
  getCurriculumType,
  mergeReviewContentWithTemplate,
} from "../../../../lib/curriculumTypes";
import Navbar, { NavbarItem } from "../../../DesignSystem/Navbar";

export default function UserReview({
  query,
  user,
  tab,
  project,
  status,
  actionCardType,
  canReview,
  milestone,
}) {
  const { t } = useTranslation("builder");
  const router = useRouter();
  const locale = router.locale || "en-us";
  const curriculumType = getCurriculumType(project);

  const scopeContext = useMemo(
    () => ({
      organizationId: project?.usedInClass?.creator?.organization?.id || null,
      classNetworkId: project?.usedInClass?.networks?.[0]?.id || null,
    }),
    [project]
  );

  const { definition, loading: definitionLoading } = useReviewFormDefinition(
    status,
    curriculumType,
    scopeContext,
    { milestone }
  );

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
  const templateFallback = templates[status] || [];
  const defaultContent = useMemo(() => {
    if (definition) {
      return reviewContentFromFormDefinition(
        review?.content,
        definition,
        locale
      );
    }
    return templateFallback;
  }, [definition, review?.content, locale, templateFallback]);

  const { inputs, handleChange, handleMultipleUpdate } = useForm(
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
    if (!defaultContent?.length || definitionLoading) {
      return;
    }
    const merged = definition
      ? defaultContent
      : mergeReviewContentWithTemplate(review?.content, defaultContent);
    handleMultipleUpdate({
      id: review?.id,
      content: merged,
    });
  }, [
    review?.id,
    review?.content,
    curriculumType,
    status,
    definition,
    definitionLoading,
    defaultContent,
  ]);

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

  const commentsCount =
    project?.reviews?.filter((r) => r?.stage === status).length || 0;

  const tabHref = (nextTab) => ({
    pathname: "/dashboard/review/project",
    query: {
      id: project?.id,
      stage: query?.stage,
      tab: nextTab,
      ...(query?.from ? { from: query.from } : {}),
    },
  });

  return (
    <div className="reviewContainer">
      <Navigation
        project={project}
        inputs={inputs}
        canReview={canReview}
        handleChange={handleChange}
        status={status}
        milestone={milestone}
      />

      <div className="reviewBody">
        <div
          className={clsx(
            "reviewLayout",
            canReview
              ? "reviewLayout--withForm"
              : "reviewLayout--contentOnly"
          )}
        >
          <div className="reviewMainColumn">
            <div className="reviewTabBar">
              <Navbar
                variant="underline"
                showRule
                gapless
                aria-label={t(
                  "reviewDetail.reviewNavLabel",
                  {},
                  { default: "Review sections" }
                )}
              >
                <NavbarItem
                  as={Link}
                  href={tabHref("proposal")}
                  selected={tab === "proposal"}
                >
                  {t("reviewDetail.proposalTab")}
                </NavbarItem>
                <NavbarItem
                  as={Link}
                  href={tabHref("reviews")}
                  selected={tab === "reviews"}
                  trailingContent={
                    commentsCount > 0 ? commentsCount : undefined
                  }
                >
                  {t("reviewDetail.commentsTab")}
                </NavbarItem>
              </Navbar>
            </div>

            <div className="reviewContentColumn">
              {tab === "proposal" ? (
                <StudyDetails
                  project={project}
                  status={status}
                  actionCardType={actionCardType}
                />
              ) : null}
              {tab === "reviews" ? (
                <Feedback
                  user={user}
                  projectId={project?.id}
                  status={status}
                  curriculumType={curriculumType}
                  reviews={
                    project?.reviews?.filter(
                      (item) => item.stage === status
                    ) || []
                  }
                />
              ) : null}
            </div>
          </div>

          {canReview ? (
            <Questions
              projectId={project?.id}
              review={review}
              reviewContent={inputs?.content || []}
              status={status}
              handleItemChange={handleItemChange}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
