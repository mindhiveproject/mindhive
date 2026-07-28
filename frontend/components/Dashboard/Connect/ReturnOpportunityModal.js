import { useState } from "react";
import { useMutation } from "@apollo/client";
import { Modal } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import StyledModal from "../../styles/StyledModal";
import { UPDATE_OPPORTUNITY } from "../../Mutations/Opportunity";
import { CREATE_REVIEW_NOTE } from "../../Mutations/OpportunityReviewNote";
import { REVIEW_NOTE_KIND } from "../../../lib/reviewThreadRound";

export default function ReturnOpportunityModal({
  open,
  onClose,
  onSuccess,
  opportunityId,
  roundId,
  mentorId: _mentorId,
  refetchQueries = [],
}) {
  const { t } = useTranslation("connect");
  const [noteBody, setNoteBody] = useState("");
  const [error, setError] = useState(null);

  const mutationOptions = {
    refetchQueries,
    awaitRefetchQueries: true,
  };

  const [updateOpportunity, { loading: updatingStatus }] = useMutation(
    UPDATE_OPPORTUNITY,
    mutationOptions
  );
  const [createNote, { loading: creatingNote }] = useMutation(
    CREATE_REVIEW_NOTE,
    mutationOptions
  );

  const submitting = updatingStatus || creatingNote;

  const handleClose = () => {
    if (submitting) return;
    setNoteBody("");
    setError(null);
    onClose?.();
  };

  const handleConfirm = async () => {
    if (!opportunityId || !roundId) return;
    setError(null);

    try {
      const body = noteBody.trim();
      if (body) {
        await createNote({
          variables: {
            input: {
              body,
              kind: REVIEW_NOTE_KIND.REVIEWER_COMMENT,
              opportunity: { connect: { id: opportunityId } },
              round: { connect: { id: roundId } },
            },
          },
        });
      }

      // Status change triggers the single mentor return notification in
      // Opportunity.afterOperation (includes round deep-link when known).
      await updateOpportunity({
        variables: {
          id: opportunityId,
          input: { status: "returned" },
        },
      });

      setNoteBody("");
      onSuccess?.();
    } catch (e) {
      setError(
        e?.message ||
          t("returnModal.error", {}, {
            default: "Could not return this opportunity. Please try again.",
          })
      );
    }
  };

  return (
    <Modal open={open} onClose={handleClose} size="small">
      <Modal.Header>
        {t("returnModal.title", {}, {
          default: "Return with comments",
        })}
      </Modal.Header>
      <Modal.Content>
        <StyledModal>
          <p style={{ margin: "0 0 12px", color: "#5f6871", fontSize: 14 }}>
            {t("returnModal.helper", {}, {
              default:
                "The sponsor will be notified to revise their proposal. You can optionally leave a note explaining what needs to change.",
            })}
          </p>
          <textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder={t("returnModal.placeholder", {}, {
              default: "Optional note for the sponsor…",
            })}
            rows={5}
            disabled={submitting}
          />
          {error ? (
            <p style={{ margin: "8px 0 0", color: "#871b16", fontSize: 13 }}>
              {error}
            </p>
          ) : null}
        </StyledModal>
      </Modal.Content>
      <Modal.Actions style={{ padding: "1rem 1.5rem", display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <Button variant="outline" onClick={handleClose} disabled={submitting}>
          {t("returnModal.cancel", {}, { default: "Cancel" })}
        </Button>
        <Button variant="filled" onClick={handleConfirm} disabled={submitting}>
          {submitting
            ? t("returnModal.submitting", {}, { default: "Returning…" })
            : t("returnModal.confirm", {}, { default: "Return with comments" })}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
