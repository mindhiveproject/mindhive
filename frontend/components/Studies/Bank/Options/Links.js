import { gql, useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import LinkClass from "../../../Builder/Project/Navigation/ConnectStudy/LinkClass";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import MessageCard from "../../../DesignSystem/MessageCard";
import { UPDATE_PROJECT_BOARD } from "../../../Mutations/Proposal";
import { UPDATE_STUDY } from "../../../Mutations/Study";
import { MY_STUDY, STUDY_PROPOSALS_QUERY } from "../../../Queries/Study";

const SECTION_STYLE = { display: "flex", flexDirection: "column", gap: 8 };
const TITLE_STYLE = { margin: 0 };
const ICON = { width: "20px", height: "20px" };

/* ------------------------------------------------------------------ */
/* Study tabs: the study's linked classes                              */
/* ------------------------------------------------------------------ */

const STUDY_CLASSES = gql`
  query STUDY_CLASSES($id: ID!) {
    study(where: { id: $id }) {
      id
      classes {
        id
        title
      }
    }
  }
`;

const NOTE_STYLE = {
  margin: 0,
  padding: "8px 12px",
  borderRadius: 8,
  background: "var(--MH-Theme-Primary-Lighter, #f4f8f7)",
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
};
const ACTIONS_STYLE = { display: "flex", gap: 8, justifyContent: "flex-end" };

const sameIds = (a, b) => {
  const x = (a || []).map((c) => c?.id).sort();
  const y = (b || []).map((c) => c?.id).sort();
  return x.length === y.length && x.every((id, i) => id === y[i]);
};

const ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  minWidth: 0,
};
const ROW_TEXT_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 0,
};
const ROW_LABEL_STYLE = {
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
};
const ROW_VALUE_STYLE = { overflowWrap: "anywhere" };
// Row actions sit next to the value: tighter than the default text button.
export const ROW_BUTTON_STYLE = { padding: "8px 12px" };

// One "Label / value  [Change]" line of the builder's Settings popover.
export function SettingRow({ label, value, actionLabel, onAction, actions }) {
  return (
    <div style={ROW_STYLE}>
      <div style={ROW_TEXT_STYLE}>
        <span className="MH-Type-Label-Small" style={ROW_LABEL_STYLE}>
          {label}
        </span>
        <span className="MH-Type-Body-Base" style={ROW_VALUE_STYLE} title={value}>
          {value}
        </span>
      </div>
      {actions ||
        (actionLabel && (
          <Button variant="text" style={ROW_BUTTON_STYLE} onClick={onAction}>
            {actionLabel}
          </Button>
        ))}
    </div>
  );
}

