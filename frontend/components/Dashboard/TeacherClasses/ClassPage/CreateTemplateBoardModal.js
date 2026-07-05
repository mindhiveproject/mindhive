import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import JustOneSecondNotice from "../../../DesignSystem/JustOneSecondNotice";
import InDev from "../../../Global/InDev";
import ProposalBuilder from "../../../Proposal/Builder/Main";
import { StyledProposal } from "../../../styles/StyledProposal";
import {
  PROPOSAL_TEMPLATES_QUERY,
  CLASS_TEMPLATE_PROJECTS_QUERY,
} from "../../../Queries/Proposal";
import {
  COPY_PROPOSAL_MUTATION,
  CREATE_NEW_PROPOSAL_AS_AUTHOR,
  UPDATE_PROJECT_BOARD,
  SYNC_CLASS_TEMPLATE_BOARDS,
} from "../../../Mutations/Proposal";
import { EDIT_CLASS } from "../../../Mutations/Classes";

const MODE_LIBRARY = "library";
const MODE_BLANK = "blank";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 20040,
  background: "rgba(23, 23, 23, 0.35)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modalStyle = {
  width: "min(1100px, 90vw)",
  maxHeight: "90vh",
  overflowY: "auto",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  background: "#fff",
  border: "1px solid #A1A1A1",
  borderRadius: 16,
  boxShadow: "0 16px 48px rgba(0, 0, 0, 0.18)",
  padding: 32,
  fontFamily: "Inter, sans-serif",
};

const titleStyle = {
  margin: "0 0 24px",
  fontFamily: "Inter, sans-serif",
  fontSize: 32,
  lineHeight: "40px",
  fontWeight: 800,
  color: "#000",
};

const labelStyle = {
  display: "grid",
  gap: 8,
  color: "#5D5763",
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 600,
};

const chipRowStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const previewShellStyle = {
  border: "1px solid #E6E6E6",
  borderRadius: 12,
  background: "#F7F9F8",
  color: "#5D5763",
  fontSize: 14,
  lineHeight: "20px",
  padding: 16,
  maxHeight: "min(55vh, 520px)",
  overflowY: "auto",
};

const helperTextStyle = {
  margin: 0,
  color: "#5D5763",
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 400,
};

function StepSection({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ ...labelStyle, marginBottom: 0 }}>{label}</div>
      {children}
    </div>
  );
}

