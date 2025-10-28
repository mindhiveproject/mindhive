import { useRef, useState } from "react";
import { useMutation, useApolloClient, gql } from "@apollo/client";
import { Checkbox, Dropdown, Modal, Button, Popup } from "semantic-ui-react";
import {
  UPDATE_CARD_CONTENT,
  UPDATE_CARD_EDIT,
} from "../../Mutations/Proposal";
import {
  GET_SECTIONS_BY_BOARD,
  GET_CARDS_BY_SECTION,
  CLASS_PROJECTS_QUERY,
} from "../../Queries/Proposal";

import useForm from "../../../lib/useForm";
import TipTapEditor from "../../TipTap/Main";

import CardType from "./Forms/Type";
import LinkedItems from "./Forms/LinkedItems";
import useTranslation from "next-translate/useTranslation";

const peerReviewOptions = [
  {
    key: "actionSubmit",
    text: "Proposal",
    value: "ACTION_SUBMIT",
  },
  {
    key: "actionPeerFeedback",
    text: "Peer Feedback",
    value: "ACTION_PEER_FEEDBACK",
  },
  {
    key: "actionCollectingData",
    text: "Collecting Data",
    value: "ACTION_COLLECTING_DATA",
  },
  {
    key: "actionProjectReport",
    text: "Project Report",
    value: "ACTION_PROJECT_REPORT",
  },
];

