import { UPDATE_PROPOSAL_BOARD } from "../../../../../Mutations/Proposal";

import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../../../../Queries/Proposal";

import { useMutation, useApolloClient } from "@apollo/client";

import useForm from "../../../../../../lib/useForm";

import { Icon, Radio } from "semantic-ui-react";

import useTranslation from "next-translate/useTranslation";

import exportPDF from "../PDF/exportPDF";
import InfoTooltip from "../PDF/Preview/InfoTooltip";

import { useRef, useState } from "react";

import AddCollaboratorModal from "./AddCollaboratorModal";

export default function ProposalHeader({
  user,
  proposal,
  proposalBuildMode,
  refetchQueries,
  isPDF,
  setIsPDF,
  hasUnsavedChangesInPDFView = false,
  selectedStatuses = [],
  selectedReviewSteps = [],
  selectedAssignedUsers = [],
}) {
  const { t } = useTranslation("builder");
  const client = useApolloClient();
  const titleInputRef = useRef(null);
  const studyId = proposal?.study?.id;
  const isLinked = !!proposal?.study?.id;
  const studyTitle = proposal?.study?.title || "";
  const collaborators = proposal?.collaborators || [];
  const proposalId = proposal?.id;
  const [showFullStudyName, setShowFullStudyName] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);

  // save and edit the study information
  const { inputs, handleChange, toggleBoolean, toggleSettingsBoolean } =
    useForm({
      ...proposal,
    });

  const [updateProposal, { loading }] = useMutation(UPDATE_PROPOSAL_BOARD, {
    variables: {
      id: proposal?.id,
      ...inputs,
    },
    refetchQueries: [
      { query: OVERVIEW_PROPOSAL_BOARD_QUERY, variables: { id: proposal?.id } },
      ...refetchQueries,
    ],
  });

  const handleEditIconClick = () => {
    if (proposalBuildMode && titleInputRef.current) {
      titleInputRef.current.focus();
    } else if (!proposalBuildMode) {
      setIsTitleEditing(true);
    }
  };

  const handleDownload = () => {
    if (proposalId && client) {
      exportPDF(
        proposalId,
        client,
        t,
        selectedStatuses,
        selectedReviewSteps,
        selectedAssignedUsers
      );
    }
  };

  const handleAddCollaboratorClick = () => {
    // Show modal if user has classes and proposal has a class
    const userHasClasses = 
      (user?.studentIn?.length > 0) ||
      (user?.mentorIn?.length > 0) ||
      (user?.teacherIn?.length > 0);
    
    if (userHasClasses) {
      setShowCollaboratorModal(true);
    }
  };

  const handleSwitchToBoardView = () => {
    if (isPDF && hasUnsavedChangesInPDFView && !window.confirm(t("proposalPage.confirmLeaveListView", "Do you want to leave the list view and go back to the board? Your unsaved changes will be lost."))) {
      return;
    }
    setIsPDF(false);
  };

  return (
    <div className="header">
      <div className="headerContent">
        {!proposalBuildMode && (
          <div className="headerMainContent">
            <div className="headerLeftSection">
              <div className="headerTitleRow">
                {isTitleEditing ? (
                  <button 
                    className="headerEditIcon" 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (inputs.title !== proposal?.title) {
                        updateProposal({
                          variables: {
                            id: proposal?.id,
                            ...inputs,
                          },
                        }).then(() => {
                          setIsTitleEditing(false);
                        });
                      } else {
                        setIsTitleEditing(false);
                      }
                    }}
                    aria-label="Save title"
                    disabled={loading}
                    style={{
                      minWidth: "60px",
                      padding: "0 12px",
                      fontFamily: "Inter, sans-serif",
                      letterSpacing: "0.15px",
                    }}
                  >
                    {loading ? (
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#171717" }}>{t("header.saving", "Saving")}</span>
                    ) : (
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#171717" }}>{t("header.save", "Save")}</span>
                    )}
                  </button>
                ) : (
                  <button 
                    className="headerEditIcon" 
                    onClick={handleEditIconClick}
                    aria-label="Edit title"
                  >
                    <img 
                        src="/assets/icons/pencil.svg"
                        alt="Edit"
                        className="headerEditIcon"
                      />
                  </button>
                )}
                {isTitleEditing ? (
                  <input
                    type="text"
                    name="title"
                    value={inputs.title || ""}
                    onChange={handleChange}
                    onBlur={() => {
                      setIsTitleEditing(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (inputs.title !== proposal?.title) {
                          updateProposal({
                            variables: {
                              id: proposal?.id,
                              ...inputs,
                            },
                          }).then(() => {
                            setIsTitleEditing(false);
                          });
                        } else {
                          setIsTitleEditing(false);
                        }
                      } else if (e.key === "Escape") {
                        handleChange({ target: { name: "title", value: proposal?.title || "" } });
                        setIsTitleEditing(false);
                      }
                    }}
                    className="headerTitle"
                    style={{ 
                      fontFamily: "Inter, sans-serif",
                      fontStyle: "normal",
                      fontWeight: 600,
                      fontSize: "36px",
                      lineHeight: "44px",
                      letterSpacing: "0.15px",
                      color: "#171717",
                      margin: 0,
                      flex: 1,
                      background: "white",
                      border: "1px solid #e6e6e6",
                      borderRadius: "4px",
                      padding: "4px 8px"
                    }}
                    autoFocus
                  />
                ) : (
                  <div className="headerTitleWrapper">
                    <InfoTooltip
                      content={inputs.title || proposal?.title || t("header.myProjectBoard", "My Project Board")}
                      delayMs={650}
                      wrapperStyle={{ width: "100%", minWidth: 0 }}
                      tooltipStyle={{
                        width: "400px",
                        background: "#F7F9F8",
                      }}
                    >
                      <h1 className="headerTitle">
                        {inputs.title || proposal?.title || t("header.myProjectBoard", "My Project Board")}
                      </h1>
                    </InfoTooltip>
                  </div>
                )}
              </div>
              
              <div className="headerInfoRow">
                <button 
                  className={`studyLinkChip ${isLinked ? "list" : "board"}`}
                  onClick={() => {
                    setShowFullStudyName(!showFullStudyName);
                  }}
                  disabled={false}
                >
                  <div className="studyLinkChipContent">
                    <img 
                      src={isLinked ? "/assets/icons/link.svg" : "/assets/icons/unlink.svg"} 
                      alt={isLinked ? "Link" : "Unlink"}
                      className="studyLinkIcon"
                    />
                    <span className="studyLinkText">
                      {isLinked 
                        ? (showFullStudyName 
                          ? studyTitle
                          : t("header.linked", "Linked"))
                        : t("header.unlinked", "Unlinked")
                      }
                    </span>
                  </div>
                </button>
                
                <div className="collaboratorArray">
                  {collaborators.map((collab) => (
                    <div key={collab?.id} className="collaboratorChip">
                      <span >{collab?.username || ""}</span>
                    </div>
                  ))}
                  {(() => {
                    const userHasClasses = 
                      (user?.studentIn?.length > 0) ||
                      (user?.mentorIn?.length > 0) ||
                      (user?.teacherIn?.length > 0);
                    
                    return userHasClasses ? (
                      <button
                        className="addCollaboratorButton"
                        aria-label="Add collaborator"
                        onClick={handleAddCollaboratorClick}
                      >
                        <img src="/assets/icons/plus.svg" alt="Add" />
                      </button>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* View toggle and download row: underneath collaborators, left-aligned; toggle left, download right */}
              <div className="viewToggleDownloadRow" style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "12px", width: "100%" }}>
                <div className="viewToggleGroup">
                  <button
                    onClick={handleSwitchToBoardView}
                    className={`viewToggleButton left ${!isPDF ? "active" : "inactive"}`}
                  >
                    <img src="/assets/icons/pencil.svg" alt="Edit" />
                    <span>{t("proposalPage.viewBoard", "Board View")}</span>
                  </button>
                  <button
                    onClick={() => setIsPDF(true)}
                    className={`viewToggleButton right ${isPDF ? "active" : "inactive"}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.75 10.4166L17.2812 8.93748L10.4167 15.8021L7.71875 13.1146L6.25 14.5833L10.4167 18.75L18.75 10.4166ZM19.7917 4.16665H15.4375C15 2.95831 13.8542 2.08331 12.5 2.08331C11.1458 2.08331 10 2.95831 9.5625 4.16665H5.20833C5.0625 4.16665 4.92708 4.17706 4.79167 4.20831C4.38542 4.29165 4.02083 4.49998 3.73958 4.78123C3.55208 4.96873 3.39583 5.1979 3.29167 5.4479C3.1875 5.68748 3.125 5.95831 3.125 6.24998V20.8333C3.125 21.1146 3.1875 21.3958 3.29167 21.6458C3.39583 21.8958 3.55208 22.1146 3.73958 22.3125C4.02083 22.5937 4.38542 22.8021 4.79167 22.8854C4.92708 22.9062 5.0625 22.9166 5.20833 22.9166H19.7917C20.9375 22.9166 21.875 21.9791 21.875 20.8333V6.24998C21.875 5.10415 20.9375 4.16665 19.7917 4.16665ZM12.5 3.90623C12.9271 3.90623 13.2812 4.2604 13.2812 4.68748C13.2812 5.11456 12.9271 5.46873 12.5 5.46873C12.0729 5.46873 11.7188 5.11456 11.7188 4.68748C11.7188 4.2604 12.0729 3.90623 12.5 3.90623ZM19.7917 20.8333H5.20833V6.24998H19.7917V20.8333Z" fill="#336F8A"/>
                    </svg>
                    <span>{t("proposalPage.viewFlattenBoard", "List View")}</span>
                  </button>
                </div>
                {isPDF ? (
                  <InfoTooltip
                    content={t("proposalPage.downloadTooltip", "Download content is based on the status and review step filters selected below.")}
                    tooltipStyle={{
                      // width: "250px",
                      // background: "#FDF2D0",
                      // borderRadius: "8px",
                      // border: "none",
                    }}
                  >
                    <div
                      onClick={handleDownload}
                      className="downloadButton"
                      style={{
                        position: "relative",
                        cursor: "pointer",
                      }}
                    >
                      <img
                        src="/assets/icons/download.svg"
                        alt=""
                        style={{ width: 18, height: 18 }}
                      />
                      <span className="downloadButtonText">
                        {t("proposalPage.download", "Download")}
                      </span>
                    </div>
                  </InfoTooltip>
                ) : (
                  <div
                    className="downloadButton"
                    style={{
                      visibility: "hidden",
                      cursor: "default",
                    }}
                  >
                    <img
                      src="/assets/icons/download.svg"
                      alt=""
                      style={{ width: 18, height: 18 }}
                    />
                    <span className="downloadButtonText">
                      {t("proposalPage.download", "Download")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="headerRightSection">
              {/* Commented out: download + toggle moved underneath collaborator array (toggle left, download right)
              <div
                onClick={handleDownload}
                className="downloadButton"
                style={{
                  position: "relative",
                  visibility: isPDF ? "visible" : "hidden",
                  cursor: isPDF ? "pointer" : "default"
                }}
                onMouseEnter={(e) => {
                  if (isPDF) {
                    const tooltip = e.currentTarget.querySelector('.hover-tooltip');
                    if (tooltip) {
                      tooltip.style.opacity = "1";
                      tooltip.style.transform = "translateY(0)";
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  if (isPDF) {
                    const tooltip = e.currentTarget.querySelector('.hover-tooltip');
                    if (tooltip) {
                      tooltip.style.opacity = "0";
                      tooltip.style.transform = "translateY(-5px)";
                    }
                  }
                }}
              >
                <span className="downloadButtonText">
                  {t("proposalPage.download", "Download")}
                </span>
                <Icon name="download" />

                {isPDF && (
                  <div
                    className="hover-tooltip"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "0",
                      right: "0",
                      width: "250px",
                      background: "#FDF2D0",
                      color: "#625B71",
                      marginTop: "8px",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontFamily: "Inter, sans-serif",
                      lineHeight: "20px",
                      opacity: "0",
                      transform: "translateY(-5px)",
                      transition: "all 0.3s ease",
                      pointerEvents: "none",
                      zIndex: 1000,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.10)",
                    }}
                  >
                    <span>{t("proposalPage.downloadTooltip", "Download content is based on the status and review step filters selected below.")}</span>
                  </div>
                )}
              </div>

              <div className="viewToggleGroup">
                <button
                  onClick={handleSwitchToBoardView}
                  className={`viewToggleButton left ${!isPDF ? "active" : "inactive"}`}
                >
                  <img src="/assets/icons/pencil.svg" alt="Edit" />
                  <span>{t("proposalPage.viewBoard", "Board View")}</span>
                </button>
                <button
                  onClick={() => setIsPDF(true)}
                  className={`viewToggleButton right ${isPDF ? "active" : "inactive"}`}
                >
                  <svg width="18" height="18" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.75 10.4166L17.2812 8.93748L10.4167 15.8021L7.71875 13.1146L6.25 14.5833L10.4167 18.75L18.75 10.4166ZM19.7917 4.16665H15.4375C15 2.95831 13.8542 2.08331 12.5 2.08331C11.1458 2.08331 10 2.95831 9.5625 4.16665H5.20833C5.0625 4.16665 4.92708 4.17706 4.79167 4.20831C4.38542 4.29165 4.02083 4.49998 3.73958 4.78123C3.55208 4.96873 3.39583 5.1979 3.29167 5.4479C3.1875 5.68748 3.125 5.95831 3.125 6.24998V20.8333C3.125 21.1146 3.1875 21.3958 3.29167 21.6458C3.39583 21.8958 3.55208 22.1146 3.73958 22.3125C4.02083 22.5937 4.38542 22.8021 4.79167 22.8854C4.92708 22.9062 5.0625 22.9166 5.20833 22.9166H19.7917C20.9375 22.9166 21.875 21.9791 21.875 20.8333V6.24998C21.875 5.10415 20.9375 4.16665 19.7917 4.16665ZM12.5 3.90623C12.9271 3.90623 13.2812 4.2604 13.2812 4.68748C13.2812 5.11456 12.9271 5.46873 12.5 5.46873C12.0729 5.46873 11.7188 5.11456 11.7188 4.68748C11.7188 4.2604 12.0729 3.90623 12.5 3.90623ZM19.7917 20.8333H5.20833V6.24998H19.7917V20.8333Z" fill="#336F8A"/>
                  </svg>
                  <span>{t("proposalPage.viewFlattenBoard", "List View")}</span>
                </button>
              </div>
              */}
            </div>
          </div>
        )}

        {proposalBuildMode && (
          <div>
            <div className="headerTitleRow">
              <button 
                className="headerEditIcon" 
                onClick={handleEditIconClick}
                aria-label="Edit title"
              >
                <Icon name="pencil" />
              </button>
              <label htmlFor="title" style={{ flex: 1 }}>
                <input
                  ref={titleInputRef}
                  type="text"
                  id="propsalTitle"
                  name="title"
                  value={inputs.title}
                  onChange={handleChange}
                  required
                  className="title"
                  placeholder={t("header.titlePlaceholder", "Enter project board title")}
                />
              </label>
            </div>

            <div>
              <label htmlFor="description">
                <textarea
                  id="description"
                  name="description"
                  value={inputs.description}
                  onChange={handleChange}
                  rows="1"
                  className="description"
                  placeholder={t("header.descriptionPlaceholder", "Enter project board description")}
                />
              </label>
            </div>

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
                      <span>{t("header.publicTemplate", "Public template")}</span>
                    </div>
                  </label>
                </div>
              </>
            )}

            {/* <div>
              <label htmlFor="isSubmitted">
                <div className="checkboxField">
                  <input
                    type="checkbox"
                    id="isSubmitted"
                    name="isSubmitted"
                    checked={inputs?.isSubmitted || false}
                    onChange={toggleBoolean}
                  />
                  <span>Submit as a template</span>
                </div>
              </label>
            </div> */}

            <div>
              <label htmlFor="allowMovingSections">
                <div className="checkboxField">
                  <input
                    type="checkbox"
                    id="allowMovingSections"
                    name="allowMovingSections"
                    checked={inputs?.settings?.allowMovingSections || false}
                    onChange={toggleSettingsBoolean}
                  />
                  <span>{t("header.allowMovingSections", "Allow moving sections")}</span>
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
                  <span>{t("header.allowMovingCards", "Allow moving cards")}</span>
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
                    checked={inputs?.settings?.allowAddingSections || false}
                    onChange={toggleSettingsBoolean}
                  />
                  <span>{t("header.allowAddingSections", "Allow adding new sections")}</span>
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
                  <span>{t("header.allowAddingCards", "Allow adding new cards")}</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {!isTitleEditing && (inputs.description !== proposal?.description ||
          inputs.isTemplate !== proposal?.isTemplate ||
          inputs.settings !== proposal?.settings ||
          inputs.isSubmitted !== proposal?.isSubmitted) && (
          <div>
            <button
              className="secondaryBtn"
              onClick={async () => {
                const res = await updateProposal();
              }}
            >
              {loading ? t("header.saving", "Saving") : t("header.save", "Save")}
            </button>
          </div>
        )}
      </div>
      {showCollaboratorModal && (
        <AddCollaboratorModal
          proposal={proposal}
          user={user}
          onClose={() => setShowCollaboratorModal(false)}
          refetchQueries={refetchQueries}
        />
      )}
    </div>
  );
}
