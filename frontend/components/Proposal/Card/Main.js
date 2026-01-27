import { useState, useEffect, useRef } from "react";
import { useMutation } from "@apollo/client";
import { Checkbox, Icon } from "semantic-ui-react";
import ReactHtmlParser from "react-html-parser";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { UPDATE_CARD_CONTENT } from "../../Mutations/Proposal";
import { UPDATE_CARD_EDIT } from "../../Mutations/Proposal";

import useForm from "../../../lib/useForm";
import JoditEditor from "../../Jodit/Editor";
import { mergeCardSettings } from "../../utils/mergeCardSettings";

import Assigned from "./Forms/Assigned";
import Status from "./Forms/Status";

import CardType from "./Forms/Type";
import Resources from "./Forms/Resources";

function truncateHtml(html, wordLimit = 10) {
  const div = document.createElement("div");
  div.innerHTML = html;

  // Get text content
  const text = div.textContent || div.innerText;
  const words = text.trim().split(/\s+/);

  if (words.length <= wordLimit) {
    return html;
  }

  let charCount = 0;
  for (let i = 0; i < wordLimit; i++) {
    charCount += words[i].length + 1; // +1 for space
  }

  // Create temporary element to handle HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  let result = "";
  let currentLength = 0;

  function processNode(node) {
    if (node.nodeType === 3) {
      // Text node
      const text = node.textContent;
      const remaining = charCount - currentLength;

      if (currentLength >= charCount) {
        return false;
      }

      if (currentLength + text.length > charCount) {
        const truncated = text.substr(0, remaining).trim();
        result += truncated;
        currentLength += truncated.length;
        return false;
      }

      result += text;
      currentLength += text.length;
      return true;
    }

    // Element node
    result += `<${node.tagName.toLowerCase()}`;

    // Add attributes
    Array.from(node.attributes).forEach((attr) => {
      result += ` ${attr.name}="${attr.value}"`;
    });

    result += ">";

    // Process child nodes
    Array.from(node.childNodes).every((child) => processNode(child));

    result += `</${node.tagName.toLowerCase()}>`;
    return true;
  }

  Array.from(tempDiv.childNodes).every((node) => processNode(node));

  return result + "...";
}

