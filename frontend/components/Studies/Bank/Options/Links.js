import { gql, useMutation, useQuery } from "@apollo/client";
import { useEffect, useRef, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import LinkClass from "../../../Builder/Project/Navigation/ConnectStudy/LinkClass";
import Button from "../../../DesignSystem/Button";
import { UPDATE_STUDY } from "../../../Mutations/Study";
import { MY_STUDY, STUDY_PROPOSALS_QUERY } from "../../../Queries/Study";
import BoardLinkClass from "../../../Builder/Project/Navigation/Connect/LinkClass";
import MessageCard from "../../../DesignSystem/MessageCard";
import { UPDATE_PROJECT_BOARD } from "../../../Mutations/Proposal";
import { PROPOSAL_QUERY } from "../../../Queries/Proposal";
import { boardRuleMessage } from "../../../../lib/mainProject";
import { BOARD_FOR_LINKS } from "../../../Builder/shared/StudyBoardLinks/queries";

const SECTION_STYLE = { display: "flex", flexDirection: "column", gap: 8 };

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
// `autoEdit`: open straight in edit mode (the study's "Connect to class"
// prompt opens Settings on this row).
export function LinkedClass({ study, autoEdit = false }) {
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

  // Once per request: a refetch after saving must not reopen the editor.
  const autoEdited = useRef(false);
  useEffect(() => {
    if (!autoEdit) {
      autoEdited.current = false;
      return;
    }
    if (data?.study && !autoEdited.current) {
      autoEdited.current = true;
      startEditing();
    }
  }, [autoEdit, data?.study]); // eslint-disable-line react-hooks/exhaustive-deps

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
/* Project board tab: the class the board is used in                   */
/* ------------------------------------------------------------------ */

const NOT_CONNECTED = "$$$-class-not-connected-$$$";

// The board's class, read-only until the user opts in. The class rules
// (main project, submitted work) are explained by LinkClass and enforced by
// the server (keystone/lib/mainProject.js), whose refusal is shown here.
export function LinkedBoardClass({ user, project }) {
  const { t } = useTranslation("builder");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const { data } = useQuery(BOARD_FOR_LINKS, {
    variables: { boardId: project?.id },
    skip: !project?.id,
  });
  const [updateBoard, { loading }] = useMutation(UPDATE_PROJECT_BOARD);

  const board = data?.proposalBoard;
  if (!board) return null;
  const savedId = board.usedInClass?.id || NOT_CONNECTED;
  const draftId = draft?.usedInClass?.id || NOT_CONNECTED;

  const cancel = () => {
    setEditing(false);
    setDraft(null);
    setError(null);
  };

  const save = async () => {
    try {
      setError(null);
      await updateBoard({
        variables: {
          id: board.id,
          input: {
            usedInClass:
              draftId !== NOT_CONNECTED
                ? { connect: { id: draftId } }
                : { disconnect: true },
          },
        },
        refetchQueries: [
          "BOARD_FOR_LINKS",
          "STUDY_BOARD_LINKS",
          { query: PROPOSAL_QUERY, variables: { id: board.id } },
        ],
        awaitRefetchQueries: true,
      });
      cancel();
    } catch (err) {
      setError(boardRuleMessage(err));
    }
  };

  return (
    <div style={SECTION_STYLE}>
      <SettingRow
        label={t("studyOptions.class", {}, { default: "Class" })}
        value={board.usedInClass?.title || t("studyOptions.none", {}, { default: "None" })}
        actionLabel={editing ? null : t("studyOptions.change", {}, { default: "Change" })}
        onAction={() => {
          setDraft({ id: board.id, usedInClass: board.usedInClass });
          setEditing(true);
        }}
      />
      {editing && (
        <>
          <BoardLinkClass
            project={draft}
            user={user}
            handleChange={({ target: { value } }) =>
              setDraft((prev) => ({ ...prev, usedInClass: value }))
            }
          />
          {error && <MessageCard variant="warning" message={error} />}
          <div style={ACTIONS_STYLE}>
            <Button variant="text" disabled={loading} onClick={cancel}>
              {t("project.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button
              variant="filled"
              disabled={loading || draftId === savedId}
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
