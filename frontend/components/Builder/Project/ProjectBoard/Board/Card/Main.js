import { useState, useEffect, useRef } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import ReactHtmlParser from "react-html-parser";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { UPDATE_CARD_CONTENT } from "../../../../../Mutations/Proposal";
import { UPDATE_CARD_EDIT } from "../../../../../Mutations/Proposal";
import { GET_CARD_CONTENT } from "../../../../../Queries/Proposal";

import useForm from "../../../../../../lib/useForm";

import Navigation from "./Navigation/Main";
import Assigned from "./Forms/Assigned";
import TipTapEditor from "../../../../../TipTap/Main";
import { PreviewSection } from "../../../../../Proposal/Card/Forms/LinkedItems";
import { Modal, Button, Icon, Dropdown, Accordion } from "semantic-ui-react";

import { StyledProposal } from "../../../../../styles/StyledProposal";

export default function ProposalCard({
  proposalCard,
  query,
  tab,
  user,
  proposalId,
  proposal,
  cardId,
  refreshPage,
  isLocked,
  submitStatuses,
}) {
  const { t } = useTranslation("builder");
  const [originalActive, setOriginalActive] = useState(false); // For accordion state, default collapsed
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false); // For assignment modal
  const [selectedAssignment, setSelectedAssignment] = useState(null); // For selected assignment

  const reviewOptions = [
    {
      key: "actionSubmit",
      text: t("mainCard.reviewOptions.proposal", "Proposal"),
      value: "ACTION_SUBMIT",
    },
    {
      key: "actionPeerFeedback",
      text: t("mainCard.reviewOptions.peerFeedback", "Peer Feedback"),
      value: "ACTION_PEER_FEEDBACK",
    },
    {
      key: "actionCollectingData",
      text: t("mainCard.reviewOptions.collectingData", "Collecting Data"),
      value: "ACTION_COLLECTING_DATA",
    },
    {
      key: "actionProjectReport",
      text: t("mainCard.reviewOptions.projectReport", "Project Report"),
      value: "ACTION_PROJECT_REPORT",
    },
  ];

  const filteredReviewOptions = reviewOptions.filter(
    (option) => submitStatuses[option?.value] !== "SUBMITTED"
  );

  const router = useRouter();
  // check whether the card is locked - after 1 hour it is allowed to edit
  const releaseTime =
    new Date(proposalCard?.lastTimeEdited)?.getTime() + 60 * 60 * 1000;
  const outsideTimeWindow = Date.now() > releaseTime;

  // check whether the card is locked by the user
  const [lockedByUser, setLockedByUser] = useState(false);
  const [wasLockedOnFocus, setWasLockedOnFocus] = useState(false);
  const [hasContentChanged, setHasContentChanged] = useState(false);
  const areEditsAllowed = lockedByUser || outsideTimeWindow;

  // useEffect
  useEffect(() => {
    setLockedByUser(proposalCard?.isEditedBy?.username === user?.username);
  }, [proposalCard, user]);

  const { inputs, handleChange } = useForm({
    ...proposalCard,
  });

  console.log({ inputs });

  const content = useRef(proposalCard?.content);
  const internalContent = useRef(proposalCard?.internalContent);
  const revisedContent = useRef(
    proposalCard?.revisedContent || proposalCard?.content
  );

  const [updateCard, { loading: updateLoading }] = useMutation(
    UPDATE_CARD_CONTENT,
    { refetchQueries: [{ query: GET_CARD_CONTENT, variables: { id: cardId } }] }
  );

  const [updateEdit, { loading: updateEditLoading }] = useMutation(
    UPDATE_CARD_EDIT,
    {
      ignoreResults: true,
    }
  );

  const users =
    proposal?.collaborators?.map((user) => ({
      key: user.id,
      text: user.username,
      value: user.id,
    })) || [];
  const allUsers = [...users];

  // update the assignedTo in the local state
  const handleAssignedToChange = (assignedTo) => {
    handleChange({
      target: {
        name: "assignedTo",
        value: assignedTo.map((a) => ({
          id: a,
        })),
      },
    });
    if (!hasContentChanged) setHasContentChanged(true);
  };

  // update the settings in the local state
  const handleSettingsChange = (name, value) => {
    handleChange({
      target: {
        name: "settings",
        value: { ...inputs.settings, [name]: value },
      },
    });
    if (!hasContentChanged) setHasContentChanged(true);
  };

  // Send update to the server when the editor gains focus
  const handleFocus = async () => {
    // lock the card if needed
    if (!wasLockedOnFocus && areEditsAllowed && !lockedByUser) {
      await updateEdit({
        variables: {
          id: cardId,
          input: {
            isEditedBy: { connect: { id: user?.id } },
            lastTimeEdited: new Date(),
          },
        },
      });
      setLockedByUser(true);
    }
    setWasLockedOnFocus(true);
  };

  // update card content in the local state
  const handleContentChange = async ({ contentType, newContent }) => {
    if (contentType === "internalContent") {
      internalContent.current = newContent;
      if (!hasContentChanged && newContent !== inputs?.internalContent)
        setHasContentChanged(true);
    } else if (contentType === "content") {
      content.current = newContent;
      if (!hasContentChanged && newContent !== inputs?.content)
        setHasContentChanged(true);
    } else if (contentType === "revisedContent") {
      revisedContent.current = newContent;
      if (!hasContentChanged && newContent !== inputs?.revisedContent)
        setHasContentChanged(true);
    }
  };

  // update the card and close the modal
  const onUpdateCard = async ({ shoudBeSaved }) => {
    // update the content of the card
    if (shoudBeSaved) {
      await updateCard({
        variables: {
          ...inputs,
          internalContent: internalContent?.current,
          content: content?.current,
          revisedContent: revisedContent?.current,
          assignedTo: inputs?.assignedTo?.map((a) => ({ id: a?.id })),
          resources: inputs?.resources?.map((resource) => ({
            id: resource?.id,
          })),
        },
      });
    } else {
      if (hasContentChanged) {
        if (
          !confirm(
            "Your unsaved changes will be lost. Click Cancel to return and save the changes."
          )
        ) {
          return;
        }
      }
    }

    // unlock the card
    if (lockedByUser) {
      await updateEdit({
        variables: {
          id: cardId,
          input: {
            isEditedBy: { disconnect: true },
            lastTimeEdited: null,
          },
        },
      });
    }

    // move to the project board
    router.push({
      pathname: `/builder/projects/`,
      query: {
        selector: proposalId,
      },
    });
  };

  // Handler to open assignment modal
  const openAssignmentModalHandler = (assignment) => {
    if (!assignment) {
      console.error("No assignment provided to openAssignmentModalHandler");
      return;
    }
    console.log("Opening modal with assignment:", {
      id: assignment.id,
      title: assignment.title,
      content: assignment.content,
    });
    setSelectedAssignment(assignment);
    setAssignmentModalOpen(true);
  };

  // Assignment Modal Component
  const AssignmentModal = ({ open, onClose, assignment }) => {
    const [title, setTitle] = useState(assignment?.title || "");
    const [content, setContent] = useState(assignment?.content || "");

    useEffect(() => {
      if (assignment) {
        console.log("AssignmentModal: Syncing assignment", {
          id: assignment.id,
          title: assignment.title,
          content: assignment.content,
        });
        setTitle(assignment.title || "");
        setContent(assignment.content || "");
      } else {
        console.warn("AssignmentModal opened with no assignment");
        setTitle("");
        setContent("");
      }
    }, [assignment]);

    if (!assignment && open) {
      console.warn("AssignmentModal rendered without valid assignment");
      return null;
    }

    return (
      <Modal
        open={open}
        onClose={onClose}
        size="large"
        style={{ borderRadius: "12px", overflow: "hidden" }}
      >
        <Modal.Header
          style={{
            background: "#f9fafb",
            borderBottom: "1px solid #e0e0e0",
            fontFamily: "Nunito",
            fontWeight: 600,
          }}
        >
          {t("board.expendedCard.previewAssignment", "Preview Assignment")}
        </Modal.Header>
        <Modal.Content
          scrolling
          style={{ background: "#ffffff", padding: "24px" }}
        >
          <div>
            <label htmlFor="assignmentTitle">
              <div className="cardHeader">{t("board.expendedCard.title")}</div>
              <input
                type="text"
                id="assignmentTitle"
                value={title}
                disabled
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #e0e0e0",
                  marginBottom: "16px",
                  background: "#f9fafb",
                }}
              />
            </label>
            <div className="cardHeader">{t("board.expendedCard.content")}</div>
            <div
              style={{
                fontSize: "14px",
                color: "#333",
                lineHeight: "1.5",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                padding: "16px",
              }}
            >
              {ReactHtmlParser(content || "")}
            </div>
          </div>
        </Modal.Content>
        <Modal.Actions
          style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }}
        >
          <Button
            onClick={onClose}
            style={{
              background: "#f0f4f8",
              color: "#007c70",
              borderRadius: "8px",
            }}
          >
            {t("board.expendedCard.close", "Close")}
          </Button>
        </Modal.Actions>
      </Modal>
    );
  };

  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={() => {}}
        proposalId={proposalId}
        cardId={cardId}
        saveBtnFunction={onUpdateCard}
        inputs={inputs}
        handleSettingsChange={handleSettingsChange}
        hasContentChanged={hasContentChanged}
      />
      <StyledProposal>
        <div className="post">
          {!areEditsAllowed && (
            <div className="lockedMessage">
              <div>
                {t(
                  "mainCard.lockedMessage",
                  "The card is currently being edited by"
                )}{" "}
                <span className="username">
                  {proposalCard?.isEditedBy?.username}
                </span>
                .{" "}
                {t(
                  "mainCard.askToClose",
                  "Ask the user to close the card or wait until the card is released."
                )}{" "}
                {t("mainCard.cardWillBeReleased", "The card will be released")}{" "}
                <span className="username">{moment().to(releaseTime)}</span>.{" "}
                {t(
                  "mainCard.refreshAfterRelease",
                  "After the card is released, refresh the page to get the latest version of the card."
                )}
              </div>
              <div className="buttonHolder">
                <button onClick={() => refreshPage()}>
                  {t("mainCard.refresh", "Refresh")}
                </button>
              </div>
            </div>
          )}

          <div className="proposalCardBoard">
            <div className="textBoard">
              <div className="cardHeader">{inputs?.title}</div>
              <div className="cardSubheader">
                {t("mainCard.instructions", "Instructions")}
              </div>
              <div className="cardDescription">
                {ReactHtmlParser(inputs?.description)}
              </div>

              {proposalCard?.settings?.includeInReport && (
                <>
                  <div className="cardSubheader">
                    {t("mainCard.forMindHiveNetwork", "For MindHive Network")}
                  </div>
                  <div className="cardSubheaderComment">
                    {t(
                      "mainCard.visibleInFeedbackCenter",
                      "The content you include here will be visible in the Feedback Center once it is submitted via an Action Card."
                    )}
                  </div>
                  <div className="jodit">
                    {isLocked ? (
                      <Accordion styled fluid>
                        <Accordion.Title
                          active={originalActive}
                          onClick={() => setOriginalActive(!originalActive)}
                          style={{ fontSize: "16px", fontWeight: "bold" }}
                        >
                          <Icon name="dropdown" />
                          {t("mainCard.forMindHiveNetwork", "Original Content")}
                        </Accordion.Title>
                        <Accordion.Content active={originalActive}>
                          <div
                            style={{
                              border: "1px solid #ccc",
                              padding: "10px",
                              overflow: "auto",
                            }}
                          >
                            {ReactHtmlParser(content?.current || "")}
                          </div>
                        </Accordion.Content>
                      </Accordion>
                    ) : (
                      <div onFocus={handleFocus}>
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
                    )}
                  </div>
                </>
              )}

              {proposalCard?.settings?.includeInReport && isLocked && (
                <>
                  <div className="cardSubheader">
                    {t("mainCard.revisedContent", "Revised Content")}
                  </div>
                  <div className="cardSubheaderComment">
                    {t(
                      "mainCard.revisedContentUsed",
                      "The revised content you include here will be used in the final report."
                    )}
                  </div>
                  <div className="jodit">
                    <div onFocus={handleFocus}>
                      <TipTapEditor
                        content={revisedContent?.current}
                        onUpdate={(newContent) =>
                          handleContentChange({
                            contentType: "revisedContent",
                            newContent,
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="infoBoard">
              <div>
                <div className="cardSubheader">
                  {t("mainCard.assignedTo", "Assigned to")}
                </div>
                <Assigned
                  users={allUsers}
                  assignedTo={inputs?.assignedTo}
                  onAssignedToChange={handleAssignedToChange}
                />
              </div>

              {/* Display Linked Items using PreviewSection */}
              {inputs?.resources?.length > 0 && (
                <PreviewSection
                  title={t("board.expendedCard.previewLinkedResources")}
                  items={inputs?.resources}
                  type="resource"
                  proposal={proposal}
                  openAssignmentModal={openAssignmentModalHandler}
                  user={user}
                />
              )}
              {inputs?.assignments?.length > 0 && (
                <PreviewSection
                  title={t("board.expendedCard.previewLinkedAssignments")}
                  items={inputs?.assignments}
                  type="assignment"
                  proposal={proposal}
                  openAssignmentModal={openAssignmentModalHandler}
                  user={user}
                />
              )}
              {inputs?.tasks?.length > 0 && (
                <PreviewSection
                  title={t("board.expendedCard.previewLinkedTasks")}
                  items={inputs?.tasks}
                  type="task"
                  proposal={proposal}
                  openAssignmentModal={openAssignmentModalHandler}
                  user={user}
                />
              )}
              {inputs?.studies?.length > 0 && (
                <PreviewSection
                  title={t("board.expendedCard.previewLinkedStudies")}
                  items={inputs?.studies}
                  type="study"
                  proposal={proposal}
                  openAssignmentModal={openAssignmentModalHandler}
                  user={user}
                />
              )}

              <div className="proposalCardComments">
                <div className="cardSubheader">
                  {t("mainCard.comments", "Comments")}
                </div>
                <textarea
                  rows="5"
                  type="text"
                  id="comment"
                  name="comment"
                  value={inputs.comment}
                  onChange={(e, target) => {
                    if (!hasContentChanged) {
                      setHasContentChanged(true);
                    }
                    handleChange(e, target);
                  }}
                />
              </div>

              {proposalCard?.settings?.includeInReport && !isLocked && (
                <div>
                  <div className="cardSubheaderComment">
                    {t(
                      "mainCard.chooseReviewStep",
                      "Choose which step of the peer review a card should go in"
                    )}
                  </div>
                  <Dropdown
                    placeholder={t("mainCard.selectOption", "Select option")}
                    fluid
                    multiple
                    search
                    selection
                    lazyLoad
                    options={filteredReviewOptions}
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
            </div>
          </div>
        </div>
      </StyledProposal>

      <AssignmentModal
        open={assignmentModalOpen}
        onClose={() => {
          setAssignmentModalOpen(false);
          setSelectedAssignment(null);
        }}
        assignment={selectedAssignment}
        user={user}
      />
    </>
  );
}
