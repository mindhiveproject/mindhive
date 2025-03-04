import { useState, useEffect, useRef } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import ReactHtmlParser from "react-html-parser";
import moment from "moment";

import { UPDATE_CARD_CONTENT } from "../../../../../Mutations/Proposal";
import { UPDATE_CARD_EDIT } from "../../../../../Mutations/Proposal";

import useForm from "../../../../../../lib/useForm";

import Navigation from "./Navigation/Main";
import Assigned from "./Forms/Assigned";
import JoditEditor from "../../../../../Jodit/Editor";
import Resources from "./Forms/Resources";

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
}) {
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
    } else {
      content.current = newContent;
      if (!hasContentChanged && newContent !== inputs?.content)
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
                The card is currently been edited by{" "}
                <span className="username">
                  {proposalCard?.isEditedBy?.username}
                </span>
                . Ask the user to close the card or wait until the card is
                released. The card will be released{" "}
                <span className="username">{moment().to(releaseTime)}</span>.
                After the card is released, refresh the page to get the latest
                version of the card.
              </div>
              <div className="buttonHolder">
                <button onClick={() => refreshPage()}>Refresh</button>
              </div>
            </div>
          )}

          <div className="proposalCardBoard">
            <div className="textBoard">
              <div className="cardHeader">{inputs?.title}</div>
              <div className="cardSubheader">Instructions</div>
              <div className="cardDescription">
                {ReactHtmlParser(inputs?.description)}
              </div>

              {!proposalCard?.settings?.excludeFromCollaborators && (
                <>
                  <div className="cardSubheader">
                    For my teacher and project collaborators only
                  </div>
                  <div className="cardSubheaderComment">
                    The content you include below will only be visible to your
                    teacher(s) and project collaborators
                  </div>
                  <div className="jodit">
                    {isLocked ? (
                      ReactHtmlParser(internalContent?.current)
                    ) : (
                      <div onFocus={handleFocus}>
                        <JoditEditor
                          content={internalContent?.current}
                          setContent={(newContent) =>
                            handleContentChange({
                              contentType: "internalContent",
                              newContent,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {proposalCard?.settings?.includeInReport && (
                <>
                  <div className="cardSubheader">For MindHive Network</div>
                  <div className="cardSubheaderComment">
                    The content you include here will be visible in the Feedback
                    Center once it is submitted via an Action Card.
                  </div>
                  <div className="jodit">
                    {isLocked ? (
                      ReactHtmlParser(content?.current)
                    ) : (
                      <div onFocus={handleFocus}>
                        <JoditEditor
                          content={content?.current}
                          setContent={(newContent) =>
                            handleContentChange({
                              contentType: "content",
                              newContent,
                            })
                          }
                          onFocus={handleFocus}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="infoBoard">
              <div>
                <div className="cardSubheader">Assigned to</div>
                <Assigned
                  users={allUsers}
                  assignedTo={inputs?.assignedTo}
                  onAssignedToChange={handleAssignedToChange}
                />
              </div>

              <div>
                <Resources
                  proposal={proposal}
                  selectedResources={proposalCard?.resources || []}
                />
              </div>

              <div className="proposalCardComments">
                <div className="cardSubheader">Comments</div>
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
            </div>
          </div>
        </div>
      </StyledProposal>
    </>
  );
}
