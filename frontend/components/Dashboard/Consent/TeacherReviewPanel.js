import { useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import DisplayError from "../../ErrorMessage";
import Button from "../../DesignSystem/Button";
import Input from "../../DesignSystem/Input";
import { REVIEW_CONSENT } from "../../Mutations/Consent";
import { GET_CONSENT } from "../../Queries/Consent";

// Shown to the class teaching team on a protocol linked to their class:
// approve it, or reopen it with a note for the student.
export default function TeacherReviewPanel({ consent }) {
  const { t } = useTranslation("dashboard");
  const [reopening, setReopening] = useState(false);
  const [note, setNote] = useState("");
  const review = consent?.settings?.review || {};
  const student = consent?.author?.username;

  const [reviewConsent, { loading, error }] = useMutation(REVIEW_CONSENT, {
    refetchQueries: [
      { query: GET_CONSENT, variables: { code: consent?.code } },
      "GET_MY_UPDATES",
      "COUNT_NEW_UPDATES",
    ],
    awaitRefetchQueries: true,
  });

  async function decide(decision) {
    try {
      await reviewConsent({
        variables: { consentId: consent.id, decision, note },
      });
      setReopening(false);
      setNote("");
    } catch (err) {
      // surfaced through error
    }
  }

  const status = {
    submitted: {
      badge: [
        "",
        t("consentAdmin.review.submitted", {}, { default: "Awaiting review" }),
      ],
      text: t(
        "consentAdmin.review.teacherSubmitted",
        { student },
        { default: "{{student}} marked this protocol as ready for review." }
      ),
    },
    approved: {
      badge: [
        "ready",
        t("consentAdmin.review.approved", {}, { default: "Approved" }),
      ],
      text: t(
        "consentAdmin.review.teacherApproved",
        { reviewer: review.reviewedBy?.username },
        { default: "Approved by {{reviewer}}." }
      ),
    },
    reopened: {
      badge: [
        "",
        t("consentAdmin.review.reopened", {}, { default: "Changes requested" }),
      ],
      text: t(
        "consentAdmin.review.teacherReopened",
        { student },
        { default: "Reopened for {{student}} to work on." }
      ),
    },
  }[review.status] || {
    badge: [
      "",
      t(
        "consentAdmin.review.notSubmitted",
        {},
        { default: "Not submitted yet" }
      ),
    ],
    text: t(
      "consentAdmin.review.teacherWaiting",
      { student },
      { default: "{{student}} hasn’t submitted this protocol for review yet." }
    ),
  };

  return (
    <section className="consentSideCard consentReviewCard consentTeacherReview">
      <h2>
        {t("consentAdmin.review.title", {}, { default: "Teacher review" })}
      </h2>
      <span className={`statusBadge ${status.badge[0]}`}>
        {status.badge[1]}
      </span>
      <p>{status.text}</p>
      {review.status === "reopened" && review.note && (
        <blockquote className="consentReviewNote">{review.note}</blockquote>
      )}
      <DisplayError error={error} />

      {reopening ? (
        <div className="consentReviewReopen">
          <Input
            label={t(
              "consentAdmin.review.noteLabel",
              {},
              {
                default: "Note for the student",
              }
            )}
            multiline
            rows={3}
            value={note}
            onChange={setNote}
            disabled={loading}
            placeholder={t(
              "consentAdmin.review.notePlaceholder",
              {},
              {
                default: "What should they change?",
              }
            )}
          />
          <div className="consentHeaderActions">
            <Button
              variant="text"
              type="button"
              disabled={loading}
              onClick={() => setReopening(false)}
            >
              {t("consentAdmin.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button
              variant="filled"
              type="button"
              disabled={loading}
              onClick={() => decide("reopen")}
            >
              {t(
                "consentAdmin.review.sendReopen",
                {},
                {
                  default: "Reopen and notify",
                }
              )}
            </Button>
          </div>
        </div>
      ) : (
        (review.status === "submitted" || review.status === "approved") && (
          <div className="consentHeaderActions">
            {review.status === "submitted" && (
              <Button
                variant="filled"
                type="button"
                disabled={loading}
                onClick={() => decide("approve")}
              >
                {t("consentAdmin.review.approve", {}, { default: "Approve" })}
              </Button>
            )}
            <Button
              variant="outline"
              type="button"
              disabled={loading}
              onClick={() => setReopening(true)}
            >
              {t("consentAdmin.review.reopen", {}, { default: "Reopen" })}
            </Button>
          </div>
        )
      )}
    </section>
  );
}
