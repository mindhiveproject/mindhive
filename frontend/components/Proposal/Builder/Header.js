import { UPDATE_PROPOSAL_BOARD } from "../../Mutations/Proposal";

import { useMutation } from "@apollo/client";

import useForm from "../../../lib/useForm";

import { Checkbox } from "semantic-ui-react";
import { useState } from "react";
import useTranslation from 'next-translate/useTranslation';
import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../Queries/Proposal";
import InfoTooltip from "../../DesignSystem/InfoTooltip";
import Chip from "../../DesignSystem/Chip";
import Button from "../../DesignSystem/Button";
import { isClassTemplateBoard } from "../../Utils/proposalBoard";

export default function ProposalHeader({
  user,
  proposal,
  proposalBuildMode,
  refetchQueries,
  onAutoUpdateChange,
  autoUpdateStudentBoards,
  propagateToClones,
  hasUnpropagatedChanges,
  onPropagationSuccess,
  isPropagatingToClones,
}) {
  const { t } = useTranslation('builder');
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [templateBannerExpanded, setTemplateBannerExpanded] = useState(false);
  const [templateBannerSection, setTemplateBannerSection] = useState('autoUpdate');
  const isClassTemplate = isClassTemplateBoard(proposal);
  const isTemplateWithClones =
    proposalBuildMode &&
    (proposal?.prototypeFor?.length > 0 || isClassTemplate);
  const cloneCount = proposal?.prototypeFor?.length ?? 0;

  const handleSaveAndUpdateStudentBoards = async () => {
    if (!propagateToClones) return;
    setApplyLoading(true);
    try {
      const data = await propagateToClones();
      if (data?.errors?.length > 0) {
        alert(
          t("proposal.studentBoardsUpdateError", {
            errors: data.errors.join("; "),
          })
        );
      } else {
        onPropagationSuccess?.();
        alert(
          t("proposal.studentBoardsUpdated", { count: data?.updatedCloneCount ?? 0 })
        );
      }
    } catch (err) {
      alert(err?.message ?? t("proposal.studentBoardsUpdateError", { errors: String(err) }));
    } finally {
      setApplyLoading(false);
    }
  };

  // save and edit the study information
  const { inputs, handleChange, handleMultipleUpdate, toggleBoolean, toggleSettingsBoolean } =
    useForm({
      ...proposal,
    });

  const boardTypeSelection = inputs.settings?.curriculumType === 'youquantified' ? 'youquantified' : 'mindhive';

  const [updateProposal, { loading }] = useMutation(UPDATE_PROPOSAL_BOARD, {
    variables: {
      ...inputs,
    },
    refetchQueries: [
      { query: OVERVIEW_PROPOSAL_BOARD_QUERY, variables: { id: proposal?.id } },
      ...refetchQueries,
    ],
  });

  const settingsEqual = (a, b) => {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    const curriculumA = a?.curriculumType ?? 'mindhive';
    const curriculumB = b?.curriculumType ?? 'mindhive';
    return (
      (a.allowMovingSections === b.allowMovingSections) &&
      (a.allowMovingCards === b.allowMovingCards) &&
      (a.allowAddingSections === b.allowAddingSections) &&
      (a.allowAddingCards === b.allowAddingCards) &&
      curriculumA === curriculumB
    );
  };

  const hasUnsavedChanges =
    inputs.title !== proposal?.title ||
    inputs.description !== proposal?.description ||
    inputs.isTemplate !== proposal?.isTemplate ||
    !settingsEqual(inputs.settings, proposal?.settings) ||
    inputs.isSubmitted !== proposal?.isSubmitted;

  return (
    <div className="header">
      <div>

      <div className="headerTitleRow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', width: '100%', minWidth: 0 }}>
        <div className="headerTitleWrapper" style={{ minWidth: 0 }}>
          {isTitleEditing ? (
            <input
              type="text"
              id="propsalTitle"
              name="title"
              value={inputs.title}
              onChange={handleChange}
              className="titleEdit"
            />
          ) : (
            <div className="titleIcon">
              <div className="title">{inputs?.title}</div>

              <div className="icon">
                <img
                  src="/assets/icons/pencil.svg"
                  onClick={() => {
                    setIsTitleEditing(!isTitleEditing);
                  }}
                />
              </div>
            </div>
          )}
        </div>
        {hasUnsavedChanges && (
          <div style={{ flexShrink: 0 }}>
            <Button
              variant="tonal"
              onClick={async () => {
                setIsTitleEditing(false);
                await updateProposal();
              }}
            >
              {loading ? t('proposal.saving', 'Saving') : t('proposal.save', 'Save')}
            </Button>
          </div>
        )}
      </div>

      {isTemplateWithClones && (
        <div className="templateBanner">
          <div className="templateBannerHeader">
            <div className="templateBannerHeaderLeft">
              <button
                type="button"
                className="templateBannerHeaderToggle"
                onClick={() => setTemplateBannerExpanded(!templateBannerExpanded)}
                aria-expanded={templateBannerExpanded}
                aria-label={t("proposal.expandCollapseTemplateBanner", "Expand or minimize template section")}
              >
                <span className="templateBannerHeaderToggleIcon" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <img
                    style={{
                      transform: templateBannerExpanded ? "rotate(270deg)" : "rotate(90deg)",
                      width: "8px",
                      height: "8px",
                    }}
                    src="/assets/icons/back.svg"
                    alt=""
                  />
                  <img
                    style={{
                      transform: templateBannerExpanded ? "rotate(90deg)" : "rotate(270deg)",
                      width: "8px",
                      height: "8px",
                    }}
                    src="/assets/icons/back.svg"
                    alt=""
                  />
                </span>
                <span className="templateBannerTitle">
                  {t("proposal.advancedOptions", "Advanced options")}
                </span>
              </button>
            </div>
            <div className="templateBannerHeaderChips">
              <Chip
                shape = "square"
                label={autoUpdateStudentBoards ? t("proposal.templateAutoUpdateOn", "Auto-update: ON") : t("proposal.templateAutoUpdateOff", "Auto-update: OFF")}
                selected={autoUpdateStudentBoards}
                // style={{ backgroundColor: "#5D5763", border: "1px solid #F3F3F3", color: "#F3F3F3", fontSize: "12px", fontWeight: "600", lineHeight: "18px", padding: "4px 12px" }}
                style={{ fontSize: "12px", fontWeight: "600", lineHeight: "18px", padding: "4px 12px" }}
              />
              {isPropagatingToClones && (
                <Chip
                  shape="square"
                  label={t("proposal.updatingStudentBoards", "Updating student boards…")}
                  style={{ backgroundColor: "#E4DFF6", border: "1px solid #3F288F", color: "#3F288F", fontSize: "12px", fontWeight: "600", lineHeight: "18px", padding: "4px 12px" }}
                />
              )}
              {hasUnpropagatedChanges && (
                <Chip
                  shape="square"
                  label={t("proposal.templateUnpropagatedChanges", "Unpropagated changes")}
                  style={{ backgroundColor: "#F3F3F3", border: "3px solid #8F1F14", color: "#8F1F14", fontSize: "12px", fontWeight: "800", lineHeight: "18px", padding: "4px 12px" }}
                  onClick={() => {
                    setTemplateBannerExpanded(true);
                    setTemplateBannerSection("autoUpdate");
                  }}
                />
              )}
            </div>
          </div>
          {templateBannerExpanded && (
          <div className="templateBannerContent">
            <div className="templateBannerContentInner">
              <div className="templateBannerContentLeft">
                <Chip
                  shape="square"
                  label={t("proposal.templateSectionAutoUpdate", "Auto-update")}
                  selected={templateBannerSection === "autoUpdate"}
                  onClick={() => setTemplateBannerSection("autoUpdate")}
                />
                {proposalBuildMode && (
                  <Chip
                    shape="square"
                    label={t("proposal.templateSectionStudentSettings", "Student settings")}
                    selected={templateBannerSection === "studentSettings"}
                    onClick={() => setTemplateBannerSection("studentSettings")}
                  />
                )}
                <Chip
                  shape="square"
                  label={t("proposal.templateSectionBoardType", "Board type")}
                  selected={templateBannerSection === "boardType"}
                  onClick={() => setTemplateBannerSection("boardType")}
                />
                {proposalBuildMode && user?.permissions?.map((p) => p?.name).includes("ADMIN") && (
                  <Chip
                    shape="square"
                    label={t("proposal.templateSectionAdminSettings", "Admin settings")}
                    selected={templateBannerSection === "adminSettings"}
                    onClick={() => setTemplateBannerSection("adminSettings")}
                  />
                )}
              </div>
              <div className="templateBannerContentDivider" aria-hidden="true" />
              <div className="templateBannerContentRight">
                {templateBannerSection === "autoUpdate" && (
                  <>
                    <div className="templateBannerSection">
                      {isClassTemplate && (
                        <Chip
                          shape="pill"
                          leading={<img src="/assets/icons/info.svg" alt="" style={{ transform: "rotate(180deg)" }} />}
                          label={t("proposal.classTemplateLabel", "This board is a class template")}
                          style={{ fontSize: "12px", fontWeight: "600", lineHeight: "18px", padding: "4px 12px", marginBottom: "16px" }}
                        />
                      )}
                      <div className="templateBannerSectionHeading">
                        {t("proposal.whatWillBeUpdated", "What will be updated")}
                      </div>
                      <p className="templateBannerSectionBody">
                        {t("proposal.whatWillBeUpdatedBody", "Section names and order, card titles and positions, linked assignments/resources/tasks/studies, and card settings (e.g. report and review options).")}
                      </p>
                    </div>
                    <div className="templateBannerSection">
                      <div className="templateBannerSectionHeading">
                        {t("proposal.whatWillNotChange", "What will NOT change")}
                      </div>
                      <p className="templateBannerSectionBody">
                        {t("proposal.whatWillNotChangeBody", "Students' own written answers, comments, submissions, and progress status on each card.")}
                      </p>
                    </div>
                    <div className="templateBannerToggleRow">
                      <Checkbox
                        toggle
                        checked={!!autoUpdateStudentBoards}
                        onChange={(_, { checked }) => onAutoUpdateChange?.(!!checked)}
                        label={t("proposal.templateAutoUpdate", "Auto-update student boards")}
                      />
                      <InfoTooltip
                        position="topRight"
                        content={t("proposal.templateAutoUpdateHelp", "When on, structural changes, template-controlled card settings (except progress status), and optionally content are pushed to student boards after each save. Students' own answers and their progress status on each card are preserved. When off, use the button below to update when ready.")}
                      />
                    </div>
                    {!autoUpdateStudentBoards && (
                      <div className="templateBannerActions">
                        <Button
                          variant="primary"
                          className="templateBannerPrimaryBtn"
                          onClick={handleSaveAndUpdateStudentBoards}
                          disabled={applyLoading}
                        >
                          {applyLoading
                            ? t("proposal.updatingStudentBoards", "Updating student boards…")
                            : t("proposal.saveAndUpdateStudentBoards", "Save & Update student boards")}
                          {cloneCount > 0 && ` (${cloneCount})`}
                        </Button>
                      </div>
                    )}
                  </>
                )}
                {templateBannerSection === "studentSettings" && proposalBuildMode && (
                  <div className="templateBannerStudentSettings">
                    <h2 className="templateBannerStudentSettingsHeading">
                      {t("proposal.templateSectionStudentSettings", "Student settings")}
                    </h2>
                    <p className="templateBannerStudentSettingsHelp">
                      {t("proposal.advancedOptionsHelp", "Checking the boxes below enables students to modify the board. Check in with the MindHive team if you're unsure what this means.")}
                    </p>
                    <div className="templateBannerStudentSettingsItem">
                      <Checkbox
                        toggle
                        id="allowMovingSections"
                        name="allowMovingSections"
                        checked={!!inputs?.settings?.allowMovingSections}
                        onChange={(_, { name, checked }) => toggleSettingsBoolean({ target: { name, checked } })}
                        label={t("proposal.allowMovingSections", "Allow students to move sections")}
                      />
                    </div>
                    <div className="templateBannerStudentSettingsItem">
                      <Checkbox
                        toggle
                        id="allowMovingCards"
                        name="allowMovingCards"
                        checked={!!inputs?.settings?.allowMovingCards}
                        onChange={(_, { name, checked }) => toggleSettingsBoolean({ target: { name, checked } })}
                        label={t("proposal.allowMovingCards", "Allow students to move cards")}
                      />
                    </div>
                    <div className="templateBannerStudentSettingsItem">
                      <Checkbox
                        toggle
                        id="allowAddingSections"
                        name="allowAddingSections"
                        checked={!!inputs?.settings?.allowAddingSections}
                        onChange={(_, { name, checked }) => toggleSettingsBoolean({ target: { name, checked } })}
                        label={t("proposal.allowAddingSections", "Allow students to add/delete sections")}
                      />
                    </div>
                    <div className="templateBannerStudentSettingsItem">
                      <Checkbox
                        toggle
                        id="allowAddingCards"
                        name="allowAddingCards"
                        checked={!!inputs?.settings?.allowAddingCards}
                        onChange={(_, { name, checked }) => toggleSettingsBoolean({ target: { name, checked } })}
                        label={t("proposal.allowAddingCards", "Allow students to add/delete cards")}
                      />
                    </div>
                  </div>
                )}
                {templateBannerSection === "adminSettings" && user?.permissions?.map((p) => p?.name).includes("ADMIN") && (
                  <div className="templateBannerAdminSettings">
                    <h2 className="templateBannerAdminSettingsHeading">
                      {t("proposal.templateSectionAdminSettings", "Admin settings")}
                    </h2>
                    <div className="templateBannerAdminSettingsItem">
                      <Checkbox
                        toggle
                        id="isTemplate"
                        name="isTemplate"
                        checked={!!inputs.isTemplate}
                        onChange={(_, { name }) => toggleBoolean({ target: { name } })}
                        label={t("proposal.makeTemplate", "Make this project board a public template")}
                      />
                    </div>
                  </div>
                )}
                {templateBannerSection === "boardType" && (
                  <div className="templateBannerBoardTypeOptions">
                    <p className="templateBannerBoardTypeIntro">
                      {t("proposal.boardTypeIntro", "Please indicate here if this board manages a MindHive or YouQuantified project.")}
                    </p>
                    <p className="templateBannerBoardTypeMentorNote">
                      {t("proposal.boardTypeMentorNote", "This is relevant for mentors giving feedback to your student boards. If you have any questions, please contact a MindHive member.")}
                    </p>
                    <div
                      role="button"
                      tabIndex={0}
                      className={`templateBannerBoardTypeOption ${boardTypeSelection === 'mindhive' ? 'templateBannerBoardTypeOptionSelected' : ''}`}
                      onClick={() => handleMultipleUpdate({ settings: { ...inputs.settings, curriculumType: 'mindhive' } })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleMultipleUpdate({ settings: { ...inputs.settings, curriculumType: 'mindhive' } });
                        }
                      }}
                      aria-pressed={boardTypeSelection === 'mindhive'}
                    >
                      <div className="templateBannerBoardTypeOptionLogos">
                        <img src="/logo.png" alt="" className="templateBannerBoardTypeLogo" />
                      </div>
                      {/* <span className="templateBannerBoardTypeOptionLabel">
                        {t("proposal.boardTypeMindHive", "MindHive")}
                      </span> */}
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      className={`templateBannerBoardTypeOption ${boardTypeSelection === 'youquantified' ? 'templateBannerBoardTypeOptionSelected' : ''}`}
                      onClick={() => handleMultipleUpdate({ settings: { ...inputs.settings, curriculumType: 'youquantified' } })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleMultipleUpdate({ settings: { ...inputs.settings, curriculumType: 'youquantified' } });
                        }
                      }}
                      aria-pressed={boardTypeSelection === 'youquantified'}
                    >
                      <div className="templateBannerBoardTypeOptionLogos">
                        <img src="/logo_yq.svg" alt="" className="templateBannerBoardTypeLogo" />
                      </div>
                      {/* <span className="templateBannerBoardTypeOptionLabel">
                        {t("proposal.boardTypeYouQuantified", "YouQuantified")}
                      </span> */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      </div>
    </div>
  );
}
