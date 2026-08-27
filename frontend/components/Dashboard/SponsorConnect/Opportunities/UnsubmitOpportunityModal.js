import { useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../DesignSystem/Button";
import Modal from "../../../DesignSystem/Modal";
import { UPDATE_OPPORTUNITY } from "../../../Mutations/Opportunity";
import { MY_OPPORTUNITIES } from "../../../Queries/Opportunity";

const ActionsColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 100%;
`;

const CancelRow = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: 4px;
`;

const HELD_UNSUBMIT_STATUSES = new Set(["pre_selected", "accepted"]);

/**
 * Sponsor chooses how to leave review: draft or returned (in revision).
 */
export default function UnsubmitOpportunityModal({
  open,
  onClose,
  opportunityId,
  status,
  onSuccess,
}) {
  const { t } = useTranslation("connect");
  const [error, setError] = useState(null);
  const [busyTarget, setBusyTarget] = useState(null);

  const [updateOpportunity] = useMutation(UPDATE_OPPORTUNITY, {
    refetchQueries: [{ query: MY_OPPORTUNITIES }],
    awaitRefetchQueries: true,
  });

  const busy = Boolean(busyTarget);
  const showHeldWarning = HELD_UNSUBMIT_STATUSES.has(status);

  const handleClose = () => {
    if (busy) return;
    setError(null);
    onClose?.();
  };

  const handleChoose = async (nextStatus) => {
    if (!opportunityId || busy) return;
    setError(null);
    setBusyTarget(nextStatus);
    try {
      await updateOpportunity({
        variables: {
          id: opportunityId,
          input: { status: nextStatus },
        },
      });
      onSuccess?.(nextStatus);
    } catch (e) {
      setError(
        e?.message ||
          t("myOpportunitiesList.unsubmit.error", {}, {
            default:
              "Could not unsubmit this opportunity. Please try again.",
          }),
      );
    } finally {
      setBusyTarget(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : handleClose}
      title={t("myOpportunitiesList.unsubmit.title", {}, {
        default: "Unsubmit opportunity?",
      })}
      maxWidth={420}
      actions={
        <ActionsColumn>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleChoose("draft")}
            disabled={busy}
            style={{ width: "100%" }}
          >
            {busyTarget === "draft"
              ? t("myOpportunitiesList.unsubmit.working", {}, {
                  default: "Updating…",
                })
              : t("myOpportunitiesList.unsubmit.toDraft", {}, {
                  default: "Turn back to draft",
                })}
          </Button>
          <Button
            type="button"
            variant="filled"
            onClick={() => handleChoose("returned")}
            disabled={busy}
            style={{ width: "100%" }}
          >
            {busyTarget === "returned"
              ? t("myOpportunitiesList.unsubmit.working", {}, {
                  default: "Updating…",
                })
              : t("myOpportunitiesList.unsubmit.toRevision", {}, {
                  default: "Mark as in revision",
                })}
          </Button>
          <CancelRow>
            <Button
              type="button"
              variant="text"
              onClick={handleClose}
              disabled={busy}
            >
              {t("myOpportunitiesList.unsubmit.cancel", {}, {
                default: "Cancel",
              })}
            </Button>
          </CancelRow>
        </ActionsColumn>
      }
    >
      <p style={{ margin: 0 }}>
        {t("myOpportunitiesList.unsubmit.helper", {}, {
          default:
            "Choose how to pull this opportunity out of review. Draft hides it from teachers until you submit again. In revision keeps it visible as returned so you can revise and resubmit.",
        })}
      </p>
      {showHeldWarning ? (
        <p style={{ margin: "12px 0 0" }}>
          {t("myOpportunitiesList.unsubmit.helperHeld", {}, {
            default:
              "This opportunity is already selected for a matching round. Unsubmitting does not remove it — students may still see it until a teacher removes it. Ask the teacher if you want it hidden. If they remove it, they will need to re-select it later for students to see it again.",
          })}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="MH-Type-Body-Small"
          style={{
            margin: "12px 0 0",
            color: "var(--MH-Theme-Error-Dark, #b3261e)",
          }}
        >
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
