import Link from "next/link";
import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_REVIEW } from "../../../Queries/Review";
import { CREATE_REVIEW, UPDATE_REVIEW } from "../../../Mutations/Review";
import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";
import Button from "../../../DesignSystem/Button";

export default function Navigation({
  project,
  study,
  inputs,
  canReview,
  handleChange,
  resetForm,
  status,
}) {
  const { t } = useTranslation("builder");
  const [returnUrl, setReturnUrl] = useState("/projects");
  // Extract project ID and return URL from the current URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("from");
    if (fromUrl) {
      setReturnUrl(decodeURIComponent(fromUrl));
    }
  }, []);

  // Navigate back to Feedback Center
  const goBackToFeedbackCenter = () => {
    window.location.href = returnUrl; // Navigate to the preserved Feedback Center URL
  };

  const [
    createReview,
    { data: createData, loading: createLoading, error: createError },
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
    { data: updateData, loading: updateLoading, error: updateError },
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
    <div className="header">
      <div className="backBtn" onClick={goBackToFeedbackCenter}>
        <img src="/assets/icons/review/expand_left.svg" />

        <div className="text">{t("reviewDetail.backToFeedbackCenter")}</div>
      </div>

      <div className="title">{project?.title}</div>
      <div className="collaborators">
        <span>{t("reviewDetail.collaborators")}: </span>
        {project?.collaborators?.map((c, num) => (
          <span key={c?.id}>
            {num !== 0 && `, `}
            {c?.username}
          </span>
        ))}
      </div>

      {status === "PEER_REVIEW" && (
        <>
          {project?.study ? (
            <div>
              <a target="_blank" href={`/studies/${project?.study?.slug}`}>
                <Button variant="filled">
                  {t("reviewDetail.participateInStudy", {}, { default: "Participate in the study" })}
                </Button>
              </a>
            </div>
          ) : (
            <div>{t("reviewDetail.noStudy")}</div>
          )}
        </>
      )}

      {canReview && (
        <div className="saveBtn">
          {inputs?.id ? (
            <Button
              variant="filled"
              type="button"
              disabled={updateLoading}
              onClick={async () => {
                if (
                  confirm(
                    t("reviewDetail.resubmitConfirm", {}, { default: "Are you sure you want to resubmit? Your feedback will be updated." })
                  )
                ) {
                  updateReview();
                  alert(t("reviewDetail.updated", {}, { default: "The review has been updated" }));
                }
              }}
            >
              {t("reviewDetail.resubmitFeedback", {}, { default: "Resubmit Feedback" })}
            </Button>
          ) : (
            <Button
              variant="filled"
              type="button"
              disabled={createLoading}
              onClick={async () => {
                if (
                  confirm(
                    t("reviewDetail.submitConfirm", {}, { default: "Are you sure you want to submit? Your feedback will be visible for others. You can edit your feedback after submission." })
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
                  alert(t("reviewDetail.submitted", {}, { default: "The review has been submitted" }));
                }
              }}
            >
              {t("reviewDetail.submitFeedback", {}, { default: "Submit Feedback" })}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
