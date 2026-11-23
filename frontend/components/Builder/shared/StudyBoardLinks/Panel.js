import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Checkbox from "../../../DesignSystem/Checkbox";
import Chip from "../../../DesignSystem/Chip";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import MessageCard from "../../../DesignSystem/MessageCard";
import Tooltip from "../../../DesignSystem/Tooltip";
import AddCollaboratorModal from "../../Project/ProjectBoard/Board/Builder/AddCollaboratorModal";
import { UPDATE_PROJECT_BOARD } from "../../../Mutations/Proposal";
import { UPDATE_STUDY } from "../../../Mutations/Study";
import {
  canActOnBoard,
  canActOnLink,
  canActOnStudy,
  canManagePeople,
  isBoardStaff,
  isOnBoard,
  isOnStudy,
  isStudyStaff,
  peopleWithRoles,
  staffedStudyClassIds,
  studyClassIds,
  unlinkConsequences,
  viaBoardPeople,
} from "../../../../lib/studyBoardLinks";
import {
  BOARD_FOR_LINKS,
  LINKABLE_BOARDS,
  LINKABLE_STUDIES,
  STUDY_BOARD_LINKS,
  STUDY_BOARD_LINKS_REFETCH,
} from "./queries";

// The links between a study and its project boards, with the people on each.
// - context "board" (boardId): the board's study, then the other boards on
//   that study.
// - context "study" (studyId): the study's boards, then the study's people.
// People on an object act on it; class staff act on every link of their
// classes; everything else is read-only (lib/studyBoardLinks.js).

const boardHref = (id) => `/builder/projects?selector=${id}`;
const studyHref = (id) => `/builder/studies?selector=${id}`;

const UNLINK_DEFAULTS = {
  kept: "Remove the study from this board. The study and the board are both kept.",
  studyMain: "Clear the board's main study.",
  loseAccess:
    "Remove study edit access for: {{people}} (on this board, not study collaborators).",
  mainProject:
    "This board stays its students' main project, without a study.",
  datasets:
    "{{count}} data journal dataset(s) on this board keep reading this study's data.",
  dataCollection:
    "The study's data-collection stage stays as it is. If this board was its only supervised link, a teacher can reopen it.",
};

const ROLE_DEFAULTS = {
  owner: "Owner",
  creator: "Creator",
  collaborator: "Collaborator",
};

