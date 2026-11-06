import { gql, useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import LinkClass from "../../../Builder/Project/Navigation/ConnectStudy/LinkClass";
import IconButton from "../../../DesignSystem/IconButton";
import { LinkOffIcon, OpenInNewIcon } from "../../../DesignSystem/Icons";
import { UPDATE_PROJECT_BOARD } from "../../../Mutations/Proposal";
import { UPDATE_STUDY } from "../../../Mutations/Study";
import { MY_STUDY, STUDY_PROPOSALS_QUERY } from "../../../Queries/Study";

// The study's classes and project boards, with what's needed to decide who
// may unlink each board (board owner, or staff of the board's class).
export const STUDY_LINKS = gql`
  query STUDY_LINKS($id: ID!) {
    study(where: { id: $id }) {
      id
      classes {
        id
      }
      proposal {
        id
        title
        author {
          id
          username
        }
        creator {
          id
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
  }
`;

const isClassStaff = (cls, userId) =>
  !!cls &&
  (cls.creator?.id === userId ||
    (cls.teachingTeam || []).some((p) => p?.id === userId) ||
    (cls.mentors || []).some((p) => p?.id === userId));

// A student may unlink only boards they own; class staff may unlink any board
// of their class.
export const canUnlinkBoard = (board, userId) =>
  !!userId &&
  (board?.author?.id === userId ||
    board?.creator?.id === userId ||
    isClassStaff(board?.usedInClass, userId));

const SECTION_STYLE = { display: "flex", flexDirection: "column", gap: 8 };
const ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  minHeight: 40,
};
const ICON = { width: "20px", height: "20px" };

export default function Links({ user, study }) {
  const { t } = useTranslation("builder");
  const [pendingId, setPendingId] = useState(null);

  const { data } = useQuery(STUDY_LINKS, {
    variables: { id: study?.id },
    skip: !study?.id,
  });
  const refetchQueries = [
    { query: STUDY_LINKS, variables: { id: study?.id } },
    { query: MY_STUDY, variables: { id: study?.id } },
    { query: STUDY_PROPOSALS_QUERY, variables: { id: study?.id } },
  ];
  const [updateStudy] = useMutation(UPDATE_STUDY, { refetchQueries });
  const [updateBoard] = useMutation(UPDATE_PROJECT_BOARD, { refetchQueries });

  const classes = data?.study?.classes || [];
  const boards = data?.study?.proposal || [];
  const untitled = t("studyOptions.untitledBoard", {}, {
    default: "Untitled board",
  });

  // Saved as soon as it changes: the popover has no save button.
  const changeClasses = ({ target: { value } }) =>
    updateStudy({
      variables: {
        id: study.id,
        input: {
          classes: { set: (value || []).map((cl) => ({ id: cl.id })) },
        },
      },
    }).catch((err) => alert(err?.message));

  const unlink = async (board) => {
    const name = board.title || untitled;
    const ok = window.confirm(
      t("studyOptions.unlinkConfirm", { board: name }, {
        default: `Unlink this study from "${name}"? The study and the board are kept; only the link between them is removed.`,
      })
    );
    if (!ok) return;
    setPendingId(board.id);
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
      setPendingId(null);
    }
  };

  return (
    <>
      <div style={SECTION_STYLE}>
        <h2 className="MH-Type-Title-Small" style={{ margin: 0 }}>
          {t("connectStudyModal.linkedClass", {}, { default: "Linked class" })}
        </h2>
        <LinkClass study={{ classes }} handleChange={changeClasses} portal />
      </div>

      <div style={SECTION_STYLE}>
        <h2 className="MH-Type-Title-Small" style={{ margin: 0 }}>
          {t("connectStudyModal.linkedProjects", {}, {
            default: "Linked projects",
          })}
        </h2>
        {!boards.length && (
          <p className="MH-Type-Body-Small" style={{ margin: 0 }}>
            {t("studyOptions.noLinkedProjects", {}, {
              default: "This study is not linked to any project.",
            })}
          </p>
        )}
        {boards.map((board) => {
          const name = board.title || untitled;
          const owner =
            board.author?.id && board.author.id !== user?.id
              ? board.author.username
              : null;
          const openLabel = t("connectStudyModal.openInNewTab", {}, {
            default: "Open in a new tab",
          });
          const unlinkLabel = t("studyOptions.unlinkFromBoard", { board: name }, {
            default: `Unlink from "${name}"`,
          });
          return (
            <div key={board.id} style={ROW_STYLE}>
              <span
                className="MH-Type-Label-Base"
                style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
              >
                {name}
                {owner && (
                  <span style={{ color: "var(--MH-Theme-Neutrals-Dark)" }}>
                    {" "}
                    · {owner}
                  </span>
                )}
              </span>
              <Link
                href={{
                  pathname: "/builder/projects",
                  query: { selector: board.id },
                }}
                target="_blank"
                aria-label={openLabel}
                title={openLabel}
                style={{ display: "flex", padding: 8, color: "inherit" }}
              >
                <OpenInNewIcon style={ICON} />
              </Link>
              {canUnlinkBoard(board, user?.id) && (
                <IconButton
                  variant="subtle"
                  elevated={false}
                  ariaLabel={unlinkLabel}
                  title={unlinkLabel}
                  disabled={pendingId === board.id}
                  icon={<LinkOffIcon style={ICON} />}
                  onClick={() => unlink(board)}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
