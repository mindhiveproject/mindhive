import { useRef, useState } from "react";
import { useMutation, useApolloClient } from "@apollo/client";
import { Checkbox, Dropdown, Modal, Button } from "semantic-ui-react";
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

    const originalSectionTitle = proposalCard?.section?.title;
    const originalCardTitle = inputs?.title || proposalCard?.title;

    if (!originalSectionTitle || !originalCardTitle) {
      console.warn("Missing section or card title for matching clones");
      return;
    }

    // Collect all matching card IDs across clones
    const cardIds = [];

    for (const clone of proposal.prototypeFor) {
      try {
        // Step 1: Query sections for this clone board
        const { data: sectionsData } = await client.query({
          query: GET_SECTIONS_BY_BOARD,
          variables: { boardId: clone.id },
        });

        const sections = sectionsData?.proposalSections || [];
        const matchingSection = sections.find(
          (sec) => sec.title === originalSectionTitle
        );

        if (matchingSection) {
          // Step 2: Query cards for the matching section
          const { data: cardsData } = await client.query({
            query: GET_CARDS_BY_SECTION,
            variables: { sectionId: matchingSection.id },
          });

          const cards = cardsData?.proposalCards || [];
          const matchingCard = cards.find(
            (card) => card.title === originalCardTitle
          );

          if (matchingCard) {
            cardIds.push(matchingCard.id);
          } else {
            console.warn(
              `No matching card found in clone ${clone.id} (section: ${matchingSection.id}) for title "${originalCardTitle}"`
            );
          }
        } else {
          console.warn(
            `No matching section found in clone ${clone.id} for title "${originalSectionTitle}"`
          );
        }
      } catch (error) {
        console.error(`Failed to process clone ${clone.id}:`, error);
      }
    }

    // Update each cloned card individually using UPDATE_CARD_EDIT
    if (cardIds.length > 0) {
      const updateData = {
        description: description.current,
        resources: inputs?.resources?.length
          ? {
              connect: inputs.resources.map((resource) => ({
                id: resource?.id,
              })),
            }
          : null,
        assignments: inputs?.assignments?.length
          ? {
              connect: inputs.assignments.map((assignment) => ({
                id: assignment?.id,
              })),
            }
          : null,
        tasks: inputs?.tasks?.length
          ? { connect: inputs.tasks.map((task) => ({ id: task?.id })) }
          : null,
        studies: inputs?.studies?.length
          ? { connect: inputs.studies.map((study) => ({ id: study?.id })) }
          : null,
      };

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
      <Modal open={showCloneDialog} onClose={handleCloneNo} size="small">
        <Modal.Header>Update Cloned Boards?</Modal.Header>
        <Modal.Content>
          <p>
            This board has {proposal?.prototypeFor?.length} cloned project
            board(s). Do you want to update the corresponding cards in all
            cloned project boards with these changes? (This will update
            descriptions and linked items: resources, assignments, tasks, and
            studies.)
          </p>
        </Modal.Content>
        <Modal.Actions>
          <Button color="black" onClick={handleCloneNo}>
            No, update only this board
          </Button>
          <Button
            positive
            onClick={handleCloneYes}
            loading={updateLoading || updateClonedLoading}
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
                "Add or edit the card title. This title will appear as a section title if student input is made visible"
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
                "Add or edit instructions for students telling them how to complete the card"
              )}
            </div>
            <div className="jodit">
              <TipTapEditor
                content={description?.current}
                onUpdate={(newContent) =>
                  handleContentChange({
                    contentType: "description",
                    newContent,
                  })
                }
              />
            </div>
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
              </label>
              <div className="jodit">
                <TipTapEditor
                  content={content?.current}
                  onUpdate={(newContent) =>
                    handleContentChange({
                      contentType: "content",
                      newContent,
                    })
                  }
                />
              </div>
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
            <div>
              <div className="cardSubheaderComment">{t("board.status")}</div>
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
            </div>
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
            <textarea
              rows="5"
              type="text"
              id="comment"
              name="comment"
              value={inputs.comment}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
