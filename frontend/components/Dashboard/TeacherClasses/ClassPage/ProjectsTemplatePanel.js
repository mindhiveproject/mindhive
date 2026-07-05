import { useMutation, useQuery } from "@apollo/client";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import {
  CLASS_TEMPLATE_PROJECTS_QUERY,
  GET_MY_AUTHORED_PROJECT_BOARDS,
  PROPOSAL_TEMPLATES_QUERY,
} from "../../../Queries/Proposal";
import {
  DELETE_COMPLETE_PROPOSAL,
  SYNC_CLASS_TEMPLATE_BOARDS,
} from "../../../Mutations/Proposal";
import { isTemplateVisibleToStudents } from "../../../../lib/classTemplateBoards";
import {
  canDeleteProposalBoard,
  userIsProposalAdmin,
} from "../../../Utils/proposalBoard";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import DropdownMenu from "../../../DesignSystem/DropdownMenu";
import TemplateBoardMilestonesMenu from "./TemplateBoardMilestonesMenu";
import TemplateBoardPreviewModal from "./TemplateBoardPreviewModal";
import TemplateBoardSettingsModal from "./TemplateBoardSettingsModal";

export default function ProjectsTemplatePanel({ myclass, user }) {
  const { t } = useTranslation("classes");
  const { t: tBuilder } = useTranslation("builder");
  const router = useRouter();
  const classId = myclass?.id;
  const code = myclass?.code;
  const isAdmin = userIsProposalAdmin(user);
  const [settingsModalBoardId, setSettingsModalBoardId] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [libraryCategory, setLibraryCategory] = useState("public");

  const { data: classTemplatesData } = useQuery(CLASS_TEMPLATE_PROJECTS_QUERY, {
    variables: { classId },
    skip: !classId,
  });

  const { data: libraryData } = useQuery(PROPOSAL_TEMPLATES_QUERY);

  const { data: authoredData } = useQuery(GET_MY_AUTHORED_PROJECT_BOARDS, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  const [syncClassTemplateBoards] = useMutation(SYNC_CLASS_TEMPLATE_BOARDS, {
    refetchQueries: [
      {
        query: CLASS_TEMPLATE_PROJECTS_QUERY,
        variables: { classId },
      },
    ],
  });

  useEffect(() => {
    if (!classId) return;
    syncClassTemplateBoards({ variables: { classId } }).catch(() => {});
  }, [classId]);

  const [deleteProposalBoard] = useMutation(DELETE_COMPLETE_PROPOSAL, {
    refetchQueries: [
      {
        query: CLASS_TEMPLATE_PROJECTS_QUERY,
        variables: { classId },
      },
    ],
  });

  const classTemplates = classTemplatesData?.proposalBoards || [];

  const classTemplateIds = useMemo(
    () => new Set(classTemplates.map((board) => board.id)),
    [classTemplates]
  );

  const publicTemplates = libraryData?.proposalBoards || [];

  const mineTemplates = useMemo(() => {
    const authoredBoards = authoredData?.proposalBoards || [];
    return authoredBoards.filter(
      (board) =>
        !board.isTemplate
        && board.templateForClasses?.length > 0
        && !classTemplateIds.has(board.id)
    );
  }, [authoredData, classTemplateIds]);

  const displayedTemplates =
    libraryCategory === "mine" ? mineTemplates : publicTemplates;

  const createHref = {
    pathname: `/dashboard/myclasses/${code}`,
    query: { page: "projects", action: "create" },
  };

  const editHref = (boardId) => ({
    pathname: `/dashboard/myclasses/${code}`,
    query: { page: "projects", action: "edit", board: boardId },
  });

  const addTemplateHref = (templateId) => ({
    pathname: `/dashboard/myclasses/${code}`,
    query: { page: "projects", action: "create", template: templateId },
  });

  const formatDate = (value) =>
    value ? moment(value).format("M/D/YYYY") : "";

  const handleDeleteTemplate = async (boardId) => {
    if (!boardId) return;
    if (!confirm(tBuilder("deleteProposal.confirm"))) return;
    try {
      await deleteProposalBoard({ variables: { id: boardId } });
    } catch (err) {
      alert(err?.message);
    }
  };

  const getCopyStatusLabel = (isVisible) =>
    isVisible
      ? t("projects.visibleToStudents", {}, {
          default: "Students can copy this template",
        })
      : t("projects.notVisibleToStudents", {}, {
          default: "Students cannot copy this template",
        });

  const buildTemplateMenuItems = (board, canDelete) => {
    const items = [
      {
        key: "preview",
        label: t("projectBoard.preview", {}, { default: "Preview" }),
        onClick: () => setPreviewTemplate(board),
      },
      {
        key: "boardSettings",
        label: t("projects.boardSettingsAndPermissions", {}, {
          default: "Board settings & permissions",
        }),
        onClick: () => setSettingsModalBoardId(board.id),
      },
      {
        key: "edit",
        label: t("projects.editTemplate", {}, { default: "Edit template" }),
        onClick: () => router.push(editHref(board.id)),
      },
    ];

    if (canDelete) {
      items.push({
        key: "delete",
        label: t("projectBoard.delete", {}, { default: "Delete" }),
        danger: true,
        onClick: () => handleDeleteTemplate(board.id),
      });
    }

    return items;
  };

  return (
    <>
      <TemplateBoardSettingsModal
        open={!!settingsModalBoardId}
        onClose={() => setSettingsModalBoardId(null)}
        boardId={settingsModalBoardId}
        myclass={myclass}
        classTemplates={classTemplates}
      />

      <TemplateBoardPreviewModal
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        board={previewTemplate}
      />

      <div className="classTabSectionHeader">
        <h3>
          {t("projects.templateManagement", {}, { default: "Template management" })}
        </h3>
      </div>

      <div className="classTabSubsection">
        <h4 className="classTabSubsectionTitle">
          {t("projects.classTemplates", {}, { default: "Class templates" })}
        </h4>
        <p className="classTabSubsectionDescription">
          {t(
            "projects.classTemplatesDescription",
            {},
            {
              default:
                "Choose which templates students can copy when starting a new project.",
            }
          )}
        </p>

        {classTemplates.length === 0 ? (
          <div className="classTabEmpty">
            <div>
              {t("projects.noClassTemplatesYet", {}, {
                default: "You haven't created any class template boards yet.",
              })}
            </div>
            <p>
              {t("projects.noClassTemplatesDescription", {}, {
                default:
                  "Create a template board for students in this class to use as a starting point.",
              })}
            </p>
            <Link href={createHref} style={{ textDecoration: "none" }}>
              <Button variant="filled">
                {t("projects.createTemplateBoard", {}, {
                  default: "Create template board",
                })}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="classTabTemplateList">
            {classTemplates.map((board) => {
              const isVisible = isTemplateVisibleToStudents(board, classId, {
                ...myclass,
                classTemplateBoards: classTemplates,
              });
              const canDelete = canDeleteProposalBoard(board, user?.id, { isAdmin });
              const copyStatusLabel = getCopyStatusLabel(isVisible);
              return (
                <div
                  key={board.id}
                  className={
                    isVisible
                      ? "classTabTemplateCard classTabTemplateCardActive"
                      : "classTabTemplateCard"
                  }
                >
                  <div className="classTabTemplateCardRow">
                    <div className="classTabTemplateCardTitleGroup">
                      <Link
                        href={editHref(board.id)}
                        className="classTabTemplateCardTitleLink"
                      >
                        <h5 className="classTabTemplateCardTitle">{board.title}</h5>
                      </Link>
                      <Chip
                        style={{ 
                          backgroundColor: isVisible ? "#FFFFFF" : "#F3F3F3",
                          fontSize: "12px", 
                          fontWeight: isVisible ? "600" : "500",
                          color: isVisible ? "#1C1B1F" : "#666666" }}
                        label={copyStatusLabel}
                      />
                    </div>
                    <div className="classTabTemplateCardActions">
                      <TemplateBoardMilestonesMenu
                        board={board}
                        classCode={code}
                        classId={classId}
                      />
                      <DropdownMenu
                        ariaLabel={t("projects.templateOptions", {}, {
                          default: "Template options",
                        })}
                        triggerStyle={{
                          gap: "2px",
                          padding: "6px 10px",
                          minWidth: "auto",
                        }}
                        trigger={
                          <>
                            <span
                              style={{
                                fontSize: "14px",
                                lineHeight: "16px",
                                fontWeight: 500,
                              }}
                            >
                              {t("main.settings", {}, { default: "Settings" })}
                            </span>
                            <img
                              src="/assets/dataviz/three-dots.svg"
                              alt=""
                              width={18}
                              height={18}
                            />
                          </>
                        }
                        items={buildTemplateMenuItems(board, canDelete)}
                      />
                    </div>
                  </div>
                  <div className="classTabTemplateCardMeta">
                    {board.updatedAt ? (
                      <span>
                        {t("projects.dateUpdated", {}, { default: "Updated" })}{" "}
                        {formatDate(board.updatedAt)}
                      </span>
                    ) : null}
                    {board.createdAt ? (
                      <span>
                        {t("projects.dateCreated", {}, { default: "Date created" })}{" "}
                        {formatDate(board.createdAt)}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="classTabSubsectionDivider" aria-hidden />

      <div className="classTabSubsection">
        <div className="classTabSubsectionHeaderRow">
          <div className="classTabSubsectionHeaderGroup">
            <h4 className="classTabSubsectionTitle">
              {t("projects.templateLibrary", {}, { default: "Template library" })}
            </h4>
            <div
              style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
              role="tablist"
            >
              <Chip
                shape="square"
                selected={libraryCategory === "public"}
                onClick={() => setLibraryCategory("public")}
                label={t(
                  "projects.templateLibraryCategory.public",
                  { count: publicTemplates.length },
                  { default: "Public ({{count}})" }
                )}
              />
              <Chip
                shape="square"
                selected={libraryCategory === "mine"}
                onClick={() => setLibraryCategory("mine")}
                label={t(
                  "projects.templateLibraryCategory.mine",
                  { count: mineTemplates.length },
                  { default: "Mine ({{count}})" }
                )}
              />
              <Chip
                shape="square"
                disabled
                label={t(
                  "projects.templateLibraryCategory.network",
                  { count: 0 },
                  { default: "Network ({{count}})" }
                )}
                title={t(
                  "projects.templateLibraryCategory.networkDisabledHint",
                  {},
                  { default: "Network templates coming soon" }
                )}
              />
            </div>
          </div>
          <Link href={createHref} style={{ textDecoration: "none" }}>
            <Button variant="primary">
              {t("projects.newTemplate", {}, {
                default: "Create new class template",
              })}
            </Button>
          </Link>
        </div>

        {displayedTemplates.length === 0 ? (
          <div className="classTabEmpty">
            <div>
              {libraryCategory === "mine"
                ? t("projects.templateLibraryNoMine", {}, {
                    default:
                      "You don't have any class templates in your other classes yet.",
                  })
                : t("projectBoard.noTemplatesHeader")}
            </div>
          </div>
        ) : (
          <div className="classTabTemplateList">
            {displayedTemplates.map((template) => (
              <div key={template.id} className="classTabTemplateCard">
                <div className="classTabTemplateCardRow">
                  <div>
                    <h5 className="classTabTemplateCardTitle">{template.title}</h5>
                    {template.description ? (
                      <p className="classTabTemplateCardDescription">
                        {template.description}
                      </p>
                    ) : null}
                  </div>
                  <div
                    className="classTabTemplateCardActions"
                    style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      {t("projectBoard.preview", {}, { default: "Preview" })}
                    </Button>
                    <Link
                      href={addTemplateHref(template.id)}
                      style={{ textDecoration: "none" }}
                    >
                      <Button variant="outline">
                        {t("projects.addTemplateToClass", {}, {
                          default: "Copy template to class",
                        })}
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="classTabTemplateCardMeta">
                  {template.updatedAt ? (
                    <span>
                      {t("projects.dateUpdated", {}, { default: "Updated" })}{" "}
                      {formatDate(template.updatedAt)}
                    </span>
                  ) : null}
                  {template.createdAt ? (
                    <span>
                      {t("projects.dateCreated", {}, { default: "Date created" })}{" "}
                      {formatDate(template.createdAt)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
