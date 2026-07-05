import { useMutation, useQuery } from "@apollo/client";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import useTranslation from "next-translate/useTranslation";

import {
  CLASS_TEMPLATE_PROJECTS_QUERY,
  PROPOSAL_TEMPLATES_QUERY,
} from "../../../Queries/Proposal";
import {
  DELETE_COMPLETE_PROPOSAL,
  SYNC_CLASS_TEMPLATE_BOARDS,
  UPDATE_PROPOSAL_BOARD,
} from "../../../Mutations/Proposal";
import {
  classHasExplicitTemplateVisibility,
  getVisibleTemplateBoards,
  isTemplateVisibleToStudents,
  setTemplateVisibilityForClass,
} from "../../../../lib/classTemplateBoards";
import {
  canDeleteProposalBoard,
  userIsProposalAdmin,
} from "../../../Utils/proposalBoard";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import DropdownMenu from "../../../DesignSystem/DropdownMenu";
import TemplateBoardMilestonesMenu from "./TemplateBoardMilestonesMenu";

export default function ProjectsTemplatePanel({ myclass, user }) {
  const { t } = useTranslation("classes");
  const { t: tBuilder } = useTranslation("builder");
  const router = useRouter();
  const classId = myclass?.id;
  const code = myclass?.code;
  const isAdmin = userIsProposalAdmin(user);

  const { data: classTemplatesData } = useQuery(CLASS_TEMPLATE_PROJECTS_QUERY, {
    variables: { classId },
    skip: !classId,
  });

  const { data: libraryData } = useQuery(PROPOSAL_TEMPLATES_QUERY);

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

  const [updateProposalBoard, { loading: updatingVisibility }] = useMutation(
    UPDATE_PROPOSAL_BOARD,
    {
      refetchQueries: [
        {
          query: CLASS_TEMPLATE_PROJECTS_QUERY,
          variables: { classId },
        },
      ],
    }
  );

  const [deleteProposalBoard] = useMutation(DELETE_COMPLETE_PROPOSAL, {
    refetchQueries: [
      {
        query: CLASS_TEMPLATE_PROJECTS_QUERY,
        variables: { classId },
      },
    ],
  });

  const classTemplates = classTemplatesData?.proposalBoards || [];
  const libraryTemplates = libraryData?.proposalBoards || [];

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

  const handleToggleVisibility = async (board) => {
    if (!classId || !board?.id) return;

    const classContext = {
      ...myclass,
      classTemplateBoards: classTemplates,
    };
    const isVisible = isTemplateVisibleToStudents(board, classId, classContext);
    const visibleCount = getVisibleTemplateBoards(classContext).length;

    if (isVisible && visibleCount <= 1) {
      const confirmed = window.confirm(
        t(
          "projects.confirmHideLastTemplate",
          {},
          {
            default:
              "This is the only template students can copy. Prevent copy anyway? Students will not be able to start new projects until you allow copy for at least one template.",
          }
        )
      );
      if (!confirmed) return;
    }

    try {
      const enteringExplicitMode = !classHasExplicitTemplateVisibility(classContext);
      const boardsToUpdate = enteringExplicitMode
        ? classTemplates.map((templateBoard) => ({
            id: templateBoard.id,
            settings: setTemplateVisibilityForClass(
              templateBoard.settings,
              classId,
              templateBoard.id === board.id
                ? !isVisible
                : isTemplateVisibleToStudents(templateBoard, classId, classContext)
            ),
          }))
        : [
            {
              id: board.id,
              settings: setTemplateVisibilityForClass(
                board.settings,
                classId,
                !isVisible
              ),
            },
          ];

      await Promise.all(
        boardsToUpdate.map((item) =>
          updateProposalBoard({
            variables: {
              id: item.id,
              settings: item.settings,
            },
          })
        )
      );
    } catch (err) {
      alert(
        err?.message
          || t("projects.toggleVisibilityError", {}, {
            default: "Failed to update template copy setting.",
          })
      );
    }
  };

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

  const buildTemplateMenuItems = (board, isVisible, canDelete) => {
    const items = [
      {
        key: "toggleCopy",
        label: isVisible
          ? t("projects.hideFromStudents", {}, { default: "Prevent copy" })
          : t("projects.showToStudents", {}, { default: "Allow copy" }),
        onClick: () => {
          if (!updatingVisibility) {
            handleToggleVisibility(board);
          }
        },
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
                        panelHeader={copyStatusLabel}
                        items={buildTemplateMenuItems(board, isVisible, canDelete)}
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
            <Chip
              label={t(
                "projects.templateLibraryCount",
                { count: libraryTemplates.length },
                { default: "{{count}} available" }
              )}
            />
          </div>
          <Link href={createHref} style={{ textDecoration: "none" }}>
            <Button variant="outline">
              {t("projects.newTemplate", {}, { default: "New template" })}
            </Button>
          </Link>
        </div>

        {libraryTemplates.length === 0 ? (
          <div className="classTabEmpty">
            <div>{t("projectBoard.noTemplatesHeader")}</div>
          </div>
        ) : (
          <div className="classTabTemplateList">
            {libraryTemplates.map((template) => (
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
                  <div className="classTabTemplateCardActions">
                    <Link
                      href={addTemplateHref(template.id)}
                      style={{ textDecoration: "none" }}
                    >
                      <Button variant="outline">
                        {t("projects.addTemplateToClass", {}, {
                          default: "Add to class",
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
