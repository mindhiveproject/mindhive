import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { useEffect } from "react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import { CLASS_TEMPLATE_PROJECTS_QUERY } from "../../../../Queries/Proposal";
import { SYNC_CLASS_TEMPLATE_BOARDS } from "../../../../Mutations/Proposal";
import { GET_CLASS } from "../../../../Queries/Classes";
import { isTemplateVisibleToStudents } from "../../../../../lib/classTemplateBoards";
import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import IconButton from "../../../../DesignSystem/IconButton";
import { AddIcon, SettingsIcon } from "../../../../DesignSystem/Icons";
import JustOneSecondNotice from "../../../../DesignSystem/JustOneSecondNotice";

// "Project boards" section of the Settings tab: a grid of the class's boards,
// each with Edit and a settings button (opens the editor with its settings
// popover), plus a "New board" tile that opens the create modal (library copy
// or blank).
export default function ProjectsTemplatePanel({ myclass }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const classId = myclass?.id;
  const code = myclass?.code;

  const refetchQueries = [
    { query: CLASS_TEMPLATE_PROJECTS_QUERY, variables: { classId } },
    // The class's own board list feeds the board row above the tabs.
    { query: GET_CLASS, variables: { code } },
  ];

  const { data, loading } = useQuery(CLASS_TEMPLATE_PROJECTS_QUERY, {
    variables: { classId },
    skip: !classId,
  });

  const [syncClassTemplateBoards, { loading: syncing }] = useMutation(
    SYNC_CLASS_TEMPLATE_BOARDS,
    { refetchQueries }
  );

  useEffect(() => {
    if (!classId) return;
    syncClassTemplateBoards({ variables: { classId } }).catch(() => {});
  }, [classId]);

  const boards = data?.proposalBoards || [];
  const isPending = (loading && !data) || (syncing && boards.length === 0);
  // Same class context the board settings use to resolve copy permission.
  const classContext = { ...myclass, classTemplateBoards: boards };

  const openCreate = () =>
    router.push({
      pathname: `/dashboard/myclasses/${code}`,
      query: { page: "settings", createBoard: "1" },
    });

  const openEditor = (boardId, { withSettings = false } = {}) =>
    router.push({
      pathname: `/dashboard/myclasses/${code}`,
      query: {
        page: "settings",
        editBoard: boardId,
        ...(withSettings ? { boardSettings: "1" } : {}),
      },
    });

  const settingsLabel = t("projects.boardSettingsAndPermissions", {}, {
    default: "Board settings & permissions",
  });

  return (
    <>
      <section className="classTabSection">
        <div className="classTabSectionHeader">
          <h3>
            {t("projects.templateManagement", {}, { default: "Class board" })}
          </h3>
        </div>

        {isPending ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <JustOneSecondNotice
              message={{
                h1: t("projects.loadingClassTemplatesTitle", {}, {
                  default: "Loading class templates",
                }),
                p: t("projects.loadingClassTemplatesBody", {}, {
                  default:
                    "Fetching the project templates available to this class.",
                }),
              }}
            />
          </div>
        ) : (
          <StyledBoardGrid>
            {boards.map((board) => (
              <div key={board.id} className="boardTile">
                <h5 className="boardTileTitle">
                  {board.title ||
                    t("dashboard.untitledTemplateBoard", {}, {
                      default: "Untitled template",
                    })}
                </h5>
                {isTemplateVisibleToStudents(board, classId, classContext) ? (
                  <Chip
                    variant="static"
                    tone="success"
                    label={t("projects.visibleToStudentsChip", {}, {
                      default: "Visible to students",
                    })}
                    title={t("projects.visibleToStudents", {}, {
                      default: "Students can copy this template",
                    })}
                  />
                ) : (
                  <Chip
                    variant="static"
                    tone="neutral"
                    label={t("projects.hiddenFromStudentsChip", {}, {
                      default: "Hidden from students",
                    })}
                    title={t("projects.notVisibleToStudents", {}, {
                      default: "Students cannot copy this template",
                    })}
                  />
                )}
                <div className="boardTileActions">
                  <Button
                    variant="filled"
                    onClick={() => openEditor(board.id)}
                  >
                    {t("projects.edit", {}, { default: "Edit" })}
                  </Button>
                  <IconButton
                    variant="text"
                    icon={<SettingsIcon />}
                    ariaLabel={`${settingsLabel}: ${board.title || ""}`}
                    title={settingsLabel}
                    onClick={() =>
                      openEditor(board.id, { withSettings: true })
                    }
                  />
                </div>
              </div>
            ))}
            <button type="button" className="boardTile newBoardTile" onClick={openCreate}>
              <AddIcon />
              <span>{t("projects.newBoard", {}, { default: "New board" })}</span>
            </button>
          </StyledBoardGrid>
        )}
      </section>
    </>
  );
}

const StyledBoardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;

  .boardTile {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 12px;
    min-height: 112px;
    padding: 16px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 12px;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    box-sizing: border-box;
  }

  .boardTile > .DesignSystem-Chip {
    align-self: flex-start;
  }

  .boardTileTitle {
    margin: 0;
    font: var(--MH-Type-Title-Small);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    overflow-wrap: anywhere;
  }

  .boardTileActions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  /* \`&&&\` beats legacy page-level button rules. */
  &&& .newBoardTile {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 0;
    border: 1px dashed var(--MH-Theme-Neutrals-Medium, #a1a1a1);
    background: transparent;
    color: var(--MH-Theme-Primary-Dark, #336f8a);
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: var(--MH-Theme-Primary-Light, #def8fb);
    }

    &:focus-visible {
      outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
      outline-offset: 2px;
    }
  }
`;
