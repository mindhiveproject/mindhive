import { useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../../DesignSystem/Button";
import Modal from "../../../../../DesignSystem/Modal";
import Tooltip from "../../../../../DesignSystem/Tooltip";
import { StarIcon, StarFilledIcon } from "../../../../../DesignSystem/Icons";
import { UPDATE_PROJECT_BOARD } from "../../../../../Mutations/Proposal";
import {
  boardRuleMessage,
  boardStudentIds,
  classStaffIds,
  isSharedBoard,
  splitOtherMains,
} from "../../../../../../lib/mainProject";

// "Main project" is stored on the board (ProposalBoard.isMain), so it is the
// same for every student on the board. A student has one main project per
// class; the server enforces it (keystone/lib/mainProject.js) and swaps the
// students' other main projects when this one is set.
const BOARD_MAIN_STATE = gql`
  query BOARD_MAIN_STATE($id: ID!) {
    proposalBoard(where: { id: $id }) {
      id
      title
      isMain
      author {
        id
      }
      collaborators {
        id
      }
      usedInClass {
        id
        creator {
          id
        }
        teachingTeam {
          id
        }
        mentors {
          id
        }
      }
    }
  }
`;

// The other main projects, in the same class, of the students on this board.
const OTHER_MAIN_BOARDS = gql`
  query OTHER_MAIN_BOARDS($id: ID!, $classId: ID!, $studentIds: [ID!]!) {
    proposalBoards(
      where: {
        id: { not: { equals: $id } }
        isMain: { equals: true }
        isHidden: { equals: false }
        usedInClass: { id: { equals: $classId } }
        OR: [
          { author: { id: { in: $studentIds } } }
          { collaborators: { some: { id: { in: $studentIds } } } }
        ]
      }
    ) {
      id
      title
      author {
        id
      }
      collaborators {
        id
      }
    }
  }
`;

const memberIds = (board) =>
  new Set(
    [board?.author?.id, ...(board?.collaborators || []).map((c) => c?.id)].filter(
      Boolean
    )
  );

const ICON = { width: 18, height: 18 };

export default function MainProjectChip({ proposalId, user }) {
  const { t } = useTranslation("builder");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refusal, setRefusal] = useState(null);

  const { data, refetch } = useQuery(BOARD_MAIN_STATE, {
    variables: { id: proposalId },
    skip: !proposalId,
  });
  const board = data?.proposalBoard;
  const classId = board?.usedInClass?.id;
  const isMember = !!user?.id && memberIds(board).has(user.id);
  // Teachers and mentors of the class are not counted as being on the board.
  const staffIds = classStaffIds(board?.usedInClass);
  const studentIds = [...boardStudentIds(board, staffIds)];
  const isShared = isSharedBoard(board, staffIds);

  const { data: othersData, refetch: refetchOthers } = useQuery(
    OTHER_MAIN_BOARDS,
    {
      variables: { id: proposalId, classId, studentIds },
      skip: !open || !classId || !studentIds.length,
      fetchPolicy: "network-only",
    }
  );
  // Replaced: every student on it is on this board. Blocking: shared with a
  // student who is not, so the server refuses instead of changing it for them.
  const { replaced: currentMains, blocking } = splitOtherMains(
    board,
    othersData?.proposalBoards,
    staffIds
  );
  const titles = (boards) => boards.map((b) => `"${b.title}"`).join(", ");

  const [updateBoard] = useMutation(UPDATE_PROJECT_BOARD);

  // A main project only makes sense for a board used in a class.
  if (!board || !classId) return null;

  const unsetMain = async () => {
    setSaving(true);
    try {
      await updateBoard({ variables: { id: board.id, input: { isMain: false } } });
      await refetch();
      setOpen(false);
    } catch (err) {
      alert(err?.message);
    } finally {
      setSaving(false);
    }
  };

  if (board.isMain && isMember) {
    return (
      <>
        <Tooltip
          content={t("mainProject.tooltipMember", {}, {
            default:
              "This is your main project for this class. It shows your teacher that this is the project you'll keep working on. Click to change this.",
          })}
          side="bottom"
          maxWidth={320}
        >
          <button
            type="button"
            className="studyLinkChip mainProject mainProject--editable"
            onClick={() => setOpen(true)}
          >
            <span className="studyLinkChipContent">
              <StarFilledIcon style={ICON} aria-hidden="true" />
              <span className="studyLinkText">
                {t("mainProject.label", {}, { default: "Main project" })}
              </span>
            </span>
          </button>
        </Tooltip>
        <Modal
          open={open}
          onClose={() => !saving && setOpen(false)}
          maxWidth={520}
          title={t("mainProject.unsetTitle", {}, {
            default: "Remove as main project?",
          })}
          actions={
            <>
              <Button
                variant="text"
                disabled={saving}
                onClick={() => setOpen(false)}
              >
                {t("mainProject.cancel", {}, { default: "Cancel" })}
              </Button>
              <Button variant="filled" disabled={saving} onClick={unsetMain}>
                {t("mainProject.unsetConfirm", {}, {
                  default: "Remove as main project",
                })}
              </Button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            {t("mainProject.unsetExplanation", {}, {
              default:
                "This project will no longer be your main project. Until you choose another one, your teacher won't see which project you're focusing on in this class.",
            })}
          </p>
          {isShared && (
            <p>
              {t("mainProject.unsetShared", {}, {
                default:
                  "This project is shared, so it will stop being the main project for everyone working on it.",
              })}
            </p>
          )}
        </Modal>
      </>
    );
  }

  if (board.isMain) {
    return (
      <Tooltip
        content={t("mainProject.tooltip", {}, {
          default:
            "This is your main project for this class. It shows your teacher that this is the project you'll keep working on.",
        })}
        side="bottom"
        maxWidth={320}
      >
        <span className="studyLinkChip mainProject" tabIndex={0}>
          <span className="studyLinkChipContent">
            <StarFilledIcon style={ICON} aria-hidden="true" />
            <span className="studyLinkText">
              {t("mainProject.label", {}, { default: "Main project" })}
            </span>
          </span>
        </span>
      </Tooltip>
    );
  }

  // Only people on the board can make it their main project.
  if (!isMember) return null;

  const confirm = async () => {
    setSaving(true);
    try {
      // The server un-mains the replaced boards with this one update.
      await updateBoard({ variables: { id: board.id, input: { isMain: true } } });
      await Promise.all([refetch(), refetchOthers?.()]);
      setOpen(false);
    } catch (err) {
      setRefusal(boardRuleMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="studyLinkChip setMainProject"
        onClick={() => {
          setRefusal(null);
          setOpen(true);
        }}
      >
        <span className="studyLinkChipContent">
          <StarIcon style={ICON} aria-hidden="true" />
          <span className="studyLinkText">
            {t("mainProject.setAsMain", {}, { default: "Set as main project" })}
          </span>
        </span>
      </button>
      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        maxWidth={520}
        title={t("mainProject.modalTitle", {}, {
          default: "Make this your main project?",
        })}
        actions={
          <>
            <Button
              variant="text"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              {t("mainProject.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button
              variant="filled"
              disabled={saving || blocking.length > 0}
              onClick={confirm}
            >
              {t("mainProject.confirm", {}, { default: "Set as main project" })}
            </Button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>
          {t("mainProject.explanation", {}, {
            default:
              "Your main project shows your teacher which project you'll keep working on in this class. You can have one main project per class.",
          })}
        </p>
        {isShared && (
          <p>
            {t("mainProject.setShared", {}, {
              default:
                "This project is shared, so it will become the main project for everyone working on it.",
            })}
          </p>
        )}
        {currentMains.length > 0 && (
          <p>
            {/* On a shared board the replaced boards can be other students'
                mains, so "your" would be wrong. */}
            {isShared
              ? t(
                  "mainProject.replacesShared",
                  { titles: titles(currentMains) },
                  {
                    default: `${titles(currentMains)} will no longer be marked as main project.`,
                  }
                )
              : t(
                  "mainProject.replaces",
                  { titles: titles(currentMains) },
                  {
                    default: `${titles(currentMains)} will no longer be your main project.`,
                  }
                )}
          </p>
        )}
        {blocking.length > 0 && !refusal && (
          <p role="alert">
            {t(
              "mainProject.blockedByShared",
              { titles: titles(blocking) },
              {
                default: `You can have one main project per class, and ${titles(
                  blocking
                )} is already a main project in this class. It is shared with other students, so it is not changed automatically. Open it and remove it as main project first.`,
              }
            )}
          </p>
        )}
        {refusal && <p role="alert">{refusal}</p>}
      </Modal>
    </>
  );
}
