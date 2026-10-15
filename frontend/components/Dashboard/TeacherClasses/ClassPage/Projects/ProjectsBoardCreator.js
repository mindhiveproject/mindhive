import { useState } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import IconButton from "../../../../DesignSystem/IconButton";
import JustOneSecondNotice from "../../../../DesignSystem/JustOneSecondNotice";
import InDev from "../../../../Global/InDev";
import ProposalBuilder from "../../../../Proposal/Builder/Main";
import { StyledProposal } from "../../../../styles/StyledProposal";
import { StyledProjectsBoardEditor } from "./ProjectsBoardEditor";
import useCreateClassBoard, {
  TEMPLATE_SOURCE_OWNED,
  TEMPLATE_SOURCE_PUBLIC,
} from "./useCreateClassBoard";

const MODE_LIBRARY = "library";
const MODE_BLANK = "blank";

function plainText(value) {
  if (!value) return "";
  return String(value).replace(/<[^>]*>/g, "").trim();
}

// Create mode for a class board: the board editor's full-screen shell before a
// board exists. The top bar holds the title, the source (template library or
// blank) and Create; the canvas shows the template, or an empty board. Nothing
// is saved until Create, which opens the new board in the editor.
export default function ProjectsBoardCreator({
  myclass,
  user,
  initialTemplateId = null,
  // Class tab to return to when leaving.
  page = "settings",
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const code = myclass?.code;

  const [mode, setMode] = useState(MODE_LIBRARY);
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [title, setTitle] = useState("");

  const {
    templates,
    templatesLoading,
    initialTemplateLoading,
    creating,
    createFromTemplate,
    createBlank,
  } = useCreateClassBoard({ myclass, user, initialTemplateId });

  const selectedTemplate =
    mode === MODE_LIBRARY
      ? templates.find((item) => item.id === templateId) ?? null
      : null;

  const defaultBlankTitle = t("boardManagement.newBoard", {}, {
    default: "New Project Board",
  });
  const titlePlaceholder =
    plainText(selectedTemplate?.title) || defaultBlankTitle;

  const onBack = () => {
    router.push({ pathname: `/dashboard/myclasses/${code}`, query: { page } });
  };

  const openEditor = (boardId) => {
    router.replace({
      pathname: `/dashboard/myclasses/${code}`,
      query: { page, editBoard: boardId },
    });
  };

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    try {
      const newBoardId =
        mode === MODE_LIBRARY
          ? await createFromTemplate({ templateId, title: trimmedTitle })
          : await createBlank({
              title: trimmedTitle || defaultBlankTitle,
              description: t("boardManagement.newBoardDesc", {}, {
                default: "A new project board created from scratch",
              }),
            });
      if (newBoardId) openEditor(newBoardId);
    } catch (err) {
      alert(err?.message);
    }
  };

  const createDisabled =
    creating || (mode === MODE_LIBRARY && !selectedTemplate);

  const backLabel = t("projects.backToClass", {}, { default: "Back to class" });
  const selectLabel = t("projectBoard.selectProjectTemplate", {}, {
    default: "Select project template",
  });

  let canvas;
  if (mode === MODE_BLANK) {
    canvas = (
      <div className="boardCreatorBlank">
        <p className="boardCreatorHint">
          {t("projects.createTemplateModal.blankDescription", {}, {
            default:
              "Start with an empty project board and build your class template from scratch. You will be taken to the editor after creation.",
          })}
        </p>
        <div className="boardCreatorSkeleton" aria-hidden="true">
          {[0, 1, 2].map((column) => (
            <div key={column} className="boardCreatorSkeletonColumn" />
          ))}
        </div>
      </div>
    );
  } else if (templatesLoading || initialTemplateLoading) {
    canvas = (
      <div className="boardCreatorCentered">
        <JustOneSecondNotice
          message={{
            h1: t("projectBoard.loading", {}, {
              default: "Loading project board...",
            }),
          }}
        />
      </div>
    );
  } else if (templates.length === 0) {
    canvas = (
      <div className="boardCreatorCentered">
        <InDev
          header={t("projectBoard.noTemplatesHeader")}
          message={t("projectBoard.noTemplatesMessage")}
        />
      </div>
    );
  } else if (selectedTemplate) {
    canvas = (
      <div className="boardCreatorPreview">
        <ProposalBuilder
          key={selectedTemplate.id}
          proposal={selectedTemplate}
          isPreview
          hidePreviewHeader
        />
      </div>
    );
  } else {
    canvas = (
      <div className="boardCreatorGallery">
        <p className="boardCreatorHint">
          {t("projects.createTemplateModal.selectToPreview", {}, {
            default:
              "Select a template above to preview its structure before adding it to your class.",
          })}
        </p>
        <div className="boardCreatorGalleryGrid">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="boardCreatorTemplateTile"
              onClick={() => setTemplateId(template.id)}
            >
              <span className="boardCreatorTemplateTitle">
                {plainText(template.title)}
              </span>
              {template.templateSource === TEMPLATE_SOURCE_PUBLIC ? (
                <Chip
                  variant="static"
                  tone="info"
                  label={t("projects.templateSourcePublic", {}, {
                    default: "Public template",
                  })}
                />
              ) : template.templateSource === TEMPLATE_SOURCE_OWNED ? (
                <Chip
                  variant="static"
                  tone="neutral"
                  label={t("projects.templateSourceOwned", {}, {
                    default: "Your board",
                  })}
                />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <StyledProjectsBoardEditor className="projectsBoardEditor">
      <StyledProposal className="projectsBoardEditorProposal" $flush>
        <StyledBoardCreator className="proposalBoard">
          <div className="boardEditorChrome">
            <div className="boardEditorChromeLeft">
              <IconButton
                variant="tonal"
                style={{ background: "var(--MH-Theme-Neutrals-Lighter, #f3f3f3)" }}
                ariaLabel={backLabel}
                title={backLabel}
                disabled={creating}
                onClick={onBack}
                icon={
                  <img
                    src="/assets/icons/back.svg"
                    alt=""
                    width={12}
                    height={12}
                    style={{ width: 12, height: 12 }}
                  />
                }
              />
              <div className="boardEditorChromeTitleWrap">
                <input
                  type="text"
                  className="boardEditorChromeTitleInput"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={titlePlaceholder}
                  aria-label={t("projectTitle", {}, { default: "Project title" })}
                  disabled={creating}
                />
              </div>
            </div>

            <div className="boardEditorChromeRight">
              <div className="boardCreatorSource" role="tablist">
                <Chip
                  label={t("projects.createTemplateModal.fromLibrary", {}, {
                    default: "From template library",
                  })}
                  selected={mode === MODE_LIBRARY}
                  onClick={() => setMode(MODE_LIBRARY)}
                />
                <Chip
                  label={t("projects.createTemplateModal.blankTemplate", {}, {
                    default: "Blank template",
                  })}
                  selected={mode === MODE_BLANK}
                  onClick={() => setMode(MODE_BLANK)}
                />
              </div>
              {mode === MODE_LIBRARY && templates.length > 0 ? (
                <div className="boardCreatorTemplatePicker">
                  <DropdownSelect
                    value={templateId || ""}
                    onChange={(value) => setTemplateId(value || null)}
                    options={templates.map((item) => ({
                      value: item.id,
                      label: plainText(item.title),
                    }))}
                    placeholder={selectLabel}
                    ariaLabel={selectLabel}
                    searchableSingle
                    portal
                  />
                </div>
              ) : null}
              <Button
                type="button"
                variant="filled"
                disabled={createDisabled}
                onClick={handleCreate}
              >
                {creating
                  ? t("projects.createTemplateModal.creating", {}, {
                      default: "Creating…",
                    })
                  : t("projectBoard.create", {}, { default: "Create" })}
              </Button>
            </div>
          </div>

          <div className="boardCreatorCanvas">{canvas}</div>
        </StyledBoardCreator>
      </StyledProposal>
    </StyledProjectsBoardEditor>
  );
}

const StyledBoardCreator = styled.div`
  .boardCreatorSource {
    display: flex;
    gap: 8px;
  }

  .boardCreatorTemplatePicker {
    width: 280px;
    min-width: 0;
  }

  .boardCreatorCanvas {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

  .boardCreatorPreview {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .boardCreatorCentered {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .boardCreatorHint {
    margin: 8px 0 16px;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: #625b71;
  }

  .boardCreatorGalleryGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }

  /* \`&&&\` beats legacy page-level button rules. */
  &&& .boardCreatorTemplateTile {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    min-height: 112px;
    width: 100%;
    margin: 0;
    padding: 16px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 12px;
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    box-sizing: border-box;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      border-color: var(--MH-Theme-Primary-Dark, #336f8a);
      box-shadow: 0 8px 20px rgba(51, 111, 138, 0.12);
    }
  }

  .boardCreatorTemplateTitle {
    font: var(--MH-Type-Title-Small);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    overflow-wrap: anywhere;
  }

  .boardCreatorSkeleton {
    display: flex;
    gap: 24px;
  }

  .boardCreatorSkeletonColumn {
    width: 420px;
    max-width: 30%;
    height: 280px;
    border: 2px dashed var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.6);
  }
`;
