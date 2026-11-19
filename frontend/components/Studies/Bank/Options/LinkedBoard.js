import { gql, useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import MessageCard from "../../../DesignSystem/MessageCard";
import { UPDATE_PROJECT_BOARD } from "../../../Mutations/Proposal";
import { UPDATE_STUDY } from "../../../Mutations/Study";
import { DATA_COLLECTION_REFETCH } from "../../../Builder/shared/studyDataCollection/useStudyDataCollection";
import { ROW_BUTTON_STYLE, SettingRow, canChangeBoardStudy } from "./Links";

// Study builder → Settings: the project board the open study sits on.
// - On a board: its members (or class staff) can put another of their
//   studies on it. A board holds one study, so the open study leaves the
//   board (it is kept) and the builder reopens on the picked one.
// - Not on a board: connect it to one of the boards they are on, with a
//   warning when that board already holds another study.
// A board that belongs to a class also links the study to that class.

const BOARD = gql`
  fragment LinkedBoardFields on ProposalBoard {
    id
    title
    author {
      id
    }
    creator {
      id
    }
    collaborators {
      id
    }
    study {
      id
      title
    }
    studyMain {
      id
    }
    usedInClass {
      id
      title
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
`;

const STUDY_LINKED_BOARD = gql`
  query STUDY_LINKED_BOARD($studyId: ID!, $userId: ID!) {
    study(where: { id: $studyId }) {
      id
      title
      classes {
        id
      }
      proposal {
        ...LinkedBoardFields
      }
    }
    proposalBoards(
      where: {
        AND: [
          { isHidden: { equals: false } }
          { isTemplate: { equals: false } }
          {
            OR: [
              { author: { id: { equals: $userId } } }
              { creator: { id: { equals: $userId } } }
              { collaborators: { some: { id: { equals: $userId } } } }
            ]
          }
        ]
      }
      orderBy: [{ createdAt: desc }]
    ) {
      ...LinkedBoardFields
    }
    studies(
      where: {
        isHidden: { equals: false }
        OR: [
          { author: { id: { equals: $userId } } }
          { collaborators: { some: { id: { equals: $userId } } } }
        ]
      }
      orderBy: [{ createdAt: desc }]
    ) {
      id
      title
      classes {
        id
        title
      }
      proposal {
        id
        title
      }
    }
  }
  ${BOARD}
`;

const REFETCH = [
  "STUDY_LINKED_BOARD",
  "STUDY_CLASSES",
  "STUDY_PROPOSALS_QUERY",
  "STUDY_LINKED_BOARD_PEOPLE",
  ...DATA_COLLECTION_REFETCH,
];

const SECTION = { display: "flex", flexDirection: "column", gap: 8 };
const NOTE = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
};
const ACTIONS = { display: "flex", gap: 8, justifyContent: "flex-end" };
const ROW_BUTTONS = { display: "flex", gap: 4, flexShrink: 0 };
const CHIPS = { display: "flex", flexWrap: "wrap", gap: 4 };
const CHIP = { pointerEvents: "none" };

function OptionLabel({ title, chips }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span>{title}</span>
      {chips.length > 0 && (
        <span style={CHIPS}>
          {chips.map(({ key, label, tone }) => (
            <Chip key={key} variant="static" tone={tone} label={label} style={CHIP} />
          ))}
        </span>
      )}
    </span>
  );
}

function Warning({ children }) {
  return <MessageCard variant="warning" showIcon={false} message={children} />;
}