export default function StudyBoardLinksPanel({
  user,
  studyId: studyIdProp,
  boardId,
  // Study view inside a board's builder: that board, whose "Open" goes to it
  // in this tab instead of a new one.
  currentBoardId,
  // Called after the context board's study changed (switched or unlinked),
  // e.g. so the builder reloads on it.
  onContextBoardChanged,
  // Builder only: unsaved edits are lost if the builder reloads.
  hasUnsavedChanges = false,
  refetchQueries = [],
}) {
  const { t } = useTranslation("builder");
  const [action, setAction] = useState(null);
  const [pending, setPending] = useState(false);
  // { kind, object } whose collaborators are being managed.
  const [peopleFor, setPeopleFor] = useState(null);

  const { data: boardData } = useQuery(BOARD_FOR_LINKS, {
    variables: { boardId },
    skip: !boardId,
  });
  const contextBoard = boardData?.proposalBoard || null;
  const studyId = boardId ? contextBoard?.study?.id : studyIdProp;

  const { data: studyData } = useQuery(STUDY_BOARD_LINKS, {
    variables: { studyId },
    skip: !studyId,
  });
  const study = studyId ? studyData?.study || null : null;

  const [updateBoard] = useMutation(UPDATE_PROJECT_BOARD);
  const [updateStudy] = useMutation(UPDATE_STUDY);

  const untitledBoard = t("linkedBoard.untitledBoard", {}, {
    default: "Untitled project board",
  });
  const untitledStudy = t("linkedBoard.untitledStudy", {}, {
    default: "Untitled study",
  });

  if (boardId && !contextBoard) return null;
  if (studyId && !study) return null;

  const userId = user?.id;
  const boards = study?.proposal || [];
  const otherBoards = boards.filter((b) => b.id !== boardId);
  const refetch = [...STUDY_BOARD_LINKS_REFETCH, ...refetchQueries];

  const run = async (work, { contextChanged = false } = {}) => {
    setPending(true);
    try {
      await work();
      setAction(null);
      if (contextChanged) onContextBoardChanged?.();
    } catch (err) {
      alert(err?.message);
    } finally {
      setPending(false);
    }
  };

  /* ------------------------------ actions ------------------------------ */

  const unlink = (board) =>
    run(
      () =>
        updateBoard({
          variables: {
            id: board.id,
            input: {
              study: { disconnect: true },
              ...(board.studyMain?.id === study.id && {
                studyMain: { disconnect: true },
              }),
            },
          },
          refetchQueries: refetch,
          awaitRefetchQueries: true,
        }),
      { contextChanged: board.id === boardId }
    );

  // Saves the collaborator modal's changes on a board or a study.
  const saveCollaborators = ({ kind, object }) => ({ connect, disconnect }) => {
    const mutate = kind === "board" ? updateBoard : updateStudy;
    return mutate({
      variables: { id: object.id, input: { collaborators: { connect, disconnect } } },
      refetchQueries: refetch,
      awaitRefetchQueries: true,
    });
  };

  // Put `targetStudy` on `board` (replacing its study, if any). The study
  // joins the board's class, the picked people join the study, and the
  // board's main study follows the switch.
  const link = ({ board, targetStudy, targetClassIds, peopleIds }) =>
    run(
      async () => {
        const classId = board.usedInClass?.id;
        const joinsClass = classId && !targetClassIds.includes(classId);
        if (joinsClass || peopleIds.length) {
          await updateStudy({
            variables: {
              id: targetStudy.id,
              input: {
                ...(joinsClass && { classes: { connect: [{ id: classId }] } }),
                ...(peopleIds.length && {
                  collaborators: { connect: peopleIds.map((id) => ({ id })) },
                }),
              },
            },
          });
        }
        const replaced = board.study?.id;
        await updateBoard({
          variables: {
            id: board.id,
            input: {
              study: { connect: { id: targetStudy.id } },
              ...(replaced &&
                board.studyMain?.id === replaced && {
                  studyMain: { connect: { id: targetStudy.id } },
                }),
            },
          },
          refetchQueries: refetch,
          awaitRefetchQueries: true,
        });
      },
      { contextChanged: board.id === boardId }
    );

  /* ------------------------------ pieces ------------------------------- */

  const roleLabel = (role) =>
    t(`studyBoardLinks.role.${role}`, {}, { default: ROLE_DEFAULTS[role] });

  const isActive = (type, key) => action?.type === type && action?.key === key;

  // One list of the object's people with their role tags. Staff manage the
  // collaborators in the collaborator modal ("+ Add people").
  const people = ({ kind, object, canManage }) => (
    <div className="people">
      {peopleWithRoles(object).map(({ person, roles }) => (
        <Tooltip key={person.id} content={roles.map(roleLabel).join(" · ")}>
          <Chip
            variant="static"
            tone="neutral"
            label={
              person.id === userId
                ? `${person.username} ${t("studyBoardLinks.you", {}, { default: "(you)" })}`
                : person.username
            }
          />
        </Tooltip>
      ))}
      {canManage && !action && (
        <button
          type="button"
          className="linkButton"
          onClick={() => setPeopleFor({ kind, object })}
        >
          {t("studyBoardLinks.addPeople", {}, { default: "+ Add people" })}
        </button>
      )}
    </div>
  );

  // Whose members the collaborator modal offers: the object's class(es) —
  // for staff, the ones they teach — or, without a class, the viewer's own.
  const peopleClassIds = ({ kind, object }) => {
    if (kind === "board" && object.usedInClass?.id) return [object.usedInClass.id];
    if (kind === "study") {
      const staffed = staffedStudyClassIds(object, user);
      if (staffed.length) return staffed;
      const own = [...studyClassIds(object)];
      if (own.length) return own;
    }
    return [
      ...(user?.studentIn || []),
      ...(user?.teacherIn || []),
      ...(user?.teachingTeamIn || []),
      ...(user?.mentorIn || []),
    ].map((c) => c?.id).filter(Boolean);
  };

  const peopleModal = peopleFor ? (
    <AddCollaboratorModal
      proposal={peopleFor.object}
      user={user}
      onClose={() => setPeopleFor(null)}
      classIds={peopleClassIds(peopleFor)}
      showMainWarning={peopleFor.kind === "board"}
      aboveModal
      title={
        peopleFor.kind === "board"
          ? t("studyBoardLinks.boardPeopleTitle", { title: peopleFor.object.title || untitledBoard }, {
              default: "Collaborators of “{{title}}”",
            })
          : t("studyBoardLinks.studyPeopleTitle", { title: peopleFor.object.title || untitledStudy }, {
              default: "Collaborators of “{{title}}”",
            })
      }
      saveCollaborators={saveCollaborators(peopleFor)}
    />
  ) : null;

  // The board's main flags as one "Marked as main" chip: the students' main
  // project (isMain) or the study's main board (proposalMain).
  const boardChips = (board) =>
    board.isMain || study?.proposalMain?.id === board.id
      ? [
          <Chip key="main" variant="static" tone="info" style={STATIC}
            label={t("studyBoardLinks.markedAsMain", {}, { default: "Marked as main" })} />,
        ]
      : [];

  // "Board title (Template title)": the template the board was made from.
  const boardTitle = (board) => (
    <span className="MH-Type-Body-Base">
      {board.title || untitledBoard}
      {board.clonedFrom?.title && (
        <span className="note"> ({board.clonedFrom.title})</span>
      )}
    </span>
  );

  const boardRow = (board) => {
    const canUnlink = canActOnLink({ study, board, user });
    const canOpen = isOnBoard(board, userId) || isBoardStaff(board, user) || isStudyStaff(study, user);
    const key = `unlink:${board.id}`;
    return (
      <li className="item" key={board.id}>
        <div className="itemHead">
          <div className="itemTitle">
            {boardTitle(board)}
            {boardChips(board).length > 0 && (
              <span className="chips">{boardChips(board)}</span>
            )}
          </div>
          {!action && (
            <span className="itemActions">
              {canOpen && board.id !== boardId && (
                <Button
                  variant="text"
                  style={ROW_BUTTON}
                  onClick={() =>
                    board.id === currentBoardId
                      ? window.location.assign(boardHref(board.id))
                      : window.open(boardHref(board.id), "_blank", "noopener")
                  }
                >
                  {t("studyBoardLinks.open", {}, { default: "Open ↗" })}
                </Button>
              )}
              {canUnlink && (
                <Button variant="text" style={ROW_BUTTON} onClick={() => setAction({ type: "unlink", key, board })}>
                  {t("studyOptions.unlink", {}, { default: "Unlink" })}
                </Button>
              )}
            </span>
          )}
        </div>
        {people({ kind: "board", object: board, canManage: canManagePeople({ kind: "board", object: board, user }) })}
        {isActive("unlink", key) && (
          <Confirm
            title={t(
              "studyBoardLinks.unlinkTitle",
              { study: study.title || untitledStudy, board: board.title || untitledBoard },
              { default: "Unlink “{{study}}” from “{{board}}”?" }
            )}
            intro={t("studyBoardLinks.thisWill", {}, { default: "This will:" })}
            items={unlinkConsequences({ study, board, boards }).map(({ key: k, params }) =>
              t(`studyBoardLinks.unlinkConsequence.${k}`, params, {
                default: UNLINK_DEFAULTS[k],
              })
            )}
            warning={
              board.id === boardId && hasUnsavedChanges
                ? t("linkedBoard.unsaved", {}, {
                    default: "Save your changes first: unsaved edits are lost when the builder reopens.",
                  })
                : null
            }
            confirmLabel={t("studyOptions.unlink", {}, { default: "Unlink" })}
            pending={pending}
            onCancel={() => setAction(null)}
            onConfirm={() => unlink(board)}
          />
        )}
      </li>
    );
  };

  // Students see other people's boards read-only, with a pointer to their
  // teacher.
  const seesOthersBoards =
    boards.some((b) => !isOnBoard(b, userId)) &&
    !isStudyStaff(study, user) &&
    !boards.some((b) => isBoardStaff(b, user));
  const notice = seesOthersBoards ? (
    <p className="MH-Type-Body-Small note">
      {t("studyBoardLinks.studentNotice", {}, {
        default: "Something look out of place? Reach out to your teacher.",
      })}
    </p>
  ) : null;

  const connectBoardButton =
    study && canActOnStudy(study, user) && !action ? (
      <Button variant="filled" onClick={() => setAction({ type: "connectBoard", key: "connect" })}>
        {boards.length
          ? t("studyBoardLinks.connectAnother", {}, { default: "+ Connect another board" })
          : t("studyBoardLinks.connectBoard", {}, { default: "+ Connect a board" })}
      </Button>
    ) : null;

  const connectBoardForm =
    study && isActive("connectBoard", "connect") ? (
      <ConnectBoard
        user={user}
        study={study}
        linkedIds={boards.map((b) => b.id)}
        pending={pending}
        untitledBoard={untitledBoard}
        untitledStudy={untitledStudy}
        onCancel={() => setAction(null)}
        onConnect={({ board, peopleIds }) =>
          link({
            board,
            targetStudy: study,
            targetClassIds: study.classes.map((c) => c.id),
            peopleIds,
          })
        }
      />
    ) : null;

  /* ----------------------------- board view ---------------------------- */

  if (boardId) {
    const canChange = canActOnBoard(contextBoard, user);
    const changeForm = isActive("changeStudy", "change") ? (
      <ChangeStudy
        user={user}
        board={contextBoard}
        currentStudyId={study?.id}
        pending={pending}
        hasUnsavedChanges={hasUnsavedChanges}
        untitledBoard={untitledBoard}
        untitledStudy={untitledStudy}
        onCancel={() => setAction(null)}
        onConnect={({ targetStudy, peopleIds }) =>
          link({
            board: contextBoard,
            targetStudy,
            targetClassIds: targetStudy.classes.map((c) => c.id),
            peopleIds,
          })
        }
      />
    ) : null;
    const contextLinked = study ? boards.find((b) => b.id === boardId) : null;

    return (
      <StyledPanel>
        <section>
          <h3 className="MH-Type-Title-Small">
            {t("studyBoardLinks.thisBoard", {}, { default: "This board" })}
          </h3>
          <div className="item">
            <div className="itemTitle">
              {boardTitle(contextBoard)}
              {boardChips(contextBoard).length > 0 && (
                <span className="chips">{boardChips(contextBoard)}</span>
              )}
            </div>
            {people({
              kind: "board",
              object: contextBoard,
              canManage: canManagePeople({ kind: "board", object: contextBoard, user }),
            })}
          </div>
        </section>
        <section>
          <h3 className="MH-Type-Title-Small">
            {t("studyOptions.linkedStudy", {}, { default: "Linked study" })}
          </h3>
          {!study ? (
            <div className="item">
              <div className="itemHead">
                <span className="MH-Type-Body-Base">
                  {t("studyOptions.none", {}, { default: "None" })}
                </span>
                {canChange && !action && (
                  <Button variant="text" style={ROW_BUTTON} onClick={() => setAction({ type: "changeStudy", key: "change" })}>
                    {t("linkedBoard.connect", {}, { default: "Connect" })}
                  </Button>
                )}
              </div>
              {changeForm}
            </div>
          ) : (
            <div className="item">
              <div className="itemHead">
                <div className="itemTitle">
                  <span className="MH-Type-Body-Base">{study.title || untitledStudy}</span>
                </div>
                {!action && (
                  <span className="itemActions">
                    {(isOnStudy(study, userId) || isStudyStaff(study, user)) && (
                      <Button variant="text" style={ROW_BUTTON} onClick={() => window.open(studyHref(study.id), "_blank", "noopener")}>
                        {t("studyBoardLinks.open", {}, { default: "Open ↗" })}
                      </Button>
                    )}
                    {canChange && (
                      <Button variant="text" style={ROW_BUTTON} onClick={() => setAction({ type: "changeStudy", key: "change" })}>
                        {t("studyOptions.change", {}, { default: "Change" })}
                      </Button>
                    )}
                    {contextLinked && canActOnLink({ study, board: contextLinked, user }) && (
                      <Button variant="text" style={ROW_BUTTON} onClick={() => setAction({ type: "unlink", key: `unlink:${boardId}`, board: contextLinked })}>
                        {t("studyOptions.unlink", {}, { default: "Unlink" })}
                      </Button>
                    )}
                  </span>
                )}
              </div>
              {people({ kind: "study", object: study, canManage: canManagePeople({ kind: "study", object: study, user }) })}
              {changeForm}
              {contextLinked && isActive("unlink", `unlink:${boardId}`) && (
                <Confirm
                  title={t(
                    "studyBoardLinks.unlinkTitle",
                    { study: study.title || untitledStudy, board: contextLinked.title || untitledBoard },
                    { default: "Unlink “{{study}}” from “{{board}}”?" }
                  )}
                  intro={t("studyBoardLinks.thisWill", {}, { default: "This will:" })}
                  items={unlinkConsequences({ study, board: contextLinked, boards }).map(({ key: k, params }) =>
                    t(`studyBoardLinks.unlinkConsequence.${k}`, params, { default: UNLINK_DEFAULTS[k] })
                  )}
                  warning={
                    hasUnsavedChanges
                      ? t("linkedBoard.unsaved", {}, {
                          default: "Save your changes first: unsaved edits are lost when the builder reopens.",
                        })
                      : null
                  }
                  confirmLabel={t("studyOptions.unlink", {}, { default: "Unlink" })}
                  pending={pending}
                  onCancel={() => setAction(null)}
                  onConfirm={() => unlink(contextLinked)}
                />
              )}
            </div>
          )}
        </section>

        {study && (
          <section>
            <h3 className="MH-Type-Title-Small">
              {t("studyBoardLinks.alsoOnStudy", { count: otherBoards.length }, {
                default: "Also on this study ({{count}} boards)",
              })}
            </h3>
            {otherBoards.length > 0 ? (
              <ul className="list">{otherBoards.map(boardRow)}</ul>
            ) : (
              <p className="MH-Type-Body-Small note">
                {t("studyBoardLinks.noOtherBoards", {}, {
                  default: "No other board uses this study.",
                })}
              </p>
            )}
            {notice}
            {connectBoardButton}
            {connectBoardForm}
          </section>
        )}
        {peopleModal}
      </StyledPanel>
    );
  }

  /* ----------------------------- study view ---------------------------- */

  const via = viaBoardPeople(study, boards);
  return (
    <StyledPanel>
      <section>
        <h3 className="MH-Type-Title-Small">
          {t("studyBoardLinks.projectBoards", { count: boards.length }, {
            default: "Project boards ({{count}})",
          })}
        </h3>
        {boards.length > 0 ? (
          <ul className="list">{boards.map(boardRow)}</ul>
        ) : (
          <p className="MH-Type-Body-Small note">
            {t("studyBoardLinks.noBoards", {}, {
              default: "This study is not on any project board.",
            })}
          </p>
        )}
        {notice}
        {connectBoardButton}
        {connectBoardForm}
      </section>

      <section>
        <h3 className="MH-Type-Title-Small">
          {t("studyBoardLinks.studyPeople", {}, { default: "People on this study" })}
        </h3>
        {people({ kind: "study", object: study, canManage: canManagePeople({ kind: "study", object: study, user }) })}
        {via.length > 0 && (
          <p className="MH-Type-Label-Small note subhead">
            {t("studyBoardLinks.viaBoardHeader", {}, {
              default: "Access through a linked project board",
            })}
          </p>
        )}
        {via.length > 0 && (
          <div className="people">
            {via.map(({ person, boards: viaBoards }) => (
              <Tooltip
                key={person.id}
                content={t(
                  "studyBoardLinks.viaBoard",
                  { boards: viaBoards.map((b) => b.title || untitledBoard).join(", ") },
                  { default: "Via board · {{boards}}" }
                )}
              >
                <Chip variant="static" tone="neutral" label={person.username} />
              </Tooltip>
            ))}
          </div>
        )}
      </section>
      {peopleModal}
    </StyledPanel>
  );
}