export default function BuilderProposalCard({
  user,
  proposal,
  proposalCard,
  closeCard,
}) {
  const { t } = useTranslation("classes");
  const { inputs, handleChange } = useForm({
    ...proposalCard,
  });

  const description = useRef(proposalCard?.description);
  const content = useRef(proposalCard?.content);
  const internalContent = useRef(proposalCard?.internalContent);

  const [updateCard, { loading: updateLoading }] =
    useMutation(UPDATE_CARD_CONTENT);
  const [updateClonedCard, { loading: updateClonedLoading }] =
    useMutation(UPDATE_CARD_EDIT);

  const client = useApolloClient();
  const [showCloneDialog, setShowCloneDialog] = useState(false);

  // Update card content in the local state
  const handleContentChange = async ({ contentType, newContent }) => {
    if (contentType === "description") {
      description.current = newContent;
    }
    if (contentType === "internalContent") {
      internalContent.current = newContent;
    }
    if (contentType === "content") {
      content.current = newContent;
    }
  };

  // Handler to update all clones
  const updateClones = async () => {
    if (!proposal?.prototypeFor?.length) return;

    // FIXED: Use original (pre-update) titles for fallback matching
    const originalSectionTitle = proposalCard?.section?.title;
    const originalCardTitle = proposalCard?.title;
    const originalBoardId = proposal?.id;
    const originalCardPublicId = proposalCard?.publicId;

    if (!originalCardPublicId) {
      console.warn("Missing publicId for card; falling back to title matching");
    }

    if (!originalSectionTitle || !originalCardTitle) {
      console.warn("Missing section or card title for fallback matching");
    }

    // Collect all matching card IDs across clones
    const cardIds = [];

    // NEW: Primary logic - Direct query for clone cards by publicId (efficient, single query)
    if (originalCardPublicId) {
      try {
        const { data: directData } = await client.query({
          query: gql`
            query GetCloneCardsByPublicId(
              $publicId: String!
              $originalBoardId: ID!
            ) {
              proposalCards(
                where: {
                  publicId: { equals: $publicId }
                  section: {
                    board: { clonedFrom: { id: { equals: $originalBoardId } } }
                  }
                }
              ) {
                id
              }
            }
          `,
          variables: {
            publicId: originalCardPublicId,
            originalBoardId: originalBoardId,
          },
          fetchPolicy: "network-only",
        });

        const directCards = directData?.proposalCards || [];
        if (directCards.length > 0) {
          directCards.forEach((card) => cardIds.push(card.id));
          console.log(`Found ${directCards.length} clone cards via publicId`);
        } else {
          console.log(
            "No clone cards found via publicId; falling back to title matching"
          );
        }
      } catch (error) {
        console.error("Failed to query clone cards by publicId:", error);
      }
    }

    // FALLBACK: If no matches via publicId (e.g., legacy clones), use title-based loop
    if (cardIds.length === 0 && originalSectionTitle && originalCardTitle) {
      for (const clone of proposal.prototypeFor) {
        let matchingCardId = null;

        try {
          // Step 1: Query sections for this clone board
          const { data: sectionsData } = await client.query({
            query: GET_SECTIONS_BY_BOARD,
            variables: { boardId: clone.id },
            fetchPolicy: "network-only",
          });

          const sections = sectionsData?.proposalSections || [];
          const fallbackSection = sections.find(
            (sec) => sec.title === originalSectionTitle
          );

          if (fallbackSection) {
            // Step 2: Query cards for the fallback section
            const { data: cardsData } = await client.query({
              query: GET_CARDS_BY_SECTION,
              variables: { sectionId: fallbackSection.id },
              fetchPolicy: "network-only",
            });

            const cards = cardsData?.proposalCards || [];
            const fallbackCard = cards.find(
              (card) => card.title === originalCardTitle
            );

            if (fallbackCard) {
              matchingCardId = fallbackCard.id;
            } else {
              console.warn(
                `No matching card found in clone ${clone.id} (section: ${fallbackSection.id}) for title "${originalCardTitle}"`
              );
            }
          } else {
            console.warn(
              `No matching section found in clone ${clone.id} for title "${originalSectionTitle}"`
            );
          }
        } catch (error) {
          console.error(
            `Failed to process fallback in clone ${clone.id}:`,
            error
          );
        }

        if (matchingCardId) {
          cardIds.push(matchingCardId);
        }
      }
    }

    // Compute diffs for relational fields (once, before updating clones)
    // Extract original IDs from proposalCard
    const originalResources = proposalCard?.resources || [];
    const originalAssignments = proposalCard?.assignments || [];
    const originalTasks = proposalCard?.tasks || [];
    const originalStudies = proposalCard?.studies || [];

    const currentResources = inputs?.resources || [];
    const currentAssignments = inputs?.assignments || [];
    const currentTasks = inputs?.tasks || [];
    const currentStudies = inputs?.studies || [];

    // Helper to compute disconnect/connect IDs
    const computeDiff = (originalItems, currentItems) => {
      const originalIds = originalItems.map((item) => item.id);
      const currentIds = currentItems.map((item) => item.id);
      const toDisconnect = originalIds.filter((id) => !currentIds.includes(id));
      const toConnect = currentIds.filter((id) => !originalIds.includes(id));
      return { toDisconnect, toConnect };
    };

    const resourcesDiff = computeDiff(originalResources, currentResources);
    const assignmentsDiff = computeDiff(
      originalAssignments,
      currentAssignments
    );
    const tasksDiff = computeDiff(originalTasks, currentTasks);
    const studiesDiff = computeDiff(originalStudies, currentStudies);

    // Build relational update objects (only if changes)
    const buildRelationUpdate = (diff) => {
      const update = {};
      if (diff.toDisconnect.length > 0) {
        update.disconnect = diff.toDisconnect.map((id) => ({ id }));
      }
      if (diff.toConnect.length > 0) {
        update.connect = diff.toConnect.map((id) => ({ id }));
      }
      return Object.keys(update).length > 0 ? update : null;
    };

    const resourcesUpdate = buildRelationUpdate(resourcesDiff);
    const assignmentsUpdate = buildRelationUpdate(assignmentsDiff);
    const tasksUpdate = buildRelationUpdate(tasksDiff);
    const studiesUpdate = buildRelationUpdate(studiesDiff);

    // Build updateData with description, title (propagate title changes), settings (propagate settings changes), and conditional relational updates
    const updateData = {
      description: description.current,
      title: inputs?.title, // Propagate title changes to clones for consistency
      settings: inputs?.settings, // Propagate settings to clones for consistency
      ...(resourcesUpdate && { resources: resourcesUpdate }),
      ...(assignmentsUpdate && { assignments: assignmentsUpdate }),
      ...(tasksUpdate && { tasks: tasksUpdate }),
      ...(studiesUpdate && { studies: studiesUpdate }),
    };

    // Update each cloned card individually using UPDATE_CARD_EDIT
    if (cardIds.length > 0) {
      for (const cardId of cardIds) {
        try {
          await updateClonedCard({
            variables: {
              id: cardId,
              input: updateData,
            },
          });
          console.log(`Updated clone card ${cardId}`);
        } catch (error) {
          console.error(`Failed to update clone card ${cardId}:`, error);
        }
      }
      console.log(
        `Updated ${cardIds.length} cloned cards: ${cardIds.join(", ")}`
      );
    } else {
      console.warn("No matching cards found to update in clones");
    }
  };

  // Update logic with clone check
  const onUpdateCard = async (updateClonesToo = false) => {
    await updateCard({
      variables: {
        ...inputs,
        description: description?.current,
        internalContent: internalContent?.current,
        content: content?.current,
        assignedTo: inputs?.assignedTo?.map((a) => ({ id: a?.id })),
        resources: inputs?.resources?.map((resource) => ({ id: resource?.id })),
        assignments: inputs?.assignments?.map((assignment) => ({
          id: assignment?.id,
        })),
        tasks: inputs?.tasks?.map((task) => ({ id: task?.id })),
        studies: inputs?.studies?.map((study) => ({ id: study?.id })),
      },
    });

    // If updating clones, do it now
    if (updateClonesToo) {
      await updateClones();
    }

    closeCard({ cardId: proposalCard?.id, lockedByUser: false });
  };

  // Trigger save with clone check
  const handleSave = async () => {
    if (proposal?.prototypeFor?.length > 0) {
      setShowCloneDialog(true);
    } else {
      await onUpdateCard(false);
    }
  };

  // Modal handlers
  const handleCloneYes = async () => {
    setShowCloneDialog(false);
    await onUpdateCard(true); // true flag to update clones
  };

  const handleCloneNo = () => {
    setShowCloneDialog(false);
    onUpdateCard(false);
  };

  // Calculate total linked items
  const totalLinked = [
    ...(inputs?.resources || []),
    ...(inputs?.assignments || []),
    ...(inputs?.tasks || []),
    ...(inputs?.studies || []),
  ].length;

  return (
    <div className="post">
      <div className="navigation-build-mode">
        <div className="left">
          <div
            className="icon"
            onClick={() =>
              closeCard({ cardId: proposalCard?.id, lockedByUser: false })
            }
          >
            <div className="selector">
              <img src="/assets/icons/back.svg" alt="back" />
            </div>
          </div>
        </div>
        <div className="middle">
          <span className="studyTitle">{proposal?.title}</span>
        </div>
        <div className="right">
          <div className="editModeMessage">
            {t("board.editMode", "You are in Edit Mode")}
          </div>
          <button
            onClick={handleSave}
            className="saveButton"
            disabled={updateLoading || updateClonedLoading}
          >
            {t("board.save", "Save")}
          </button>
        </div>
      </div>

      {/* Clone Update Modal */}
      <Modal open={showCloneDialog} onClose={handleCloneNo} size="medium" style={{ borderRadius: "12px", overflow: "hidden" }}>
        <Modal.Header style={{ background: "#f9fafb", borderBottom: "1px solid #e0e0e0", fontFamily: "Nunito", fontWeight: 600,
        }}>Update Cloned Boards?</Modal.Header>
        <Modal.Content style={{ background: "#ffffff", padding: "24px" }}>
          <p>
            This board has {proposal?.prototypeFor?.length} cloned project
            board(s). Do you want to update the corresponding cards in all
            cloned project boards with these changes? (This will update titles,
            descriptions, settings, and linked items: resources, assignments,
            tasks, and studies.)
          </p>
        </Modal.Content>
        <Modal.Actions style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }} >
          <Button
            style={{
              borderRadius: "100px",
              background: "white",
              fontSize: "16px",
              color: "#8A2CF6",
              border: "1px solid #8A2CF6",
              marginRight: "10px"
            }}
            onClick={handleCloneNo}
          >
            No, update only this board
          </Button>
          <Button
            loading={updateLoading || updateClonedLoading}
            style={{
              borderRadius: "100px",
              background: "#336F8A",
              fontSize: "16px",
              color: "white",
              border: "1px solid #336F8A",
              marginRight: "10px"
            }}
            onClick={handleCloneYes}
          >
            Yes, update all clones
          </Button>
        </Modal.Actions>
      </Modal>

      <div className="proposalCardBoard">
        <div className="textBoard">
          <label htmlFor="title">
            <div className="cardHeader">{t("board.expendedCard.title")}</div>
            <div className="cardSubheaderComment">
              {t(
                "board.expendedCard.titleText",
                "Add or edit the card title. This title will appear as a section header in student submissions to the Feedback Center if the box titled 'Include text input for Feedback Center' is checked."
              )}
            </div>
            <p></p>
            <input
              type="text"
              id="title"
              name="title"
              value={inputs?.title}
              onChange={handleChange}
            />
          </label>
          <label htmlFor="description">
            <div className="cardHeader">
              {t("board.expendedCard.instructions")}
            </div>
            <div className="cardSubheaderComment">
              {t(
                "board.expendedCard.instructionsText",
                "Add or edit instructions for students telling them how to complete the card."
              )}
            </div>
            <TipTapEditor
              content={description?.current}
              onUpdate={(newContent) =>
                handleContentChange({
                  contentType: "description",
                  newContent,
                })
              }
            />
          </label>

          {inputs?.settings?.includeInReport && (
            <>
              <label htmlFor="description">
                <div className="cardHeader">
                  {t("board.expendedCard.studentResponseBoxNetwork")}
                </div>
                <div className="cardSubheaderComment">
                  {t(
                    "board.expendedCard.studentResponseBoxNetworkText",
                    "The content students include here will be visible in the Feedback Center once it is submitted via an Action Card. Include any templates or placeholder text as needed"
                  )}
                </div>
                
                {/* Only show warning if proposal has child proposals */}
                {proposal?.prototypeFor?.length > 0 && (
                  <div 
                    style={{
                      position: "relative",
                      display: "flex",
                      width: "100%",
                      marginTop: "16px",
                      padding: "12px 16px",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexShrink: "0",
                      borderRadius: "8px",
                      background: "#EDCECD",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      const tooltip = e.currentTarget.querySelector('.hover-tooltip');
                      if (tooltip) {
                        tooltip.style.opacity = "1";
                        tooltip.style.transform = "translateY(0)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      const tooltip = e.currentTarget.querySelector('.hover-tooltip');
                      if (tooltip) {
                        tooltip.style.opacity = "0";
                        tooltip.style.transform = "translateY(-5px)";
                      }
                    }}
                  >
                    <p style={{
                      color: "#8F1F14",
                      fontFamily: "Nunito",
                      fontSize: "16px",
                      fontStyle: "normal",
                      fontWeight: "400",
                      lineHeight: "24px",
                      margin: 0,
                      }}>
                      {t("board.expendedCard.overwriteWarning", "")}
                    </p>

                    <div style={{
                      width: "20px",
                      height: "20px",
                      flexShrink: 0,
                    }}>
                      <img src="/assets/icons/info_red.svg" alt="warning" />
                    </div>

                    {/* Hover tooltip */}
                    <div 
                      className="hover-tooltip"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "0",
                        right: "0",
                        background: "#CF6D6A",
                        color: "white",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        fontSize: "16px",
                        fontFamily: "Nunito",
                        lineHeight: "20px",
                        opacity: "0",
                        transform: "translateY(-5px)",
                        transition: "all 0.3s ease",
                        pointerEvents: "none",
                        zIndex: 1000,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      }}
                    >
                      <span>{t("board.expendedCard.overwriteWarningDetails1", "Making changes in the Student Response box will overwrite any content added by your students, which may result in the loss of their progress. Only proceed if you are certain that no students have already started working on this card.")}</span>
                      <br /><br />
                      <span>{t("board.expendedCard.overwriteWarningDetails2", "If you are unsure or want to update instructions without affecting student progress, consider editing the Instruction field instead. You can use it to provide updated guidance or new placeholder content.")}</span>
                    </div>
                  </div>
                )}
              </label>
              <TipTapEditor
                content={content?.current}
                onUpdate={(newContent) =>
                  handleContentChange({
                    contentType: "content",
                    newContent,
                  })
                }
              />
            </>
          )}
        </div>
        <div className="infoBoard">
          <>
            <div className="cardHeader">
              {t("board.expendedCard.visibility")}
            </div>
            <div className="cardSubheaderComment">
              {t(
                "board.expendedCard.visibilityText",
                "Check the box below to indicate whether student responses should be made visible in the Feedback Center."
              )}
            </div>
            <div className="checkboxText">
              <Checkbox
                name="feedbackCenterCardToggle"
                id="feedbackCenterCardToggle"
                onChange={(event, data) =>
                  handleChange({
                    target: {
                      name: "settings",
                      value: {
                        ...inputs.settings,
                        includeInReport: data.checked,
                      },
                    },
                  })
                }
                checked={inputs?.settings?.includeInReport}
              />
              <label htmlFor="feedbackCenterCardToggle">
                <div className="cardDescription">
                  {t("board.expendedCard.includeTextFeedbackCenter")}
                </div>
              </label>
            </div>
          </>

          {inputs?.settings?.includeInReport && (
            <>
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <div className="cardSubheaderComment">
                  {t("board.reviewPhase")}
                </div>
                <Popup
                  content={
                    <p > {t("board.reviewPhaseDescription")} </p>
                  }
                  trigger={
                    <img
                      src="/assets/icons/question_mark.svg" // Next.js serves public/ as root
                      alt="info"
                      style={{
                        width: "16px",
                        height: "16px",
                        marginLeft: "4px",
                        cursor: "pointer",
                        verticalAlign: "middle",
                      }}
                    />
                  }
                />
              </div>
              <Dropdown
                placeholder={t("board.expendedCard.select")}
                fluid
                multiple
                search
                selection
                lazyLoad
                options={peerReviewOptions}
                onChange={(event, data) => {
                  handleChange({
                    target: {
                      name: "settings",
                      value: {
                        ...inputs.settings,
                        includeInReviewSteps: data.value,
                      },
                    },
                  });
                }}
                value={inputs?.settings?.includeInReviewSteps || []}
              />
            </>
          )}

          <div>
            <div className="cardHeader">{t("board.expendedCard.type")}</div>
            <CardType type={inputs?.type} handleChange={handleChange} />
          </div>

          <>
            <div className="cardHeader">
              {t("board.expendedCard.linkedItems", "Linked Items")}
            </div>
            <div className="cardSubheaderComment">
              {t(
                "board.expendedCard.addLinkedItems",
                "Add existing assignments, tasks, studies, or resources"
              )}
            </div>
            <LinkedItems
              proposal={proposal}
              user={user}
              handleChange={handleChange}
              selectedResources={inputs?.resources || []}
              selectedAssignments={inputs?.assignments || []}
              selectedTasks={inputs?.tasks || []}
              selectedStudies={inputs?.studies || []}
              totalLinked={totalLinked}
            />
          </>

          <div className="proposalCardComments">
            <div className="cardHeader">{t("board.expendedCard.comments")}</div>
            <div className="cardSubheaderComment">
              {t("board.expendedCard.commentsText")}
            </div>
            <TipTapEditor
              content={inputs.comment}
              placeholder={t("board.commentPlaceholder", "Enter a comment...")}
              onUpdate={(newContent) =>
                handleChange({
                  target: {
                    name: "comment",
                    value: newContent,
                  },
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