export default function CreateTemplateBoardModal({
  open,
  onClose,
  myclass,
  user,
  initialTemplateId,
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const classId = myclass?.id;
  const code = myclass?.code;

  const [mode, setMode] = useState(MODE_LIBRARY);
  const [proposalId, setProposalId] = useState(initialTemplateId || null);

  const { data, loading } = useQuery(PROPOSAL_TEMPLATES_QUERY, {
    skip: !open,
  });
  const templates = data?.proposalBoards || [];

  const templateOptions = useMemo(
    () =>
      templates.map((item) => ({
        value: item.id,
        label: item.title,
      })),
    [templates]
  );

  const selectedTemplate = useMemo(
    () => templates.find((item) => item?.id === proposalId) || null,
    [templates, proposalId]
  );

  useEffect(() => {
    if (!open) return;
    setMode(MODE_LIBRARY);
    setProposalId(initialTemplateId || null);
  }, [open, initialTemplateId]);

  const refetchQueries = [
    {
      query: CLASS_TEMPLATE_PROJECTS_QUERY,
      variables: { classId },
    },
  ];

  const [copyProposal, { loading: copyLoading }] = useMutation(
    COPY_PROPOSAL_MUTATION,
    { refetchQueries }
  );

  const [createProposal, { loading: createLoading }] = useMutation(
    CREATE_NEW_PROPOSAL_AS_AUTHOR
  );

  const [updateProjectBoard, { loading: linkLoading }] = useMutation(
    UPDATE_PROJECT_BOARD
  );

  const [syncClassTemplateBoards] = useMutation(SYNC_CLASS_TEMPLATE_BOARDS);

  const [editClass, { loading: editClassLoading }] = useMutation(EDIT_CLASS);

  const isBusy = copyLoading || createLoading || linkLoading || editClassLoading;

  const handleTemplateChange = (value) => {
    setProposalId(value || null);
  };

  const handleCopyFromLibrary = async () => {
    if (!proposalId) {
      alert(t("projectBoard.chooseTemplate"));
      return;
    }
    try {
      const res = await copyProposal({
        variables: {
          id: proposalId,
          classIdTemplate: classId,
        },
      });
      if (res?.data?.copyProposalBoard) {
        onClose();
      }
    } catch (err) {
      alert(err?.message);
    }
  };

  const handleCreateBlank = async () => {
    if (!classId || !user?.id) return;
    try {
      const res = await createProposal({
        variables: {
          title: t("boardManagement.newBoard", {}, { default: "New Project Board" }),
          description: t("boardManagement.newBoardDesc", {}, {
            default: "A new project board created from scratch",
          }),
          settings: null,
          authorId: user.id,
        },
      });
      const newBoardId = res?.data?.createProposalBoard?.id;
      if (!newBoardId) return;

      await updateProjectBoard({
        variables: {
          id: newBoardId,
          input: {
            templateForClasses: { connect: [{ id: classId }] },
            templatesForClass: { connect: [{ id: classId }] },
          },
        },
      });

      await syncClassTemplateBoards({ variables: { classId } });

      if (!myclass?.templateProposal?.id) {
        await editClass({
          variables: {
            id: classId,
            templateProposal: { connect: { id: newBoardId } },
          },
        });
      }

      router.replace({
        pathname: `/dashboard/myclasses/${code}`,
        query: { page: "projects", action: "edit", board: newBoardId },
      });
    } catch (err) {
      alert(err?.message);
    }
  };

  if (!open || typeof document === "undefined") return null;

  const createLabel = initialTemplateId
    ? t("projects.addTemplateToClass", {}, {
        default: "Copy template to class",
      })
    : t("projectBoard.create", {}, { default: "Create" });

  const primaryAction =
    mode === MODE_LIBRARY ? handleCopyFromLibrary : handleCreateBlank;

  const primaryLabel =
    mode === MODE_LIBRARY
      ? createLabel
      : t("projects.createTemplateModal.createBlank", {}, {
          default: "Create blank template",
        });

  const primaryDisabled =
    mode === MODE_LIBRARY
      ? isBusy || !proposalId || templates.length === 0
      : isBusy;

  return createPortal(
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose();
      }}
    >
      <style>{`
        .createTemplateBoardModalForm::-webkit-scrollbar {
          display: none;
        }
        .createTemplateBoardModalForm .proposalBoard {
          margin: 0;
        }
        .createTemplateBoardModalForm .proposalBoard h2 {
          margin: 0 0 8px;
          font-family: Inter, sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #171717;
        }
        .createTemplateBoardModalForm .proposalBoard h2 .templateName {
          color: #336f8a;
        }
        .createTemplateBoardModalForm .proposalBoard > p {
          margin: 0 0 16px;
          font-size: 14px;
          line-height: 20px;
          color: #625b71;
        }
      `}</style>

      <div
        className="createTemplateBoardModalForm"
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="createTemplateBoardModalTitle"
      >
        <h2 id="createTemplateBoardModalTitle" style={titleStyle}>
          {t("projects.createTemplateModal.title", {}, {
            default: "Create template board",
          })}
        </h2>

        <div style={{ display: "grid", gap: 20 }}>
          <StepSection
            label={t("projects.createTemplateModal.sourceLabel", {}, {
              default: "Template source",
            })}
          >
            <div style={chipRowStyle} role="tablist">
              <Chip
                shape="square"
                label={t("projects.createTemplateModal.fromLibrary", {}, {
                  default: "From template library",
                })}
                selected={mode === MODE_LIBRARY}
                onClick={() => setMode(MODE_LIBRARY)}
              />
              <Chip
                shape="square"
                label={t("projects.createTemplateModal.blankTemplate", {}, {
                  default: "Blank template",
                })}
                selected={mode === MODE_BLANK}
                onClick={() => setMode(MODE_BLANK)}
              />
            </div>
          </StepSection>

          {mode === MODE_LIBRARY && (
            <>
              {loading && !data ? (
                <JustOneSecondNotice
                  message={{
                    h1: t("projectBoard.loading", {}, {
                      default: "Loading project board...",
                    }),
                    p: t("projectBoard.selectProjectTemplate", {}, {
                      default: "Select project template",
                    }),
                  }}
                />
              ) : templates.length === 0 ? (
                <InDev
                  header={t("projectBoard.noTemplatesHeader")}
                  message={t("projectBoard.noTemplatesMessage")}
                />
              ) : (
                <>
                  <StepSection
                    label={t("projectBoard.selectProjectTemplate", {}, {
                      default: "Select project template",
                    })}
                  >
                    <DropdownSelect
                      value={proposalId || ""}
                      onChange={handleTemplateChange}
                      options={templateOptions}
                      placeholder={t("projectBoard.selectProjectTemplate", {}, {
                        default: "Select project template",
                      })}
                      ariaLabel={t("projectBoard.selectProjectTemplate", {}, {
                        default: "Select project template",
                      })}
                    />
                  </StepSection>

                  {selectedTemplate ? (
                    <StepSection
                      label={t("projects.createTemplateModal.previewLabel", {}, {
                        default: "Preview",
                      })}
                    >
                      <div style={previewShellStyle}>
                        <StyledProposal>
                          <ProposalBuilder
                            proposalId={selectedTemplate.id}
                            proposal={selectedTemplate}
                            isPreview
                          />
                        </StyledProposal>
                      </div>
                    </StepSection>
                  ) : (
                    <p style={helperTextStyle}>
                      {t("projects.createTemplateModal.selectToPreview", {}, {
                        default:
                          "Select a template above to preview its structure before adding it to your class.",
                      })}
                    </p>
                  )}
                </>
              )}
            </>
          )}

          {mode === MODE_BLANK && (
            <p style={helperTextStyle}>
              {t("projects.createTemplateModal.blankDescription", {}, {
                default:
                  "Start with an empty project board and build your class template from scratch. You will be taken to the editor after creation.",
              })}
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginTop: 28,
          }}
        >
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={onClose}
          >
            {t("projects.createTemplateModal.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button
            type="button"
            variant="filled"
            disabled={primaryDisabled}
            onClick={primaryAction}
          >
            {copyLoading || createLoading
              ? t("projects.createTemplateModal.creating", {}, {
                  default: "Creating…",
                })
              : primaryLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
