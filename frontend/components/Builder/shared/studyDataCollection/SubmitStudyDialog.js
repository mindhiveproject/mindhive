import { useEffect, useId, useState } from "react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Modal from "../../../DesignSystem/Modal";
import Button from "../../../DesignSystem/Button";
import Checkbox from "../../../DesignSystem/Checkbox";
import Chip from "../../../DesignSystem/Chip";
import MessageCard from "../../../DesignSystem/MessageCard";
import { otherPeople } from "./useStudyDataCollection";

const StyledDialogBody = styled.div`
  display: grid;
  gap: 16px;
  color: var(--MH-Theme-Neutrals-Black, #171717);

  p {
    margin: 0;
  }

  .dialogGroup {
    display: grid;
    gap: 8px;
  }

  .dialogGroupLabel {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .dialogChips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .dialogConfirm {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .dialogConfirmText {
    padding-top: 13px;
    cursor: pointer;
  }

  .dialogNote {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;

/**
 * The one confirmation for submitting a study for data collection or marking
 * its data collection finished, opened from the board's data-collection
 * card, the study builder's Status card and the teacher's Studies tab. It
 * lists every person and board sharing the study (the decision applies to all
 * of them), and whoever confirms ticks the box: the mutation refuses without
 * it and records their name and the time in the logs.
 *
 * `onConfirm(acknowledgedProfileIds)` runs the action.
 */
export default function SubmitStudyDialog({
  open,
  mode = "SUBMIT",
  studyTitle,
  state,
  userId,
  saving = false,
  onCancel,
  onConfirm,
}) {
  const { t } = useTranslation("builder");
  const confirmLabelId = useId();
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    if (open) setConfirmed(false);
  }, [open]);

  if (!open || !state) return null;

  const others = otherPeople(state, userId);
  const boards = (state.boards || []).filter((board) => board.milestoneKey);
  const isFinish = mode === "FINISH";
  // A teacher reopening the study: no box to tick (it unlocks; nothing is
  // committed on the students' behalf), but the same list of who it affects.
  const isReopen = mode === "REOPEN";
  const needsConfirm = !isReopen;
  const shared = others.length > 0;

  const title = isReopen
    ? t("dataCollection.dialog.reopenTitle", { title: studyTitle }, {
        default: "Reopen “{{title}}” for editing?",
      })
    : isFinish
    ? t("dataCollection.dialog.finishTitle", { title: studyTitle }, {
        default: "Mark data collection of “{{title}}” as finished?",
      })
    : t("dataCollection.dialog.submitTitle", { title: studyTitle }, {
        default: "Submit “{{title}}” for data collection?",
      });

  const confirmText = shared
    ? isFinish
      ? t("dataCollection.dialog.agreeFinish", {}, {
          default:
            "I've checked with my collaborators and we agree data collection is finished.",
        })
      : t("dataCollection.dialog.agreeSubmit", {}, {
          default:
            "I've checked with my collaborators and we agree it's time to submit.",
        })
    : isFinish
    ? t("dataCollection.dialog.confirmFinish", {}, {
        default: "I confirm data collection for this study is finished.",
      })
    : t("dataCollection.dialog.confirmSubmit", {}, {
        default: "I confirm this study is ready to collect data.",
      });

  return (
    <Modal
      open
      onClose={() => !saving && onCancel?.()}
      maxWidth={560}
      title={title}
      actions={
        <>
          <Button variant="text" disabled={saving} onClick={onCancel}>
            {t("dataCollection.dialog.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button
            variant="filled"
            disabled={saving || (needsConfirm && !confirmed)}
            onClick={() => onConfirm?.(others.map((person) => person.id))}
          >
            {saving
              ? t("dataCollection.dialog.saving", {}, { default: "Saving" })
              : isReopen
              ? t("dataCollection.dialog.reopenConfirm", {}, {
                  default: "Reopen for editing",
                })
              : isFinish
              ? t("dataCollection.dialog.finishConfirm", {}, {
                  default: "Mark as finished",
                })
              : shared
              ? t("dataCollection.dialog.submitForEveryone", {}, {
                  default: "Submit for everyone",
                })
              : t("dataCollection.dialog.submit", {}, { default: "Submit" })}
          </Button>
        </>
      }
    >
      <StyledDialogBody>
        {shared ? (
          <div className="dialogGroup">
            <p className="MH-Type-Body-Base">
              {isReopen
                ? t("dataCollection.dialog.sharedReopen", {}, {
                    default:
                      "This study is shared. Reopening it unlocks it for everyone:",
                  })
                : isFinish
                ? t("dataCollection.dialog.sharedFinish", {}, {
                    default:
                      "This study is shared. Finishing closes participation for everyone:",
                  })
                : t("dataCollection.dialog.sharedSubmit", {}, {
                    default:
                      "This study is shared. Submitting it submits it for everyone:",
                  })}
            </p>
            <div className="dialogChips">
              {others.map((person) => (
                <Chip
                  key={person.id}
                  variant="static"
                  label={person.username}
                  title={person.boards?.join(", ") || undefined}
                />
              ))}
            </div>
          </div>
        ) : null}

        {boards.length > 1 ? (
          <div className="dialogGroup">
            <p className="MH-Type-Label-Base dialogGroupLabel">
              {t("dataCollection.dialog.boards", { count: boards.length }, {
                default:
                  "The data-collection milestone of these {{count}} project boards will be updated:",
              })}
            </p>
            <div className="dialogChips">
              {boards.map((board) => (
                <Chip
                  key={board.id}
                  variant="static"
                  tone="neutral"
                  label={[
                    board.title ||
                      t("dataCollection.untitledBoard", {}, {
                        default: "Untitled project",
                      }),
                    board.classTitle,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
              ))}
            </div>
          </div>
        ) : null}

        <MessageCard
          variant={isReopen ? "information" : "warning"}
          message={
            isReopen
              ? t("dataCollection.dialog.reopenInfo", {}, {
                  default:
                    "Participation closes and the data-collection milestone of every linked board goes back to in progress. Students can edit the study again and submit it later.",
                })
              : isFinish
              ? t("dataCollection.dialog.finishLock", {}, {
                  default:
                    "Participation closes and the study stays locked. Only a teacher can resume data collection.",
                })
              : t("dataCollection.dialog.submitLock", {}, {
                  default:
                    "The study will be locked for everyone: no one can edit its flow or participant page. Only a teacher can reopen it.",
                })
          }
        />

        {needsConfirm ? (
        <div className="dialogConfirm">
          <Checkbox
            checked={confirmed}
            onChange={setConfirmed}
            disabled={saving}
            ariaLabelledBy={confirmLabelId}
          />
          <span
            id={confirmLabelId}
            className="MH-Type-Body-Base dialogConfirmText"
            onClick={() => !saving && setConfirmed(!confirmed)}
          >
            {confirmText}
          </span>
        </div>
        ) : null}

        <p className="MH-Type-Body-Small dialogNote">
          {t("dataCollection.dialog.public", {}, {
            default:
              "Your name and the time are recorded and shown to your collaborators and teachers.",
          })}
        </p>
      </StyledDialogBody>
    </Modal>
  );
}