/* ------------------------------------------------------------------------ */

function Confirm({ title, intro, items, warning, confirmLabel, pending, onCancel, onConfirm }) {
  const { t } = useTranslation("builder");
  return (
    <div className="confirm" role="group" aria-label={title}>
      <p className="MH-Type-Label-Base confirmTitle">{title}</p>
      {intro && <p className="MH-Type-Body-Small">{intro}</p>}
      <ul className="MH-Type-Body-Small confirmList">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {warning && <MessageCard variant="warning" showIcon={false} message={warning} />}
      <div className="formActions">
        <Button variant="text" disabled={pending} onClick={onCancel}>
          {t("project.cancel", {}, { default: "Cancel" })}
        </Button>
        <Button variant="filled" disabled={pending} onClick={onConfirm}>
          {pending ? t("header.saving", {}, { default: "Saving" }) : confirmLabel}
        </Button>
      </div>
    </div>
  );
}

/**
 * The board's people the teacher may add to the study as collaborators. Only
 * the board's author is ticked by default.
 */
function PeoplePicker({ board, study, value, onChange }) {
  const { t } = useTranslation("builder");
  const onStudy = new Set(
    [study?.author?.id, ...(study?.collaborators || []).map((c) => c.id)].filter(Boolean)
  );
  const candidates = [board?.author, ...(board?.collaborators || [])].filter(
    (p, i, all) => p?.id && all.findIndex((x) => x?.id === p.id) === i && !onStudy.has(p.id)
  );
  if (!candidates.length) return null;
  return (
    <div className="picker">
      <p className="MH-Type-Body-Small">
        {t("studyBoardLinks.addToStudy", {}, {
          default: "Also add to the study's collaborators:",
        })}
      </p>
      {candidates.map((person) => (
        <label key={person.id} className="pickerRow MH-Type-Body-Small">
          <Checkbox
            checked={value.includes(person.id)}
            ariaLabel={person.username}
            onChange={(next) =>
              onChange(next ? [...value, person.id] : value.filter((id) => id !== person.id))
            }
          />
          {person.username}
        </label>
      ))}
    </div>
  );
}

