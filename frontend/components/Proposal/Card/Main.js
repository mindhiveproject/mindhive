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
import { useState, useEffect, useRef } from "react";
import CardType from "./Forms/Type";
import Sharing from "./Forms/Sharing";
import Resources from "./Forms/Resources";

export default function ProposalCard({
  user,
  proposal,
  cardId,
  closeCard,
  proposalBuildMode,
  isPreview,
  proposalCard,
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

  const content = useRef(proposalCard?.content);

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
  const handleContentChange = async (newContent) => {
    // lock the card if needed
    if (inputs?.content !== newContent && areEditsAllowed && !lockedByUser) {
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
    content.current = newContent;
  };

  // update the card and close the modal
  const onUpdateCard = async () => {
    await updateCard({
      variables: {
        ...inputs,
        content: content?.current,
        assignedTo: inputs?.assignedTo?.map((a) => ({ id: a?.id })),
        resources: inputs?.resources?.map((resource) => ({ id: resource?.id })),
      },
    });
    closeCard({ cardId, lockedByUser });
  };

  return (
    <div className="post">
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
            <>
              {proposalCard?.resources.map((resource) => (
                <div>{resource?.title}</div>
              ))}
            </>
          ) : (
            <></>
          )}
        </div>
      ) : (
        <div className="proposalCardBoard">
          <div className="textBoard">
            {proposalBuildMode && (
              <label htmlFor="title">
                <p>Title</p>
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
                <p>Description</p>
                <textarea
                  type="text"
                  id="description"
                  name="description"
                  value={inputs?.description}
                  onChange={handleChange}
                />
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
            <div className="jodit">
              <JoditEditor
                content={content?.current}
                setContent={handleContentChange}
              />
            </div>
            {proposalBuildMode && (
              <>
                {inputs?.resources && inputs?.resources.length ? (
                  <>
                    {inputs?.resources.map((resource) => (
                      <div>
                        <h2>{resource?.title}</h2>
                        <div>{ReactHtmlParser(resource?.content?.main)}</div>
                      </div>
                    ))}
                  </>
                ) : (
                  <></>
                )}
              </>
            )}
            {!proposalBuildMode && (
              <>
                {proposalCard?.resources && proposalCard?.resources.length ? (
                  <>
                    {proposalCard?.resources.map((resource) => (
                      <div>
                        <h2>{resource?.title}</h2>
                        <div>{ReactHtmlParser(resource?.content?.main)}</div>
                      </div>
                    ))}
                  </>
                ) : (
                  <></>
                )}
              </>
            )}
          </div>
          {!isPreview && (
            <div className="infoBoard">
              {proposalBuildMode && (
                <div>
                  <h4>Type</h4>
                  <CardType type={inputs?.type} handleChange={handleChange} />
                  <h4>Sharing</h4>
                  <Sharing
                    type={inputs?.shareType}
                    handleChange={handleChange}
                  />
                  <h4>Linked resources</h4>
                  <Resources
                    user={user}
                    handleChange={handleChange}
                    selectedResources={
                      inputs?.resources?.map((resource) => resource?.id) || []
                    }
                  />
                  Include the card into the report
                  <Checkbox
                    toggle
                    name="includeCardToggle"
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
                </div>
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
                <h4>Comments</h4>
                <textarea
                  rows="5"
                  type="text"
                  id="comment"
                  name="comment"
                  value={inputs.comment}
                  onChange={handleChange}
                />
              </div>

              <div className="buttons">
                {!updateLoading && (
                  <button
                    className="secondary"
                    onClick={() => closeCard({ cardId, lockedByUser })}
                  >
                    Close without saving
                  </button>
                )}

                {areEditsAllowed && (
                  <button
                    className="primary"
                    onClick={() => onUpdateCard()}
                    disabled={updateLoading}
                  >
                    {updateLoading ? "Saving ..." : "Save & close"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
