import { gql, useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import LinkClass from "../../../Builder/Project/Navigation/ConnectStudy/LinkClass";
import StudyDropdown from "../../../Projects/StudyConnector/StudyDropdown";
import Button from "../../../DesignSystem/Button";
import Modal from "../../../DesignSystem/Modal";
import { LinkOffIcon } from "../../../DesignSystem/Icons";
import { UPDATE_PROJECT_BOARD } from "../../../Mutations/Proposal";
import { UPDATE_STUDY } from "../../../Mutations/Study";
import { GET_PROJECT_STUDY, PROPOSAL_QUERY } from "../../../Queries/Proposal";
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

// Read-only by default: the user first reads what the link does, then opts in
// to edit, and the change is only saved when they confirm it.
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

  const explanation = t("studyOptions.linkedClassInfo", {}, {
    default:
      "Linking this study to a class shares it with that class: the class's teachers can follow and review it, and the class's settings (such as available data sources) apply to it. Removing the class takes the study out of that class.",
  });

  return (
    <div style={SECTION_STYLE}>
      <h2 className="MH-Type-Title-Small" style={TITLE_STYLE}>
        {t("connectStudyModal.linkedClass", {}, { default: "Linked class" })}
      </h2>

      {!editing ? (
        <>
          <p className="MH-Type-Body-Base" style={{ margin: 0 }}>
            {classes.length
              ? classes.map((cl) => cl.title).join(", ")
              : t("linkClass.notLinked", {}, {
                  default: "Not linked to a class",
                })}
          </p>
          <Button
            variant="subtle"
            disabled={!study?.id}
            onClick={startEditing}
          >
            {t("studyOptions.changeLinkedClass", {}, {
              default: "Change linked class",
            })}
          </Button>
        </>
      ) : (
        <>
          <p className="MH-Type-Body-Small" style={NOTE_STYLE}>
            {explanation}
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
  query BOARD_STUDY_LINK($id: ID!) {
    proposalBoard(where: { id: $id }) {
      id
      author {
        id
      }
      creator {
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

export function LinkedStudy({ user, project }) {
  const { t } = useTranslation("builder");
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data } = useQuery(BOARD_STUDY_LINK, {
    variables: { id: project?.id },
    skip: !project?.id,
  });
  const [updateBoard] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [
      { query: BOARD_STUDY_LINK, variables: { id: project?.id } },
      { query: PROPOSAL_QUERY, variables: { id: project?.id } },
      { query: GET_PROJECT_STUDY, variables: { id: project?.id } },
    ],
  });

  const board = data?.proposalBoard;
  if (!board) return null;
  const study = board.study;
  const canManage = canManageBoardStudy(board, user?.id);

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
      });
    } catch (err) {
      alert(err?.message);
    } finally {
      setPending(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div style={SECTION_STYLE}>
      <h2 className="MH-Type-Title-Small" style={TITLE_STYLE}>
        {t("studyOptions.linkedStudy", {}, { default: "Linked study" })}
      </h2>
      {canManage ? (
        <>
          <StudyDropdown user={user} project={{ ...project, study }} />
          {study?.id && (
            <Button
              variant="subtle"
              disabled={pending}
              leadingIcon={<LinkOffIcon style={ICON} />}
              onClick={() => setConfirmOpen(true)}
            >
              {t("studyOptions.unlinkStudy", {}, {
                default: "Unlink study from this board",
              })}
            </Button>
          )}
        </>
      ) : (
        <p className="MH-Type-Body-Base" style={{ margin: 0 }}>
          {study?.title ||
            t("project.noStudyConnected", {}, {
              default: "No study connected",
            })}
        </p>
      )}
      <Modal
        open={confirmOpen}
        onClose={() => !pending && setConfirmOpen(false)}
        title={t("studyOptions.unlinkStudy", {}, {
          default: "Unlink study from this board",
        })}
        actions={
          <>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setConfirmOpen(false)}
            >
              {t("project.cancel", {}, { default: "Cancel" })}
            </Button>
            <Button variant="filled" disabled={pending} onClick={unlink}>
              {t("studyOptions.unlink", {}, { default: "Unlink" })}
            </Button>
          </>
        }
      >
        {t("studyOptions.unlinkStudyConfirm", { study: study?.title || "" }, {
          default: `Unlink "${study?.title || ""}" from this board? The study and the board are kept; only the link between them is removed.`,
        })}
      </Modal>
    </div>
  );
}