const defaultPeople = (board, study) => {
  const authorId = board?.author?.id;
  const onStudy =
    authorId &&
    (study?.author?.id === authorId ||
      (study?.collaborators || []).some((c) => c.id === authorId));
  return authorId && !onStudy ? [authorId] : [];
};

/** Study view: connect one more board to the study. */
function ConnectBoard({ user, study, linkedIds, pending, untitledBoard, untitledStudy, onCancel, onConnect }) {
  const { t } = useTranslation("builder");
  const [pickedId, setPickedId] = useState("");
  const [peopleIds, setPeopleIds] = useState([]);
  const classIds = staffedStudyClassIds(study, user);
  const teacher = isStudyStaff(study, user);
  const { data } = useQuery(LINKABLE_BOARDS, {
    variables: { userId: user?.id, classIds },
    skip: !user?.id,
  });
  const options = (data?.proposalBoards || []).filter((b) => !linkedIds.includes(b.id));
  const picked = options.find((b) => b.id === pickedId);
  const replaced = picked?.study && picked.study.id !== study.id ? picked.study : null;
  const joinsClass =
    picked?.usedInClass && !study.classes.some((c) => c.id === picked.usedInClass.id);

  const pick = (id) => {
    setPickedId(id);
    setPeopleIds(defaultPeople(options.find((b) => b.id === id), study));
  };

  return (
    <div className="confirm">
      {options.length === 0 ? (
        <p className="MH-Type-Body-Small note">
          {t("studyBoardLinks.noLinkableBoards", {}, {
            default: "There is no other board you can connect.",
          })}
        </p>
      ) : (
        <DropdownSelect
          portal
          value={pickedId}
          onChange={pick}
          searchableSingle
          searchPlaceholder={t("linkedBoard.searchBoards", {}, { default: "Search boards" })}
          placeholder={t("linkedBoard.chooseBoard", {}, { default: "Choose a project board" })}
          ariaLabel={t("linkedBoard.chooseBoard", {}, { default: "Choose a project board" })}
          options={options.map((b) => ({
            value: b.id,
            labelText: b.title || untitledBoard,
            searchText: [
              b.study?.title,
              b.usedInClass?.title,
              b.author?.username,
              ...(b.collaborators || []).map((c) => c.username),
            ]
              .filter(Boolean)
              .join(" "),
            label: (
              <span style={OPTION}>
                <span>{b.title || untitledBoard}</span>
                <span className="MH-Type-Body-Small" style={OPTION_META}>
                  {[b.author?.username, b.usedInClass?.title].filter(Boolean).join(" · ")}
                </span>
              </span>
            ),
          }))}
        />
      )}
      {replaced && (
        <MessageCard
          variant="warning"
          showIcon={false}
          message={t(
            "linkedBoard.replaceWarning",
            { study: replaced.title || untitledStudy },
            {
              default:
                "This board already has a study: {{study}}. Connecting replaces it on the board (the study itself is kept).",
            }
          )}
        />
      )}
      {joinsClass && (
        <p className="MH-Type-Body-Small note">
          {t("linkedBoard.joinsClass", { class: picked.usedInClass.title }, {
            default: "This study also joins {{class}}, so its teachers can follow it.",
          })}
        </p>
      )}
      {teacher && picked && (
        <PeoplePicker board={picked} study={study} value={peopleIds} onChange={setPeopleIds} />
      )}
      <div className="formActions">
        <Button variant="text" disabled={pending} onClick={onCancel}>
          {t("project.cancel", {}, { default: "Cancel" })}
        </Button>
        <Button
          variant="filled"
          disabled={pending || !picked}
          onClick={() => onConnect({ board: picked, peopleIds: teacher ? peopleIds : [] })}
        >
          {pending
            ? t("header.saving", {}, { default: "Saving" })
            : replaced
            ? t("linkedBoard.replace", {}, { default: "Replace" })
            : t("linkedBoard.connect", {}, { default: "Connect" })}
        </Button>
      </div>
    </div>
  );
}