/** Full reload so every builder piece (form, canvas, collaboration) starts clean. */
function openStudy({ area, studyId }) {
  if (area === "projects") {
    // The URL names the board, which now holds the picked study.
    window.location.reload();
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set("selector", studyId);
  url.searchParams.delete("panel");
  window.location.assign(url.toString());
}

export default function LinkedBoard({ user, study, project, area, hasStudyChanged }) {
  const { t } = useTranslation("builder");
  const [editing, setEditing] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [pickedId, setPickedId] = useState("");
  const [pending, setPending] = useState(false);

  const { data } = useQuery(STUDY_LINKED_BOARD, {
    variables: { studyId: study?.id, userId: user?.id },
    skip: !study?.id || !user?.id,
  });
  const [updateBoard] = useMutation(UPDATE_PROJECT_BOARD);
  const [updateStudy] = useMutation(UPDATE_STUDY);

  if (!data?.study) return null;

  const untitledBoard = t("linkedBoard.untitledBoard", {}, {
    default: "Untitled project board",
  });
  const untitledStudy = t("linkedBoard.untitledStudy", {}, {
    default: "Untitled study",
  });
  const studyClassIds = new Set(data.study.classes.map((c) => c.id));

  // On a board's builder, the board underneath; otherwise the board the
  // study sits on (usually one).
  const board = project?.id
    ? data.study.proposal.find((b) => b.id === project.id)
    : data.study.proposal[0];
  const canManage = !board || canChangeBoardStudy(board, user?.id);

  const cancel = () => {
    setEditing(false);
    setUnlinking(false);
    setPickedId("");
  };

  const actions = (confirmLabel, onConfirm) => (
    <div style={ACTIONS}>
      <Button variant="text" disabled={pending} onClick={cancel}>
        {t("project.cancel", {}, { default: "Cancel" })}
      </Button>
      <Button variant="filled" disabled={pending || !pickedId} onClick={onConfirm}>
        {pending ? t("header.saving", {}, { default: "Saving" }) : confirmLabel}
      </Button>
    </div>
  );

  const row = (
    <SettingRow
      label={t("linkedBoard.title", {}, { default: "Project board" })}
      value={
        board
          ? board.title || untitledBoard
          : t("studyOptions.none", {}, { default: "None" })
      }
      actions={
        editing || unlinking || !canManage ? null : (
          <span style={ROW_BUTTONS}>
            <Button variant="text" style={ROW_BUTTON_STYLE} onClick={() => setEditing(true)}>
              {board
                ? t("studyOptions.change", {}, { default: "Change" })
                : t("linkedBoard.connect", {}, { default: "Connect" })}
            </Button>
            {board && (
              <Button variant="text" style={ROW_BUTTON_STYLE} onClick={() => setUnlinking(true)}>
                {t("studyOptions.unlink", {}, { default: "Unlink" })}
              </Button>
            )}
          </span>
        )
      }
    />
  );

  /* ---------------------------------------------------------------- */
  /* Not on a board: connect this study to one of my boards            */
  /* ---------------------------------------------------------------- */
  if (!board) {
    const myBoards = data.proposalBoards || [];
    const picked = myBoards.find((b) => b.id === pickedId);
    const otherStudy =
      picked?.study && picked.study.id !== study.id ? picked.study : null;

    const connect = async () => {
      if (!picked) return;
      setPending(true);
      try {
        const classId = picked.usedInClass?.id;
        if (classId && !studyClassIds.has(classId)) {
          await updateStudy({
            variables: {
              id: study.id,
              input: { classes: { connect: [{ id: classId }] } },
            },
          });
        }
        await updateBoard({
          variables: {
            id: picked.id,
            input: { study: { connect: { id: study.id } } },
          },
          refetchQueries: REFETCH,
          awaitRefetchQueries: true,
        });
        cancel();
      } catch (err) {
        alert(err?.message);
      } finally {
        setPending(false);
      }
    };

    return (
      <div style={SECTION}>
        {row}
        {editing &&
          (myBoards.length === 0 ? (
            <>
              <p className="MH-Type-Body-Small" style={NOTE}>
                {t("linkedBoard.noBoards", {}, {
                  default: "You are not on any project board yet.",
                })}
              </p>
              <div style={ACTIONS}>
                <Button variant="text" onClick={cancel}>
                  {t("project.cancel", {}, { default: "Cancel" })}
                </Button>
              </div>
            </>
          ) : (
            <>
              <DropdownSelect
                portal
                value={pickedId}
                onChange={setPickedId}
                searchableSingle
                searchPlaceholder={t("linkedBoard.searchBoards", {}, {
                  default: "Search boards",
                })}
                placeholder={t("linkedBoard.chooseBoard", {}, {
                  default: "Choose a project board",
                })}
                ariaLabel={t("linkedBoard.chooseBoard", {}, {
                  default: "Choose a project board",
                })}
                options={myBoards.map((b) => ({
                  value: b.id,
                  labelText: b.title || untitledBoard,
                  searchText: b.study?.title || "",
                  label: (
                    <OptionLabel
                      title={b.title || untitledBoard}
                      chips={
                        b.study
                          ? [
                              {
                                key: "study",
                                tone: "default",
                                label: t(
                                  "linkedBoard.hasStudy",
                                  { study: b.study.title || untitledStudy },
                                  {
                                    default: `Has a study: ${
                                      b.study.title || untitledStudy
                                    }`,
                                  }
                                ),
                              },
                            ]
                          : []
                      }
                    />
                  ),
                }))}
              />
              {otherStudy && (
                <Warning>
                  {t(
                    "linkedBoard.replaceWarning",
                    { study: otherStudy.title || untitledStudy },
                    {
                      default: `This board already has a study: ${
                        otherStudy.title || untitledStudy
                      }. Connecting replaces it on the board (the study itself is kept).`,
                    }
                  )}
                </Warning>
              )}
              {actions(
                otherStudy
                  ? t("linkedBoard.replace", {}, { default: "Replace" })
                  : t("linkedBoard.connect", {}, { default: "Connect" }),
                connect
              )}
            </>
          ))}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* On a board: change which study the board holds                    */
  /* ---------------------------------------------------------------- */
  const myStudies = (data.studies || []).filter((s) => s.id !== study.id);
  const picked = myStudies.find((s) => s.id === pickedId);
  const pickedOtherBoards = (picked?.proposal || []).filter(
    (p) => p.id !== board.id
  );
  const boardClass = board.usedInClass;
  const pickedJoinsClass =
    picked && boardClass && !picked.classes.some((c) => c.id === boardClass.id);

  const switchStudy = async () => {
    if (!picked) return;
    setPending(true);
    try {
      await updateBoard({
        variables: {
          id: board.id,
          input: {
            study: { connect: { id: picked.id } },
            // The board's main study follows the switch.
            ...(board.studyMain?.id === study.id && {
              studyMain: { connect: { id: picked.id } },
            }),
          },
        },
      });
      if (pickedJoinsClass) {
        await updateStudy({
          variables: {
            id: picked.id,
            input: { classes: { connect: [{ id: boardClass.id }] } },
          },
        });
      }
      openStudy({ area, studyId: picked.id });
    } catch (err) {
      alert(err?.message);
      setPending(false);
    }
  };

  const unlink = async () => {
    setPending(true);
    try {
      await updateBoard({
        variables: {
          id: board.id,
          input: {
            study: { disconnect: true },
            ...(board.studyMain?.id === study.id && {
              studyMain: { disconnect: true },
            }),
          },
        },
        refetchQueries: REFETCH,
        awaitRefetchQueries: true,
      });
      // On the board's own builder the page is about the board's study,
      // which is gone: reload so the board shows its empty state.
      if (area === "projects") {
        window.location.reload();
        return;
      }
      cancel();
    } catch (err) {
      alert(err?.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div style={SECTION}>
      {row}
      {unlinking && (
        <>
          <Warning>
            {t("linkedBoard.unlinkInfo", {}, {
              default:
                "Unlink this study from the board? The study and the board are kept; only the link is removed.",
            })}
          </Warning>
          {hasStudyChanged && area === "projects" && (
            <Warning>
              {t("linkedBoard.unsaved", {}, {
                default:
                  "Save your changes first: unsaved edits are lost when the builder reopens.",
              })}
            </Warning>
          )}
          <div style={ACTIONS}>
            <Button variant="text" disabled={pending} onClick={cancel}>
              {t("project.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button variant="filled" disabled={pending} onClick={unlink}>
              {t("studyOptions.unlink", {}, { default: "Unlink" })}
            </Button>
          </div>
        </>
      )}
      {editing && (
        <>
          <p className="MH-Type-Body-Small" style={NOTE}>
            {t("linkedBoard.switchInfo", {}, {
              default:
                "Pick the study this board should hold. The builder reopens on it; the current study is kept.",
            })}
          </p>
          {myStudies.length === 0 ? (
            <p className="MH-Type-Body-Small" style={NOTE}>
              {t("linkedBoard.noOtherStudies", {}, {
                default: "You have no other study.",
              })}
            </p>
          ) : (
            <DropdownSelect
              portal
              value={pickedId}
              onChange={setPickedId}
              searchableSingle
              searchPlaceholder={t("linkedBoard.searchStudies", {}, {
                default: "Search studies",
              })}
              placeholder={t("linkedBoard.chooseStudy", {}, {
                default: "Choose a study",
              })}
              ariaLabel={t("linkedBoard.chooseStudy", {}, {
                default: "Choose a study",
              })}
              options={myStudies.map((s) => ({
                value: s.id,
                labelText: s.title || untitledStudy,
                searchText: s.proposal.map((p) => p.title).filter(Boolean).join(" "),
                label: (
                  <OptionLabel
                    title={s.title || untitledStudy}
                    chips={s.proposal.map((p) => ({
                      key: `board-${p.id}`,
                      tone: "default",
                      label: t(
                        "linkedBoard.onBoard",
                        { board: p.title || untitledBoard },
                        { default: `On ${p.title || untitledBoard}` }
                      ),
                    }))}
                  />
                ),
              }))}
            />
          )}
          {pickedOtherBoards.length > 0 && (
            <Warning>
              {t(
                "linkedBoard.onOtherBoardWarning",
                {
                  board: pickedOtherBoards
                    .map((p) => p.title || untitledBoard)
                    .join(", "),
                },
                {
                  default: `This study is already on another board (${pickedOtherBoards
                    .map((p) => p.title || untitledBoard)
                    .join(", ")}). It will be on both.`,
                }
              )}
            </Warning>
          )}
          {pickedJoinsClass && (
            <p className="MH-Type-Body-Small" style={NOTE}>
              {t("linkedBoard.joinsClass", { class: boardClass.title }, {
                default: `This study also joins ${boardClass.title}, so its teachers can follow it.`,
              })}
            </p>
          )}
          {picked && hasStudyChanged && (
            <Warning>
              {t("linkedBoard.unsaved", {}, {
                default: "Save your changes first: unsaved edits are lost when the builder reopens.",
              })}
            </Warning>
          )}
          {actions(
            t("linkedBoard.switchConfirm", {}, { default: "Switch" }),
            switchStudy
          )}
        </>
      )}
    </div>
  );
}
