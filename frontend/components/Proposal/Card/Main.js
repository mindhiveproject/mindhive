import { useQuery, useMutation } from "@apollo/client";

import { Modal } from "semantic-ui-react";
import ReactHtmlParser from "react-html-parser";

import { GET_CARD_CONTENT } from "../../Queries/Proposal";
import { UPDATE_CARD_CONTENT } from "../../Mutations/Proposal";

import useForm from "../../../lib/useForm";
import JoditEditor from "../../Jodit/Editor";

import Assigned from "./Forms/Assigned";
import Status from "./Forms/Status";

export default function ProposalCard({
  proposal,
  cardId,
  closeCard,
  proposalBuildMode,
  isPreview,
}) {
  const {
    data,
    loading: getLoading,
    error,
  } = useQuery(GET_CARD_CONTENT, {
    variables: {
      id: cardId,
    },
  });

  const proposalCard = data?.proposalCard || {};

  const { inputs, handleChange } = useForm({
    ...proposalCard,
  });

  // console.log({ inputs });

  const [updateCard, { loading: updateLoading }] = useMutation(
    UPDATE_CARD_CONTENT,
    {
      variables: {
        ...inputs,
      },
    }
  );

  // extract author and collaborators of the study
  const author = {
    key: proposal?.study?.author?.id,
    text: proposal?.study?.author?.username,
    value: proposal?.study?.author?.id,
  };
  const users =
    proposal?.study?.collaborators?.map((user) => ({
      key: user.id,
      text: user.username,
      value: user.id,
    })) || [];
  const allUsers = [author, ...users];

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
  const handleContentChange = (content) => {
    handleChange({ target: { name: "content", value: content } });
  };

  // update the card and close the modal
  const onUpdateCard = async () => {
    await updateCard();
    closeCard();
  };

  return (
    <Modal
      open={open}
      closeOnDimmerClick={false}
      size="large"
      onClose={() => onClose()}
    >
      <Modal.Content scrolling>
        <Modal.Description>
          {isPreview ? (
            <div className="cardPreview">
              <h2>{proposalCard?.title}</h2>
              {proposalCard?.description && (
                <div className="description">
                  {ReactHtmlParser(proposalCard?.description)}
                </div>
              )}
              <div>{ReactHtmlParser(proposalCard?.content)}</div>
            </div>
          ) : (
            <div className="post">
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
                      content={inputs?.content}
                      setContent={handleContentChange}
                    />
                  </div>
                </div>
                {!isPreview && (
                  <div className="infoBoard">
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
                    {!proposalBuildMode && (
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
                        rows="13"
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
            </div>
          )}
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <div className="buttons">
          {!updateLoading && (
            <button className="secondary" onClick={() => closeCard()}>
              Close
            </button>
          )}
          <button
            className="primary"
            onClick={() => onUpdateCard()}
            disabled={updateLoading}
          >
            {updateLoading ? "Saving ..." : "Save & close"}
          </button>
        </div>
      </Modal.Actions>
    </Modal>
  );
}
