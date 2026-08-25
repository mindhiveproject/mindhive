import { useCallback, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../lib/useForm";
import { isClassTemplateBoard } from "../../Utils/proposalBoard";
import { UPDATE_PROPOSAL_BOARD } from "../../Mutations/Proposal";
import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../Queries/Proposal";
import IconButton from "../../DesignSystem/IconButton";
import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import Popover from "../../DesignSystem/Popover";
import PanelHeader from "../../DesignSystem/PanelHeader";
import AdvancedOptionsPanel from "./AdvancedOptionsPanel";

function plainTitle(value) {
  if (!value) return "";
  return String(value).replace(/<[^>]*>/g, "").trim();
}

export default function BoardEditorChrome({
  user,
  proposal,
  proposalBuildMode,
  refetchQueries,
  mode = "board",
  cardTitle,
  onBack,
  onAutoUpdateChange,
  autoUpdateStudentBoards,
  propagateToClones,
  onPropagationSuccess,
  cardChrome,
  onCardSave,
  onCardPreview,
  onCardExitPreview,
}) {
  const { t } = useTranslation("builder");
  const { t: tClasses } = useTranslation("classes");
  const settingsRef = useRef(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [templateBannerSection, setTemplateBannerSection] =
    useState("autoUpdate");

  const isClassTemplate = isClassTemplateBoard(proposal);
  const isTemplateWithClones =
    proposalBuildMode &&
    (proposal?.prototypeFor?.length > 0 || isClassTemplate);
  const cloneCount = proposal?.prototypeFor?.length ?? 0;
  const isCardMode = mode === "card";

  const { inputs, handleChange, toggleBoolean, toggleSettingsBoolean } =
    useForm({
      ...proposal,
    });

  const settingsEqual = (a, b) => {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    return (
      a.allowMovingSections === b.allowMovingSections &&
      a.allowMovingCards === b.allowMovingCards &&
      a.allowAddingSections === b.allowAddingSections &&
      a.allowAddingCards === b.allowAddingCards
    );
  };

  const [updateProposal, { loading }] = useMutation(UPDATE_PROPOSAL_BOARD, {
    variables: {
      ...inputs,
    },
    refetchQueries: [
      { query: OVERVIEW_PROPOSAL_BOARD_QUERY, variables: { id: proposal?.id } },
      ...(refetchQueries || []),
    ],
  });

  const hasUnsavedChanges =
    !isCardMode &&
    (inputs.title !== proposal?.title ||
      inputs.description !== proposal?.description ||
      inputs.isTemplate !== proposal?.isTemplate ||
      !settingsEqual(inputs.settings, proposal?.settings) ||
      inputs.isSubmitted !== proposal?.isSubmitted);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    settingsRef.current?.focus();
  }, []);

  const handleSaveAndUpdateStudentBoards = async () => {
    if (!propagateToClones) return;
    setApplyLoading(true);
    try {
      const data = await propagateToClones();
      if (data?.errors?.length > 0) {
        alert(
          t(
            "proposal.studentBoardsUpdateError",
            { errors: data.errors.join("; ") },
            { default: "Some boards could not be updated: {{errors}}" }
          )
        );
      } else {
        onPropagationSuccess?.();
        alert(
          t(
            "proposal.studentBoardsUpdated",
            { count: data?.updatedCloneCount ?? 0 },
            { default: "Updated {{count}} student board(s)." }
          )
        );
      }
    } catch (err) {
      alert(
        err?.message ??
          t(
            "proposal.studentBoardsUpdateError",
            { errors: String(err) },
            { default: "Some boards could not be updated: {{errors}}" }
          )
      );
    } finally {
      setApplyLoading(false);
    }
  };

  const handleSaveTitle = async () => {
    setIsTitleEditing(false);
    await updateProposal();
  };

  const backLabel = isCardMode
    ? tClasses("projects.backToBoard", {}, { default: "Back to board" })
    : tClasses("projects.backToClass", {}, { default: "Back to class" });
  const settingsLabel = t("proposal.advancedOptions", {}, {
    default: "Advanced options",
  });
  const displayTitle = isCardMode
    ? plainTitle(cardTitle) || t("proposal.cardFallbackTitle", {}, {
        default: "Card",
      })
    : inputs?.title || proposal?.title || "";

  return (
    <div className="boardEditorChrome">
      <div className="boardEditorChromeLeft">
        {onBack ? (
          <IconButton
            variant="tonal"
            style={{background:"var(--MH-Theme-Neutrals-Lighter, #F3F3F3)"}}
            ariaLabel={backLabel}
            title={backLabel}
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
        ) : null}
        <div className="boardEditorChromeTitleWrap">
          {isCardMode || !proposalBuildMode ? (
            <div className="boardEditorChromeTitleRow">
              <h1 className="boardEditorChromeTitle">{displayTitle}</h1>
              {isCardMode && cardChrome?.typeLabel ? (
                <Chip
                  className="boardEditorChromeTypeBadge"
                  shape="pill"
                  label={cardChrome.typeLabel}
                  style={{ cursor: "default", pointerEvents: "none", fontSize: 12 }}
                />
              ) : null}
            </div>
          ) : isTitleEditing ? (
            <input
              type="text"
              id="proposalTitle"
              name="title"
              value={inputs.title}
              onChange={handleChange}
              onBlur={handleSaveTitle}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSaveTitle();
                }
              }}
              className="boardEditorChromeTitleInput"
            />
          ) : (
            <div className="boardEditorChromeTitleRow">
              <h1 className="boardEditorChromeTitle">{displayTitle}</h1>
              <IconButton
                variant="subtle"
                style={{
                  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
                }}
                ariaLabel={t("proposal.editTitle", {}, {
                  default: "Edit board title",
                })}
                title={t("proposal.editTitle", {}, {
                  default: "Edit board title",
                })}
                onClick={() => setIsTitleEditing(true)}
                icon={<img src="/assets/icons/pencil.svg" alt="" />}
              />
            </div>
          )}
        </div>
      </div>

      <div className="boardEditorChromeRight">
        {isCardMode && cardChrome?.previewMode ? (
          <Button variant="outline" onClick={onCardExitPreview}>
            {tClasses("board.expendedCard.backToEditing", {}, {
              default: "Back to editing",
            })}
          </Button>
        ) : null}
        {isCardMode && cardChrome && !cardChrome.previewMode ? (
          <>
            <span className="boardEditorChromeEditMode">
              {tClasses("board.editMode", {}, {
                default: "You are in Edit Mode",
              })}
            </span>
            {cardChrome.kind === "project" ? (
              <Button
                variant="outline"
                onClick={onCardPreview}
                disabled={cardChrome.saving}
              >
                {tClasses("board.expendedCard.preview", {}, {
                  default: "Preview",
                })}
              </Button>
            ) : null}
            <Button
              variant="filled"
              onClick={onCardSave}
              disabled={cardChrome.saving}
            >
              {tClasses("board.save", {}, { default: "Save" })}
            </Button>
          </>
        ) : null}
        {hasUnsavedChanges && (
          <Button
            variant="tonal"
            onClick={async () => {
              setIsTitleEditing(false);
              await updateProposal();
            }}
          >
            {loading
              ? t("proposal.saving", {}, { default: "Saving" })
              : t("proposal.save", {}, { default: "Save" })}
          </Button>
        )}
        {!isCardMode && isTemplateWithClones && (
          <>
            <span ref={settingsRef} tabIndex={-1} style={{ display: "inline-flex" }}>
              <IconButton
                variant="subtle"
                style={{ background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)" }}
                ariaLabel={settingsLabel}
                title={settingsLabel}
                aria-expanded={settingsOpen}
                aria-haspopup="dialog"
                onClick={() =>
                  setSettingsOpen((wasOpen) => !wasOpen)
                }
                icon={
                  <img
                    src="/assets/icons/settings.svg"
                    alt=""
                    width={20}
                    height={20}
                  />
                }
              />
            </span>
            <Popover
              open={settingsOpen}
              anchorRef={settingsRef}
              onClose={closeSettings}
              side="bottom"
              align="end"
              width={520}
              ariaLabel={settingsLabel}
            >
              <PanelHeader
                title={settingsLabel}
                onClose={closeSettings}
                closeLabel={t("proposal.closeAdvancedOptions", {}, {
                  default: "Close advanced options",
                })}
              />
              <AdvancedOptionsPanel
                user={user}
                proposalBuildMode={proposalBuildMode}
                isClassTemplate={isClassTemplate}
                cloneCount={cloneCount}
                section={templateBannerSection}
                onSectionChange={setTemplateBannerSection}
                inputs={inputs}
                toggleBoolean={toggleBoolean}
                toggleSettingsBoolean={toggleSettingsBoolean}
                autoUpdateStudentBoards={autoUpdateStudentBoards}
                onAutoUpdateChange={onAutoUpdateChange}
                applyLoading={applyLoading}
                onSaveAndUpdateStudentBoards={handleSaveAndUpdateStudentBoards}
              />
            </Popover>
          </>
        )}
      </div>
    </div>
  );
}
