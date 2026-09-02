import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_REVIEW } from "../../../Queries/Review";
import { CREATE_REVIEW, UPDATE_REVIEW } from "../../../Mutations/Review";
import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";
import { getTabByMilestoneKey } from "../../../../lib/feedbackCenterTabs";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import IconButton from "../../../DesignSystem/IconButton";

function getProfileDisplayName(profile) {
  const username = profile?.username?.trim();
  if (username) return username;

  const firstName = profile?.firstName?.trim();
  const lastName = profile?.lastName?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  if (fullName) return fullName;

  return null;
}

function getProfileChipKey(profile, fallbackIndex) {
  return profile?.id || profile?.publicReadableId || `collaborator-${fallbackIndex}`;
}

export default function Navigation({
  project,
  study,
  inputs,
  canReview,
  handleChange,
  status,
  milestone,
}) {
  const { t } = useTranslation("builder");
  const [returnUrl, setReturnUrl] = useState("/projects");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("from");
    if (fromUrl) {
      setReturnUrl(decodeURIComponent(fromUrl));
    }
  }, []);

  const goBackToFeedbackCenter = () => {
    window.location.href = returnUrl;
  };

  const stageTab = getTabByMilestoneKey(status);
  const milestoneLabel =
    milestone?.title ||
    (stageTab?.labelKey
      ? t(stageTab.labelKey, {}, { default: status })
      : status);

  const displayTitle = project?.title || study?.title;
  const collaboratorProfiles =
    project?.collaborators?.length > 0
      ? project.collaborators
      : study?.collaborators || [];
  const collaboratorChips = collaboratorProfiles
    .map((profile, index) => ({
      key: getProfileChipKey(profile, index),
      label: getProfileDisplayName(profile),
    }))
    .filter((entry) => Boolean(entry.label));

  const [
    createReview,
    { loading: createLoading },
  ] = useMutation(CREATE_REVIEW, {
    variables: {
      input: {
        author: { connect: { id: inputs?.authorId } },
        proposal: project?.id ? { connect: { id: project?.id } } : null,
        study: study?.id ? { connect: { id: study?.id } } : null,
        stage: inputs?.stage,
        settings: inputs?.settings,
        content: inputs?.content,
      },
    },
    refetchQueries: [
      {
        query: GET_REVIEW,
        variables: {
          projectId: project?.id,
          authorId: inputs?.authorId,
          stage: inputs?.stage,
        },
      },
      { query: PROPOSAL_REVIEWS_QUERY, variables: { id: project?.id } },
    ],
  });

  const [
    updateReview,
    { loading: updateLoading },
  ] = useMutation(UPDATE_REVIEW, {
    variables: {
      id: inputs?.id,
      settings: inputs?.settings,
      content: inputs?.content,
      updatedAt: new Date(),
    },
    refetchQueries: [
      {
        query: GET_REVIEW,
        variables: {
          projectId: project?.id,
          authorId: inputs?.authorId,
          stage: inputs?.stage,
        },
      },
      { query: PROPOSAL_REVIEWS_QUERY, variables: { id: project?.id } },
    ],
  });

  return (
    <header className="reviewPageHeader">
      <div className="reviewPageHeaderMain">
        <IconButton
          type="button"
          variant="subtle"
          elevated={false}
          ariaLabel={t("reviewDetail.backToFeedbackCenter")}
          title={t("reviewDetail.backToFeedbackCenter")}
          onClick={goBackToFeedbackCenter}
          icon={
            <img src="/assets/icons/review/expand_left.svg" alt="" />
          }
        />

        <div className="reviewPageHeaderActions">
          {status === "PEER_REVIEW" && project?.study ? (
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`/studies/${project.study.slug}`}
            >
              <Button variant="outline">
                {t(
                  "reviewDetail.participateInStudy",
                  {},
                  { default: "Participate in the study" }
                )}
              </Button>
            </a>
          ) : null}

          {canReview ? (
            inputs?.id ? (
              <Button
                variant="filled"
                type="button"
                disabled={updateLoading}
                onClick={async () => {
                  if (
                    confirm(
                      t(
                        "reviewDetail.resubmitConfirm",
                        {},
                        {
                          default:
                            "Are you sure you want to resubmit? Your feedback will be updated.",
                        }
                      )
                    )
                  ) {
                    updateReview();
                    alert(
                      t(
                        "reviewDetail.updated",
                        {},
                        { default: "The review has been updated" }
                      )
                    );
                  }
                }}
              >
                {t(
                  "reviewDetail.resubmitFeedback",
                  {},
                  { default: "Resubmit Feedback" }
                )}
              </Button>
            ) : (
              <Button
                variant="filled"
                type="button"
                disabled={createLoading}
                onClick={async () => {
                  if (
                    confirm(
                      t(
                        "reviewDetail.submitConfirm",
                        {},
                        {
                          default:
                            "Are you sure you want to submit? Your feedback will be visible for others. You can edit your feedback after submission.",
                        }
                      )
                    )
                  ) {
                    const res = await createReview();
                    const id = res?.data?.createReview?.id || null;
                    handleChange({
                      target: {
                        name: "id",
                        value: id,
                      },
                    });
                    alert(
                      t(
                        "reviewDetail.submitted",
                        {},
                        { default: "The review has been submitted" }
                      )
                    );
                  }
                }}
              >
                {t(
                  "reviewDetail.submitFeedback",
                  {},
                  { default: "Submit Feedback" }
                )}
              </Button>
            )
          ) : null}
        </div>
      </div>

      {displayTitle || milestoneLabel || collaboratorChips.length > 0 ? (
        <div className="reviewPageHeaderMeta">
          {displayTitle || milestoneLabel ? (
            <div className="reviewPageHeaderTitles">
              {displayTitle ? (
                <h1 className="reviewPageTitle">{displayTitle}</h1>
              ) : null}
              {milestoneLabel ? (
                <p className="reviewPageMilestone">
                  {t(
                    "reviewDetail.milestoneContext",
                    { milestone: milestoneLabel },
                    { default: "{{milestone}}" }
                  )}
                </p>
              ) : null}
            </div>
          ) : null}

          {collaboratorChips.length > 0 ? (
            <div
              className="reviewPageCollaborators"
              aria-label={t("reviewDetail.collaborators")}
            >
              {collaboratorChips.map(({ key, label }) => (
                <Chip
                  key={key}
                  variant="static"
                  tone="neutral"
                  label={label}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