// Read-only by default: the user opts in to edit, and the change is only
// saved when they confirm it.
export function LinkedClass({ study }) {
  const { t } = useTranslation("builder");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const { data } = useQuery(STUDY_CLASSES, {
    variables: { id: study?.id },
    skip: !study?.id,
  });
  const [updateStudy, { loading }] = useMutation(UPDATE_STUDY, {
    refetchQueries: [
      { query: STUDY_CLASSES, variables: { id: study?.id } },
      { query: MY_STUDY, variables: { id: study?.id } },
      { query: STUDY_PROPOSALS_QUERY, variables: { id: study?.id } },
    ],
  });

  const classes = data?.study?.classes || [];

  const startEditing = () => {
    setDraft(classes.map((cl) => ({ id: cl.id })));
    setEditing(true);
  };

  const save = async () => {
    try {
      await updateStudy({
        variables: {
          id: study.id,
          input: {
            classes: { set: draft.map((cl) => ({ id: cl.id })) },
          },
        },
      });
      setEditing(false);
    } catch (err) {
      alert(err?.message);
    }
  };

  return (
    <div style={SECTION_STYLE}>
      <SettingRow
        label={t("studyOptions.class", {}, { default: "Class" })}
        value={
          classes.length
            ? classes.map((cl) => cl.title).join(", ")
            : t("studyOptions.none", {}, { default: "None" })
        }
        actionLabel={
          editing || !study?.id
            ? null
            : t("studyOptions.change", {}, { default: "Change" })
        }
        onAction={startEditing}
      />

      {editing && (
        <>
          <p className="MH-Type-Body-Small" style={NOTE_STYLE}>
            {t("studyOptions.classShort", {}, {
              default: "The class's teachers can follow and review this study.",
            })}
          </p>
          <LinkClass
            study={{ classes: draft }}
            handleChange={({ target: { value } }) => setDraft(value || [])}
            portal
          />
          <div style={ACTIONS_STYLE}>
            <Button
              variant="text"
              disabled={loading}
              onClick={() => setEditing(false)}
            >
              {t("project.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button
              variant="filled"
              disabled={loading || sameIds(draft, classes)}
              onClick={save}
            >
              {loading
                ? t("header.saving", {}, { default: "Saving" })
                : t("header.save", {}, { default: "Save" })}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Project board tab: the board's study, which can be switched/unlinked */
/* ------------------------------------------------------------------ */

const BOARD_STUDY_LINK = gql`
  query BOARD_STUDY_LINK($id: ID!, $userId: ID!) {
    proposalBoard(where: { id: $id }) {
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
    # The viewer's studies, plus those of the classes they teach.
    studies(
      where: {
        isHidden: { equals: false }
        OR: [
          { author: { id: { equals: $userId } } }
          { collaborators: { some: { id: { equals: $userId } } } }
          { classes: { some: { creator: { id: { equals: $userId } } } } }
        ]
      }
      orderBy: [{ createdAt: desc }]
    ) {
      id
      title
      classes {
        id
      }
      proposal {
        id
        title
      }
    }
  }
`;

const BOARD_LINK_REFETCH = [
  "BOARD_STUDY_LINK",
  "PROPOSAL_QUERY",
  "GET_PROJECT_STUDY",
  "STUDY_LINKED_BOARD",
  "STUDY_PROPOSALS_QUERY",
  "STUDY_LINKED_BOARD_PEOPLE",
];

const isClassStaff = (cls, userId) =>
  !!cls &&
  (cls.creator?.id === userId ||
    (cls.teachingTeam || []).some((p) => p?.id === userId) ||
    (cls.mentors || []).some((p) => p?.id === userId));

// Only the board's owner, or staff of its class, may change which study the
// board is linked to.
export const canManageBoardStudy = (board, userId) =>
  !!userId &&
  (board?.author?.id === userId ||
    board?.creator?.id === userId ||
    isClassStaff(board?.usedInClass, userId));

// Class boards are usually created by the teacher with the students as
// collaborators, so a board's members may change its study too.
export const canChangeBoardStudy = (board, userId) =>
  canManageBoardStudy(board, userId) ||
  (board?.collaborators || []).some((p) => p?.id === userId);

const BOARD_ACTIONS_STYLE = { display: "flex", gap: 4, flexShrink: 0 };
const ROW_ACTIONS_STYLE = { display: "flex", gap: 8, justifyContent: "flex-end" };
const OPTION_STYLE = { display: "flex", flexDirection: "column", gap: 6 };
const OPTION_CHIPS_STYLE = { display: "flex", flexWrap: "wrap", gap: 4 };
const OPTION_CHIP_STYLE = { pointerEvents: "none" };

export function LinkedStudy({ user, project }) {
  const { t } = useTranslation("builder");
  const [mode, setMode] = useState(null); // "change" | "unlink" | null
  const [pickedId, setPickedId] = useState("");
  const [pending, setPending] = useState(false);

  const { data } = useQuery(BOARD_STUDY_LINK, {
    variables: { id: project?.id, userId: user?.id },
    skip: !project?.id || !user?.id,
  });
  const [updateBoard] = useMutation(UPDATE_PROJECT_BOARD);
  const [updateStudy] = useMutation(UPDATE_STUDY);

  const board = data?.proposalBoard;
  if (!board) return null;
  const study = board.study;
  const canChange = canChangeBoardStudy(board, user?.id);
  const untitledStudy = t("linkedBoard.untitledStudy", {}, {
    default: "Untitled study",
  });
  const untitledBoard = t("linkedBoard.untitledBoard", {}, {
    default: "Untitled project board",
  });

  const studies = (data.studies || []).filter((s) => s.id !== study?.id);
  const picked = studies.find((s) => s.id === pickedId);
  const pickedOtherBoards = (picked?.proposal || []).filter(
    (p) => p.id !== board.id
  );
  const boardClass = board.usedInClass;
  const pickedJoinsClass =
    picked && boardClass && !picked.classes.some((c) => c.id === boardClass.id);

  const close = () => {
    setMode(null);
    setPickedId("");
  };

  const run = async (work) => {
    setPending(true);
    try {
      await work();
      close();
    } catch (err) {
      alert(err?.message);
    } finally {
      setPending(false);
    }
  };

  const change = () =>
    run(async () => {
      if (pickedJoinsClass) {
        await updateStudy({
          variables: {
            id: picked.id,
            input: { classes: { connect: [{ id: boardClass.id }] } },
          },
        });
      }
      await updateBoard({
        variables: {
          id: board.id,
          input: {
            study: { connect: { id: picked.id } },
            ...(study?.id &&
              board.studyMain?.id === study.id && {
                studyMain: { connect: { id: picked.id } },
              }),
          },
        },
        refetchQueries: BOARD_LINK_REFETCH,
        awaitRefetchQueries: true,
      });
    });

  const unlink = () =>
    run(() =>
      updateBoard({
        variables: {
          id: board.id,
          input: {
            study: { disconnect: true },
            ...(board.studyMain?.id === study?.id && {
              studyMain: { disconnect: true },
            }),
          },
        },
        refetchQueries: BOARD_LINK_REFETCH,
        awaitRefetchQueries: true,
      })
    );

  const actionButtons =
    canChange && !mode ? (
      <span style={BOARD_ACTIONS_STYLE}>
        <Button variant="text" style={ROW_BUTTON_STYLE} onClick={() => setMode("change")}>
          {study?.id
            ? t("studyOptions.change", {}, { default: "Change" })
            : t("linkedBoard.connect", {}, { default: "Connect" })}
        </Button>
        {study?.id && (
          <Button variant="text" style={ROW_BUTTON_STYLE} onClick={() => setMode("unlink")}>
            {t("studyOptions.unlink", {}, { default: "Unlink" })}
          </Button>
        )}
      </span>
    ) : null;

  return (
    <div style={SECTION_STYLE}>
      <SettingRow
        label={t("studyOptions.linkedStudy", {}, { default: "Linked study" })}
        value={
          study?.id
            ? study.title || untitledStudy
            : t("studyOptions.none", {}, { default: "None" })
        }
        actions={actionButtons}
      />

      {mode === "unlink" && (
        <>
          <MessageCard
            variant="warning"
            showIcon={false}
            message={t("linkedBoard.unlinkInfo", {}, {
              default:
                "Unlink this study from the board? The study and the board are kept; only the link is removed.",
            })}
          />
          <div style={ROW_ACTIONS_STYLE}>
            <Button variant="text" disabled={pending} onClick={close}>
              {t("project.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button variant="filled" disabled={pending} onClick={unlink}>
              {t("studyOptions.unlink", {}, { default: "Unlink" })}
            </Button>
          </div>
        </>
      )}

      {mode === "change" && (
        <>
          {studies.length === 0 ? (
            <p className="MH-Type-Body-Small" style={NOTE_STYLE}>
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
              options={studies.map((s) => ({
                value: s.id,
                labelText: s.title || untitledStudy,
                searchText: s.proposal
                  .map((p) => p.title)
                  .filter(Boolean)
                  .join(" "),
                label: (
                  <span style={OPTION_STYLE}>
                    <span>{s.title || untitledStudy}</span>
                    {s.proposal.length > 0 && (
                      <span style={OPTION_CHIPS_STYLE}>
                        {s.proposal.map((p) => (
                          <Chip
                            key={p.id}
                            variant="static"
                            tone="default"
                            style={OPTION_CHIP_STYLE}
                            label={t(
                              "linkedBoard.onBoard",
                              { board: p.title || untitledBoard },
                              { default: `On ${p.title || untitledBoard}` }
                            )}
                          />
                        ))}
                      </span>
                    )}
                  </span>
                ),
              }))}
            />
          )}
          {pickedOtherBoards.length > 0 && (
            <MessageCard
              variant="warning"
              showIcon={false}
              message={t(
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
            />
          )}
          {pickedJoinsClass && (
            <p className="MH-Type-Body-Small" style={NOTE_STYLE}>
              {t("linkedBoard.joinsClass", { class: boardClass.title }, {
                default: `This study also joins ${boardClass.title}, so its teachers can follow it.`,
              })}
            </p>
          )}
          <div style={ROW_ACTIONS_STYLE}>
            <Button variant="text" disabled={pending} onClick={close}>
              {t("project.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button
              variant="filled"
              disabled={pending || !picked}
              onClick={change}
            >
              {study?.id
                ? t("linkedBoard.switchConfirm", {}, { default: "Switch" })
                : t("linkedBoard.connect", {}, { default: "Connect" })}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
