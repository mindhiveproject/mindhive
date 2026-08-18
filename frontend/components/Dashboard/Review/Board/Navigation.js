import Link from "next/link";

import { useMutation } from "@apollo/client";

import { GET_REVIEW } from "../../../Queries/Review";
import { CREATE_REVIEW, UPDATE_REVIEW } from "../../../Mutations/Review";
import { STUDY_TO_REVIEW } from "../../../Queries/Study";
import useTranslation from "next-translate/useTranslation";
import Button from "../../../DesignSystem/Button";

export default function Navigation({
  study,
  inputs,
  canReview,
  handleChange,
  resetForm,
}) {
  const { t } = useTranslation("builder");
  const [
    createReview,
    { data: createData, loading: createLoading, error: createError },
  ] = useMutation(CREATE_REVIEW, {
    variables: {
      input: {
        author: { connect: { id: inputs?.authorId } },
        study: { connect: { id: study?.id } },
        proposal: inputs?.proposalId
          ? { connect: { id: inputs?.proposalId } }
          : null,
        stage: inputs?.stage,
        settings: inputs?.settings,
        content: inputs?.content,
      },
    },
    refetchQueries: [
      {
        query: GET_REVIEW,
        variables: {
          proposalId: inputs?.proposalId,
          authorId: inputs?.authorId,
          stage: inputs?.stage,
        },
      },
      { query: STUDY_TO_REVIEW, variables: { id: study?.id } },
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
          proposalId: inputs?.proposalId,
          authorId: inputs?.authorId,
          stage: inputs?.stage,
        },
      },
      { query: STUDY_TO_REVIEW, variables: { id: study?.id } },
    ],
  });

  return (
    <div className="header">
      <Link
        href={{
          pathname: `/dashboard/review`,
        }}
      >
        <div className="backBtn">
          <img src="/assets/icons/review/expand_left.svg" />

          <div className="text">
            {t("reviewDetail.backToFeedbackCenter", {}, { default: "Back to Feedback Center" })}
          </div>
        </div>
      </Link>

      <div className="title">{study?.title}</div>

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
                    t("reviewDetail.updated", {}, { default: "The review has been updated" })
                  );
                }
              }}
            >
              {t("reviewDetail.submitFeedback", {}, { default: "Submit Feedback" })}
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
              {t("reviewDetail.submitFeedback", {}, { default: "Submit Feedback" })}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
