import { UPDATE_PROPOSAL_BOARD } from "../../Mutations/Proposal";

import { useMutation } from "@apollo/client";

import useForm from "../../../lib/useForm";

import {
  AccordionTitle,
  AccordionContent,
  Accordion,
  Icon,
  Checkbox,
} from "semantic-ui-react";
import { useState } from "react";
import useTranslation from 'next-translate/useTranslation';
import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../Queries/Proposal";
import InfoTooltip from "../../Builder/Project/ProjectBoard/Board/PDF/Preview/InfoTooltip";

export default function ProposalHeader({
  user,
  proposal,
  proposalBuildMode,
  refetchQueries,
  onAutoUpdateChange,
  autoUpdateStudentBoards,
  propagateToClones,
}) {
  const { t } = useTranslation('builder');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [templateBannerExpanded, setTemplateBannerExpanded] = useState(false);
  const isTemplateWithClones =
    proposalBuildMode &&
    proposal?.prototypeFor?.length > 0;
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
  const { inputs, handleChange, toggleBoolean, toggleSettingsBoolean } =
    useForm({
      ...proposal,
    });

  const [updateProposal, { loading }] = useMutation(UPDATE_PROPOSAL_BOARD, {
    variables: {
      ...inputs,
    },
    refetchQueries: [
      { query: OVERVIEW_PROPOSAL_BOARD_QUERY, variables: { id: proposal?.id } },
      ...refetchQueries,
    ],
  });

  return (
    <div className="header">
      <div>
      {isTemplateWithClones && (
          <div className="templateBanner">
            <div className="templateBannerHeader">
              <div className="templateBannerHeaderLeft">
                <div className="templateBannerTitle">
                  {t("proposal.editingClassProjectTemplateTitle", "Editing Class Project Template")}
                </div>
                <div className="templateBannerSubtitle">
                  {t("proposal.editingClassProjectTemplateSubtitle", "Changes can be applied to all student boards.")}
                </div>
              </div>
              <button
                type="button"
                className="templateBannerHeaderToggle"
                onClick={() => setTemplateBannerExpanded(!templateBannerExpanded)}
                aria-expanded={templateBannerExpanded}
                aria-label={t("proposal.expandCollapseTemplateBanner", "Expand or minimize template section")}
              >
                <span style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
              </button>
            </div>
            {templateBannerExpanded && (
            <div className="templateBannerContent">
              <div className="templateBannerSection">
                <div className="templateBannerSectionHeading">
                  {t("proposal.whatWillBeUpdated", "What will be updated")}
                  {/* <InfoTooltip
                    content={t("proposal.saveAndUpdateStudentBoardsHelp", "Will update: section names and order, card titles and positions, linked assignments/resources/tasks/studies. Will NOT change: students' own written answers, comments, and submissions.")}
                  /> */}
                </div>
                <p className="templateBannerSectionBody">
                  {t("proposal.whatWillBeUpdatedBody", "Section names and order, card titles and positions, linked assignments/resources/tasks/studies.")}
                </p>
              </div>
              <div className="templateBannerSection">
                <div className="templateBannerSectionHeading">
                  {t("proposal.whatWillNotChange", "What will NOT change")}
                </div>
                <p className="templateBannerSectionBody">
                  {t("proposal.whatWillNotChangeBody", "Students' own written answers, comments, and submissions.")}
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
                  tooltipStyle={{
                    background: "#F3F3F3",
                    borderRadius: "8px",
                    border: "1px solid #5D5763",
                  }}
                  content={t("proposal.templateAutoUpdateHelp", "When on, structural and content changes are pushed to student boards after each save. When off, use the button below to update when ready.")}

                />
              </div>
              {!autoUpdateStudentBoards && (
                <div className="templateBannerActions">
                  <button
                    type="button"
                    className="templateBannerPrimaryBtn"
                    onClick={handleSaveAndUpdateStudentBoards}
                    disabled={applyLoading}
                  >
                    {applyLoading
                      ? t("proposal.updatingStudentBoards", "Updating student boards…")
                      : t("proposal.saveAndUpdateStudentBoards", "Save & Update student boards")}
                    {cloneCount > 0 && ` (${cloneCount})`}
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        )}

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

        <div className="subtitle">
          {t('proposal.subtitle', 'This board will guide your students through their MindHive project step by step')}
        </div>

        
        {proposalBuildMode && (
          <div>
            <Accordion>
              <AccordionTitle
                active={activeIndex === 1}
                index={1}
                onClick={() => {
                  setActiveIndex(activeIndex === 1 ? 0 : 1);
                }}
              >
                <Icon name="dropdown" />
                {t('proposal.advancedOptions', 'Advanced options')}
              </AccordionTitle>
              <AccordionContent active={activeIndex === 1}>
                <>
                  {user?.permissions.map((p) => p?.name).includes("ADMIN") && (
                    <>
                      <div>
                        <label htmlFor="isTemplate">
                          <div className="checkboxField">
                            <input
                              type="checkbox"
                              id="isTemplate"
                              name="isTemplate"
                              checked={inputs.isTemplate}
                              onChange={toggleBoolean}
                            />
                            <span>{t('proposal.makeTemplate', 'Make this project board a public template')}</span>
                          </div>
                        </label>
                      </div>
                    </>
                  )}

                  <h2>{t('proposal.advancedOptionsHelp', "Checking the boxes below enables students to modify the board. Check in with the MindHive team if you're unsure what this means.")}</h2>

                  <div>
                    <label htmlFor="allowMovingSections">
                      <div className="checkboxField">
                        <input
                          type="checkbox"
                          id="allowMovingSections"
                          name="allowMovingSections"
                          checked={
                            inputs?.settings?.allowMovingSections || false
                          }
                          onChange={toggleSettingsBoolean}
                        />
                        <span>{t('proposal.allowMovingSections', 'Allow students to move sections')}</span>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label htmlFor="allowMovingCards">
                      <div className="checkboxField">
                        <input
                          type="checkbox"
                          id="allowMovingCards"
                          name="allowMovingCards"
                          checked={inputs?.settings?.allowMovingCards || false}
                          onChange={toggleSettingsBoolean}
                        />
                        <span>{t('proposal.allowMovingCards', 'Allow students to move cards')}</span>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label htmlFor="allowAddingSections">
                      <div className="checkboxField">
                        <input
                          type="checkbox"
                          id="allowAddingSections"
                          name="allowAddingSections"
                          checked={
                            inputs?.settings?.allowAddingSections || false
                          }
                          onChange={toggleSettingsBoolean}
                        />
                        <span>{t('proposal.allowAddingSections', 'Allow students to add/delete sections')}</span>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label htmlFor="allowAddingCards">
                      <div className="checkboxField">
                        <input
                          type="checkbox"
                          id="allowAddingCards"
                          name="allowAddingCards"
                          checked={inputs?.settings?.allowAddingCards || false}
                          onChange={toggleSettingsBoolean}
                        />
                        <span>{t('proposal.allowAddingCards', 'Allow students to add/delete cards')}</span>
                      </div>
                    </label>
                  </div>
                </>
              </AccordionContent>
            </Accordion>
          </div>
        )}

        {(inputs.title !== proposal?.title ||
          inputs.description !== proposal?.description ||
          inputs.isTemplate !== proposal?.isTemplate ||
          inputs.settings !== proposal?.settings ||
          inputs.isSubmitted !== proposal?.isSubmitted) && (
          <div>
            <button
              className="secondaryBtn"
              onClick={async () => {
                setIsTitleEditing(false);
                const res = await updateProposal();
              }}
            >
              {loading ? t('proposal.saving', 'Saving') : t('proposal.save', 'Save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
