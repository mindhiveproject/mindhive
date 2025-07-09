import { useRef } from "react";
import { useMutation } from "@apollo/client";
import { Checkbox, Dropdown } from "semantic-ui-react";
import { UPDATE_CARD_CONTENT } from "../../Mutations/Proposal";

import useForm from "../../../lib/useForm";
import JoditEditor from "../../Jodit/Editor";

import CardType from "./Forms/Type";
import Resources from "./Forms/Resources";
import useTranslation from 'next-translate/useTranslation';

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
  const { t } = useTranslation('classes');
  const { inputs, handleChange } = useForm({
    ...proposalCard,
  });

  const description = useRef(proposalCard?.description);
  const content = useRef(proposalCard?.content);
  const internalContent = useRef(proposalCard?.internalContent);

  const [updateCard, { loading: updateLoading }] =
    useMutation(UPDATE_CARD_CONTENT);

  // update card content in the local state
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
    closeCard({ cardId: proposalCard?.id, lockedByUser: false });
  };

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
          <button onClick={() => onUpdateCard()} className="saveButton">
            {t('board.save', 'Save')}
          </button>
        </div>
      </div>

      <div className="proposalCardBoard">
        <div className="textBoard">
          <label htmlFor="title">
            <div className="cardHeader">{t('board.cardTitle')}</div>
            <div className="cardSubheaderComment">
              Add or edit the card title. This title will appear as a section
              title if student input is made visible
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
            <div className="cardHeader">{t('board.instructions')}</div>
            <div className="cardSubheaderComment">
              Add or edit instructions for students telling them how to complete
              the card
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

          {inputs?.settings?.includeInReport && (
            <>
              <label htmlFor="description">
                <div className="cardHeader">{t('board.studentResponseBoxNetwork')}</div>
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
                  minHeight={200}
                />
              </div>
            </>
          )}

          {!inputs?.settings?.excludeFromCollaborators && (
            <>
              <label htmlFor="description">
                <div className="cardHeader">{t('board.studentResponseBoxCollaborators')}</div>
                <div className="cardSubheaderComment">
                  The content students include here will only be visible to
                  their project collaborators and teacher(s). Include any
                  templates or placeholder text as needed
                </div>
              </label>

              <div className="jodit">
                <JoditEditor
                  content={internalContent?.current}
                  setContent={(newContent) =>
                    handleContentChange({
                      contentType: "internalContent",
                      newContent,
                    })
                  }
                  minHeight={200}
                />
              </div>
            </>
          )}
        </div>
        <div className="infoBoard">
          <>
            <div className="cardHeader">{t('board.visibility')}</div>
            <div className="cardSubheaderComment">
              Check the boxes below to indicate whether student responses should
              be kept private (only for collaborators on the project + teacher)
              or made visible in the Feedback Center - or a combination of both.
              Examples of “visible” responses you might want to include:
              Proposal, Peer Review, or Final Report responses.
            </div>

            <div className="checkboxText">
              <Checkbox
                name="collaboratorsCardToggle"
                id="collaboratorsCardToggle"
                onChange={(event, data) =>
                  handleChange({
                    target: {
                      name: "settings",
                      value: {
                        ...inputs.settings,
                        excludeFromCollaborators: !data.checked,
                      },
                    },
                  })
                }
                checked={!inputs?.settings?.excludeFromCollaborators}
              />

              <label for="collaboratorsCardToggle">
                <div className="cardDescription">
                  {t('board.includeTextCollaborators')}
                </div>
              </label>
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

              <label for="feedbackCenterCardToggle">
                <div className="cardDescription">
                  {t('board.includeTextFeedbackCenter')}
                </div>
              </label>
            </div>
          </>

          {inputs?.settings?.includeInReport && (
            <div>
              <div className="cardSubheaderComment">
                {t('board.status')}
              </div>
              <Dropdown
                placeholder="Select option"
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

          {/* {user.permissions.map((p) => p?.name).includes("ADMIN") && (
            <div>
              <div className="cardHeader">Type</div>
              <CardType type={inputs?.type} handleChange={handleChange} />
            </div>
          )} */}

          <div>
            <div className="cardHeader">{t('board.type')}</div>
            <CardType type={inputs?.type} handleChange={handleChange} />
          </div>

          <>
            <div className="cardHeader">{t('board.resources')}</div>
            <div className="cardSubheaderComment">
              {t('board.addExistingResources')}
            </div>
            <Resources
              proposal={proposal}
              user={user}
              handleChange={handleChange}
              selectedResources={inputs?.resources || []}
            />
          </>

          <div className="proposalCardComments">
            <div className="cardHeader">{t('board.comments')}</div>
            <div className="cardSubheaderComment">
              This will pre-populate the Comment Box for students. You can
              delete comments later.
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