export default function ProposalCard({
  proposalCard,
  user,
  proposal,
  cardId,
  closeCard,
  proposalBuildMode,
  isPreview,
  refreshPage,
}) {
  const { t } = useTranslation("classes");
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

  const description = useRef(proposalCard?.description);
  const content = useRef(proposalCard?.content);
  const internalContent = useRef(proposalCard?.internalContent);

  const [updateCard, { loading: updateLoading }] =
    useMutation(UPDATE_CARD_CONTENT);

  const [updateEdit, { loading: updateEditLoading }] = useMutation(
    UPDATE_CARD_EDIT,
    {
      ignoreResults: true,
    }
  );

  const users =
    proposal?.study?.collaborators?.map((user) => ({
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
  };

  // update the settings in the local state
  const handleSettingsChange = (name, value) => {
    handleChange({
      target: {
        name: "settings",
        value: { ...inputs.settings, [name]: value },
      },
    });
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
    if (contentType === "description") {
      description.current = newContent;
      if (!hasContentChanged && newContent !== inputs?.description)
        setHasContentChanged(true);
    }
    if (contentType === "internalContent") {
      internalContent.current = newContent;
      if (!hasContentChanged && newContent !== inputs?.internalContent)
        setHasContentChanged(true);
    }
    if (contentType === "content") {
      content.current = newContent;
      if (!hasContentChanged && newContent !== inputs?.content)
        setHasContentChanged(true);
    }
  };

  // update the card and close the modal
  const onUpdateCard = async () => {
    // Merge settings to ensure we don't lose existing properties like includeInReport and includeInReviewSteps
    // Always merge with the current card's settings from props to avoid overwriting with stale local state
    const mergedSettings = mergeCardSettings(
      proposalCard?.settings,
      inputs?.settings
    );

    await updateCard({
      variables: {
        ...inputs,
        description: description?.current,
        internalContent: internalContent?.current,
        content: content?.current,
        settings: mergedSettings,
        assignedTo: inputs?.assignedTo?.map((a) => ({ id: a?.id })),
        resources: inputs?.resources?.map((resource) => ({ id: resource?.id })),
      },
    });
    closeCard({ cardId, lockedByUser });
  };

  return (
    <div className="post">
      {proposalBuildMode && (
        <div className="navigation-build-mode">
          <div className="left">
            <div
              className="icon"
              onClick={() => closeCard({ cardId, lockedByUser })}
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
            <button onClick={() => onUpdateCard()} className="saveButton">
              {t("board.save", "Save")}
            </button>
          </div>
        </div>
      )}
      {!areEditsAllowed && (
        <div className="lockedMessage">
          <div>
            {t("board.lockedMessage", "The card is currently being edited by")}{" "}
            {proposalCard?.isEditedBy?.username}.{" "}
            {t(
              "board.askToClose",
              "Ask the user to close the card or wait until the card is released."
            )}{" "}
            {t("board.cardWillBeReleased", "The card will be released")}{" "}
            {moment().to(releaseTime)}.{" "}
            {t(
              "board.refreshAfterRelease",
              "After the card is released, refresh the page to get the latest version of the card."
            )}
          </div>
          <div className="buttonHolder">
            <button onClick={() => refreshPage()}>
              {t("board.refresh", "Refresh")}
            </button>
          </div>
        </div>
      )}
      {isPreview ? (
        <div className="cardPreview">
          <div className="closeBtn">
            <span onClick={() => closeCard({})}>&times;</span>
          </div>
          <h2>{proposalCard?.title}</h2>
          {proposalCard?.description && (
            <div className="description">
              {ReactHtmlParser(proposalCard?.description)}
            </div>
          )}
          <div>{ReactHtmlParser(proposalCard?.content)}</div>
          {proposalCard?.resources && proposalCard?.resources.length ? (
            <div className="resourcePreview">
              {proposalCard?.resources.map((resource) => (
                <div className="resourceBlockPreview">{resource?.title}</div>
              ))}
            </div>
          ) : (
            <></>
          )}
        </div>
      ) : (
        <div className="proposalCardBoard">
          <div className="textBoard">
            {proposalBuildMode && (
              <label htmlFor="title">
                <div className="cardHeader">
                  {t("board.cardTitle", "Card Title")}
                </div>
                <div className="cardSubheaderComment">
                  {t(
                    "board.cardTitleComment",
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
            )}
            {proposalBuildMode && (
              <label htmlFor="description">
                <div className="cardHeader">
                  {t("board.instructions", "Instructions for Students")}
                </div>
                <div className="cardSubheaderComment">
                  {t(
                    "board.instructionsComment",
                    "Add or edit instructions for students telling them how to complete the card"
                  )}
                </div>
                <div className="jodit">
                  <JoditEditor
                    content={description?.current}
                    setContent={(newContent) =>
                      handleContentChange({
                        contentType: "description",
                        newContent,
                      })
                    }
                    minHeight={300}
                  />
                </div>
              </label>
            )}
            {!proposalBuildMode && (
              <div className="cardHeader">{inputs?.title}</div>
            )}
            {!proposalBuildMode && (
              <div className="cardDescription">
                {ReactHtmlParser(inputs?.description)}
              </div>
            )}

            {proposalBuildMode && inputs?.settings?.includeInReport && (
              <>
                <label htmlFor="description">
                  <div className="cardHeader">
                    {t(
                      "board.studentResponseBoxNetwork",
                      "Student Response Box - For MindHive Network"
                    )}
                  </div>
                  <div className="cardSubheaderComment">
                    {t(
                      "board.expendedCard.studentResponseBoxNetworkComment",
                      "The content students include here will be visible in the Feedback Center once it is submitted via an Action Card. Include any templates or placeholder text as needed"
                    )}
                  </div>
                </label>
                <div className="jodit">
                  <JoditEditor
                    content={content?.current}
                    setContent={(newContent) =>
                      handleContentChange({
                        contentType: "content",
                        newContent,
                      })
                    }
                    minHeight={600}
                  />
                </div>
              </>
            )}

            {!proposalBuildMode && proposalCard?.settings?.includeInReport && (
              <>
                <div className="jodit">
                  <JoditEditor
                    content={content?.current}
                    setContent={(newContent) =>
                      handleContentChange({
                        contentType: "content",
                        newContent,
                      })
                    }
                    minHeight={600}
                  />
                </div>
              </>
            )}

            {proposalBuildMode && (
              <label htmlFor="description">
                <div className="cardHeader">
                  {t(
                    "board.expendedCard.studentResponseBoxCollaborators",
                    "Student Response Box - For Project Collaborators"
                  )}
                </div>
                <div className="cardSubheaderComment">
                  {t(
                    "board.studentResponseBoxCollaboratorsComment",
                    "The content students include here will only be visible to their project collaborators and teacher(s). Include any templates or placeholder text as needed"
                  )}
                </div>
              </label>
            )}

            <div className="jodit">
              <JoditEditor
                content={internalContent?.current}
                setContent={(newContent) =>
                  handleContentChange({
                    contentType: "internalContent",
                    newContent,
                  })
                }
                minHeight={300}
              />
            </div>

            {!proposalBuildMode && (
              <>
                {proposalCard?.resources && proposalCard?.resources.length ? (
                  <div className="resourcePreview">
                    {proposalCard?.resources.map((resource) => (
                      <div className="resourceBlockPreview">
                        <h2>{resource?.title}</h2>
                        <div>{ReactHtmlParser(resource?.content?.main)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <></>
                )}
              </>
            )}
          </div>
          {!isPreview && (
            <div className="infoBoard">
              {proposalBuildMode && (
                <>
                  <div>
                    <div className="cardHeader">
                      {t("board.expendedCard.visibility", "Visibility")}
                    </div>
                    <div className="cardSubheaderComment">
                      {t(
                        "board.visibilityComment",
                        "Check box to include student input for the Feedback Center"
                      )}
                    </div>

                    <div className="checkboxText">
                      <Checkbox
                        name="includeCardToggle"
                        id="includeCardToggle"
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

                      <label for="includeCardToggle">
                        <div className="cardDescription">
                          {t(
                            "board.includeTextFeedbackCenter",
                            "Include text input for Feedback Center"
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {user.permissions.map((p) => p?.name).includes("ADMIN") && (
                    <div>
                      <div className="cardHeader">
                        {t("board.type", "Type")}
                      </div>
                      <CardType
                        type={inputs?.type}
                        handleChange={handleChange}
                      />
                    </div>
                  )}

                  <div>
                    <div className="cardHeader">
                      {t("board.resources", "Resources")}
                    </div>
                    <div className="cardSubheaderComment">
                      {t(
                        "board.addExistingResourcesComment",
                        "Add existing resources (See Resources in Navigation Pane)"
                      )}
                    </div>
                    <Resources
                      user={user}
                      handleChange={handleChange}
                      selectedResources={
                        inputs?.resources?.map((resource) => resource?.id) || []
                      }
                    />
                    <>
                      <div className="cardHeader">
                        {t(
                          "board.previewLinkedResources",
                          "Preview Linked Resources"
                        )}
                      </div>
                      {inputs?.resources && inputs?.resources.length ? (
                        <div className="resourcePreview">
                          {inputs?.resources.map((resource) => (
                            <div className="resourceBlockPreview">
                              <div className="titleIcons">
                                <div>
                                  <h2>{resource?.title}</h2>
                                </div>
                                <div>
                                  <a
                                    href={`/dashboard/resources/view?id=${resource?.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Icon name="external alternate" />
                                  </a>
                                </div>
                                <div>
                                  <a
                                    href={`/dashboard/resources/copy?id=${resource?.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Icon name="pencil alternate" />
                                  </a>
                                </div>
                              </div>
                              <div>
                                {ReactHtmlParser(
                                  truncateHtml(resource?.content?.main)
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <></>
                      )}
                    </>
                  </div>
                </>
              )}

              {!proposalBuildMode && (
                <>
                  <div>
                    <h4>{t("board.assignedTo", "Assigned to")}</h4>
                    <Assigned
                      users={allUsers}
                      assignedTo={inputs?.assignedTo}
                      onAssignedToChange={handleAssignedToChange}
                    />
                  </div>
                  <div>
                    <h4>{t("board.status", "Status")}</h4>
                    <Status
                      settings={inputs?.settings}
                      onSettingsChange={handleSettingsChange}
                    />
                  </div>
                </>
              )}
              {!proposalBuildMode && false && (
                <>
                  <div>
                    <h4>{t("board.assignedTo", "Assigned to")}</h4>
                    <div>
                      {proposalCard?.assignedTo?.map(
                        (c) => c?.id || "John Doe"
                      )}
                    </div>
                  </div>
                  <div>
                    <h4>{t("board.status", "Status")}</h4>
                    <div>{inputs.settings?.status}</div>
                  </div>
                </>
              )}

              <div className="proposalCardComments">
                <div className="cardHeader">
                  {t("board.comments", "Comments")}
                </div>
                {proposalBuildMode && (
                  <div className="cardSubheaderComment">
                    {t(
                      "board.commentsComment",
                      "This will pre-populate the Comment Box for students. You can delete comments later."
                    )}
                  </div>
                )}
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
          )}
        </div>
      )}
    </div>
  );
}