/** Board view: put a study on the board, or switch it for another. */
function ChangeStudy({
  user,
  board,
  currentStudyId,
  pending,
  hasUnsavedChanges,
  untitledBoard,
  untitledStudy,
  onCancel,
  onConnect,
}) {
  const { t } = useTranslation("builder");
  const [pickedId, setPickedId] = useState("");
  const [peopleIds, setPeopleIds] = useState([]);
  const teacher = isBoardStaff(board, user);
  const classIds = teacher ? [board.usedInClass?.id].filter(Boolean) : [];
  const { data } = useQuery(LINKABLE_STUDIES, {
    variables: { userId: user?.id, classIds },
    skip: !user?.id,
  });
  const options = (data?.studies || []).filter((s) => s.id !== currentStudyId);
  const picked = options.find((s) => s.id === pickedId);
  const onOtherBoards = (picked?.proposal || []).filter((p) => p.id !== board.id);
  const joinsClass =
    picked && board.usedInClass && !picked.classes.some((c) => c.id === board.usedInClass.id);

  const pick = (id) => {
    setPickedId(id);
    setPeopleIds(defaultPeople(board, options.find((s) => s.id === id)));
  };

  return (
    <div className="confirm">
      {options.length === 0 ? (
        <p className="MH-Type-Body-Small note">
          {t("linkedBoard.noOtherStudies", {}, { default: "You have no other study." })}
        </p>
      ) : (
        <DropdownSelect
          portal
          value={pickedId}
          onChange={pick}
          searchableSingle
          searchPlaceholder={t("linkedBoard.searchStudies", {}, { default: "Search studies" })}
          placeholder={t("linkedBoard.chooseStudy", {}, { default: "Choose a study" })}
          ariaLabel={t("linkedBoard.chooseStudy", {}, { default: "Choose a study" })}
          options={options.map((s) => ({
            value: s.id,
            labelText: s.title || untitledStudy,
            searchText: [s.author?.username, ...s.proposal.map((p) => p.title)]
              .filter(Boolean)
              .join(" "),
            label: (
              <span style={OPTION}>
                <span>{s.title || untitledStudy}</span>
                <span className="MH-Type-Body-Small" style={OPTION_META}>
                  {[
                    s.author?.username,
                    ...s.proposal.map((p) => p.title || untitledBoard),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            ),
          }))}
        />
      )}
      {onOtherBoards.length > 0 && (
        <p className="MH-Type-Body-Small note">
          {t(
            "linkedBoard.onOtherBoardWarning",
            { board: onOtherBoards.map((p) => p.title || untitledBoard).join(", ") },
            { default: "This study is already on another board ({{board}}). It will be on both." }
          )}
        </p>
      )}
      {joinsClass && (
        <p className="MH-Type-Body-Small note">
          {t("linkedBoard.joinsClass", { class: board.usedInClass.title }, {
            default: "This study also joins {{class}}, so its teachers can follow it.",
          })}
        </p>
      )}
      {teacher && picked && (
        <PeoplePicker board={board} study={picked} value={peopleIds} onChange={setPeopleIds} />
      )}
      {picked && hasUnsavedChanges && (
        <MessageCard
          variant="warning"
          showIcon={false}
          message={t("linkedBoard.unsaved", {}, {
            default: "Save your changes first: unsaved edits are lost when the builder reopens.",
          })}
        />
      )}
      <div className="formActions">
        <Button variant="text" disabled={pending} onClick={onCancel}>
          {t("project.cancel", {}, { default: "Cancel" })}
        </Button>
        <Button
          variant="filled"
          disabled={pending || !picked}
          onClick={() => onConnect({ targetStudy: picked, peopleIds: teacher ? peopleIds : [] })}
        >
          {pending
            ? t("header.saving", {}, { default: "Saving" })
            : currentStudyId
            ? t("linkedBoard.switchConfirm", {}, { default: "Switch" })
            : t("linkedBoard.connect", {}, { default: "Connect" })}
        </Button>
      </div>
    </div>
  );
}

const STATIC = { pointerEvents: "none" };
// Dropdown menus render in a portal, outside StyledPanel: inline styles.
const OPTION = { display: "flex", flexDirection: "column", gap: 2 };
const OPTION_META = { color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)" };
const ROW_BUTTON = { padding: "8px 12px" };

const StyledPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;

  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  h3,
  p {
    margin: 0;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 8px;
  }

  .itemHead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .itemTitle {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .itemActions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .chips,
  .people {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
  }

  .person {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .linkButton {
    border: 0;
    background: none;
    padding: 2px 4px;
    cursor: pointer;
    color: var(--MH-Theme-Primary-Dark, #336f8a);
    font: inherit;
    font-size: 14px;
  }

  .note {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .subhead {
    margin-top: 8px;
  }

  .confirm {
    flex-basis: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border-radius: 8px;
    background: var(--MH-Theme-Primary-Lighter, #f4f8f7);
  }

  .confirmList {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .formActions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .option {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .picker {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .pickerRow {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;
