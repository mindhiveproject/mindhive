import { UPDATE_PROPOSAL_BOARD } from "../../Mutations/Proposal";

import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../Queries/Proposal";

import { useMutation } from "@apollo/client";

import useForm from "../../../lib/useForm";

import {
  AccordionTitle,
  AccordionContent,
  Accordion,
  Icon,
} from "semantic-ui-react";
import { useState } from "react";
import useTranslation from 'next-translate/useTranslation';

export default function ProposalHeader({
  user,
  proposal,
  proposalBuildMode,
  refetchQueries,
}) {
  const { t } = useTranslation('builder');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const studyId = proposal?.study?.id;

  // save and edit the study information
  const { inputs, handleChange, toggleBoolean, toggleSettingsBoolean } =
    useForm({
      ...proposal,
    });

  const [updateProposal, { loading }] = useMutation(UPDATE_PROPOSAL_BOARD, {
    variables: {
      ...inputs,
    },
    refetchQueries: [
      { query: OVERVIEW_PROPOSAL_BOARD_QUERY, variables: { id: proposal?.id } },
      ...refetchQueries,
    ],
  });

  return (
    <div className="header">
      <div>
        {isTitleEditing ? (
          <input
            type="text"
            id="propsalTitle"
            name="title"
            value={inputs.title}
            onChange={handleChange}
            className="titleEdit"
          />
        ) : (
          <div className="titleIcon">
            <div className="title">{inputs?.title}</div>

            <div className="icon">
              <img
                src="/assets/icons/pencil.svg"
                onClick={() => {
                  setIsTitleEditing(!isTitleEditing);
                }}
              />
            </div>
          </div>
        )}

        <div className="subtitle">
          {t('proposal.subtitle', 'This board will guide your students through their MindHive project step by step')}
        </div>

        {proposalBuildMode && (
          <div>
            <Accordion>
              <AccordionTitle
                active={activeIndex === 1}
                index={1}
                onClick={() => {
                  setActiveIndex(activeIndex === 1 ? 0 : 1);
                }}
              >
                <Icon name="dropdown" />
                {t('proposal.advancedOptions', 'Advanced options')}
              </AccordionTitle>
              <AccordionContent active={activeIndex === 1}>
                <>
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
                            <span>{t('proposal.makeTemplate', 'Make this project board a public template')}</span>
                          </div>
                        </label>
                      </div>
                    </>
                  )}

                  <h2>{t('proposal.advancedOptionsHelp', "Checking the boxes below enables students to modify the board. Check in with the MindHive team if you're unsure what this means.")}</h2>

                  <div>
                    <label htmlFor="allowMovingSections">
                      <div className="checkboxField">
                        <input
                          type="checkbox"
                          id="allowMovingSections"
                          name="allowMovingSections"
                          checked={
                            inputs?.settings?.allowMovingSections || false
                          }
                          onChange={toggleSettingsBoolean}
                        />
                        <span>{t('proposal.allowMovingSections', 'Allow students to move sections')}</span>
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
                        <span>{t('proposal.allowMovingCards', 'Allow students to move cards')}</span>
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
                          checked={
                            inputs?.settings?.allowAddingSections || false
                          }
                          onChange={toggleSettingsBoolean}
                        />
                        <span>{t('proposal.allowAddingSections', 'Allow students to add/delete sections')}</span>
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
                        <span>{t('proposal.allowAddingCards', 'Allow students to add/delete cards')}</span>
                      </div>
                    </label>
                  </div>
                </>
              </AccordionContent>
            </Accordion>
          </div>
        )}

        {(inputs.title !== proposal?.title ||
          inputs.description !== proposal?.description ||
          inputs.isTemplate !== proposal?.isTemplate ||
          inputs.settings !== proposal?.settings ||
          inputs.isSubmitted !== proposal?.isSubmitted) && (
          <div>
            <button
              className="secondaryBtn"
              onClick={async () => {
                setIsTitleEditing(false);
                const res = await updateProposal();
              }}
            >
              {loading ? t('proposal.saving', 'Saving') : t('proposal.save', 'Save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
