import { useState, useEffect, useRef } from "react";
import { useMutation } from "@apollo/client";
import { Checkbox } from "semantic-ui-react";
import ReactHtmlParser from "react-html-parser";
import moment from "moment";

import { UPDATE_CARD_CONTENT } from "../../Mutations/Proposal";
import { UPDATE_CARD_EDIT } from "../../Mutations/Proposal";

import useForm from "../../../lib/useForm";
import JoditEditor from "../../Jodit/Editor";

import Assigned from "./Forms/Assigned";
import Status from "./Forms/Status";

import CardType from "./Forms/Type";
import Resources from "./Forms/Resources";

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
  // check whether the card is locked - after 1 hour it is allowed to edit
  const releaseTime =
    new Date(proposalCard?.lastTimeEdited)?.getTime() + 60 * 60 * 1000;
  const outsideTimeWindow = Date.now() > releaseTime;

  // check whether the card is locked by the user
  const [lockedByUser, setLockedByUser] = useState(false);
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

  // update card content in the local state
  const handleContentChange = async ({ contentType, newContent }) => {
    // lock the card if needed
    if (
      inputs[contentType] !== newContent &&
      areEditsAllowed &&
      !lockedByUser
    ) {
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
    // update the value of content
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

  // update the card and close the modal
  const onUpdateCard = async () => {
    await updateCard({
      variables: {
        ...inputs,
        description: description?.current,
        internalContent: internalContent?.current,
        content: content?.current,
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
              Save
            </button>
          </div>
        </div>
      )}
      {!areEditsAllowed && (
        <div className="lockedMessage">
          <div>
            The card is currently been edited by{" "}
            <span className="username">
              {proposalCard?.isEditedBy?.username}
            </span>
            . Ask the user to close the card or wait until the card is released.
            The card will be released{" "}
            <span className="username">{moment().to(releaseTime)}</span>. After
            the card is released, refresh the page to get the latest version of
            the card.
          </div>
          <div className="buttonHolder">
            <button onClick={() => refreshPage()}>Refresh</button>
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
                <div className="cardHeader">Card Title</div>
                <div className="cardSubheaderComment">
                  Add or edit the card title. This title will appear as a
                  section title if student input is made visible
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
                <div className="cardHeader">Instructions for Students</div>
                <div className="cardSubheaderComment">
                  Add or edit instructions for students telling them how to
                  complete the card
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

            {proposalBuildMode && (
              <label htmlFor="description">
                <div className="cardHeader">
                  Student Response Box - For Project Collaborators
                </div>
                <div className="cardSubheaderComment">
                  The content students include here will only be visible to
                  their project collaborators and teacher(s). Include any
                  templates or placeholder text as needed
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

            {proposalBuildMode && inputs?.settings?.includeInReport && (
              <>
                <label htmlFor="description">
                  <div className="cardHeader">
                    Student Response Box - For MindHive Network
                  </div>
                  <div className="cardSubheaderComment">
                    The content students include here will be visible in the
                    Feedback Center once it is submitted via an Action Card.
                    Include any templates or placeholder text as needed
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
                    minHeight={300}
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
                  />
                </div>
              </>
            )}

            {proposalBuildMode && (
              <>
                <div className="cardHeader">Preview Linked Resources</div>
                {inputs?.resources && inputs?.resources.length ? (
                  <div className="resourcePreview">
                    {inputs?.resources.map((resource) => (
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
                    <div className="cardHeader">Visibility</div>
                    <div className="cardSubheaderComment">
                      Check box to include student input for the Feedback Center
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
                          Include text input for Feedback Center
                        </div>
                      </label>
                    </div>
                  </div>

                  {user.permissions.map((p) => p?.name).includes("ADMIN") && (
                    <div>
                      <div className="cardHeader">Type</div>
                      <CardType
                        type={inputs?.type}
                        handleChange={handleChange}
                      />
                    </div>
                  )}

                  <div>
                    <div className="cardHeader">Resources</div>
                    <div className="cardSubheaderComment">
                      Add existing resources (See Resources in Navigation Pane)
                    </div>
                    <Resources
                      user={user}
                      handleChange={handleChange}
                      selectedResources={
                        inputs?.resources?.map((resource) => resource?.id) || []
                      }
                    />
                  </div>
                </>
              )}

              {!proposalBuildMode && (
                <>
                  <div>
                    <h4>Assigned to</h4>
                    <Assigned
                      users={allUsers}
                      assignedTo={inputs?.assignedTo}
                      onAssignedToChange={handleAssignedToChange}
                    />
                  </div>
                  <div>
                    <h4>Status</h4>
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
                    <h4>Assigned to</h4>
                    <div>
                      {proposalCard?.assignedTo?.map(
                        (c) => c?.id || "John Doe"
                      )}
                    </div>
                  </div>
                  <div>
                    <h4>Status</h4>
                    <div>{inputs.settings?.status}</div>
                  </div>
                </>
              )}

              <div className="proposalCardComments">
                <div className="cardHeader">Comments</div>
                {proposalBuildMode && (
                  <div className="cardSubheaderComment">
                    This will pre-populate the Comment Box for students. You can
                    delete comments later.
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
