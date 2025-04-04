import Link from "next/link";
import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";

import { GET_REVIEW } from "../../../Queries/Review";
import { CREATE_REVIEW, UPDATE_REVIEW } from "../../../Mutations/Review";
import { PROPOSAL_REVIEWS_QUERY } from "../../../Queries/Proposal";

export default function Navigation({
  project,
  study,
  inputs,
  canReview,
  handleChange,
  resetForm,
  status,
}) {
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

        <div className="text">Back to Feedback Center</div>
      </div>

      <div className="title">{project?.title}</div>
      <div className="collaborators">
        <span>Collaborators: </span>
        {project?.collaborators?.map((c, num) => (
          <span>
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
                <button>Participate in the study</button>
              </a>
            </div>
          ) : (
            <div>There is no study</div>
          )}
        </>
      )}

      {canReview && (
        <div className="saveBtn">
          {inputs?.id ? (
            <button
              type="button"
              disabled={updateLoading}
              onClick={async () => {
                if (
                  confirm(
                    "Are you sure you want to resubmit? Your feedback will be updated."
                  )
                ) {
                  updateReview();
                  alert("The review has been updated");
                }
              }}
            >
              Resubmit Feedback
            </button>
          ) : (
            <button
              type="button"
              disabled={createLoading}
              onClick={async () => {
                if (
                  confirm(
                    "Are you sure you want to submit? Your feedback will be visible for others. You can edit your feedback after submission."
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
                  alert("The review has been submitted");
                }
              }}
            >
              Submit Feedback
            </button>
          )}
        </div>
      )}
    </div>
  );
}
