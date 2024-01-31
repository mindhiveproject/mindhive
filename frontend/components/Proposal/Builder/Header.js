import { UPDATE_PROPOSAL_BOARD } from "../../Mutations/Proposal";

import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../Queries/Proposal";

import { useMutation } from "@apollo/client";

import useForm from "../../../lib/useForm";

export default function ProposalHeader({
  user,
  proposal,
  proposalBuildMode,
  refetchQueries,
}) {
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
        <div>
          <label htmlFor="title">
            <input
              type="text"
              id="propsalTitle"
              name="title"
              value={inputs.title}
              onChange={handleChange}
              required
              className="title"
            />
          </label>
        </div>

        <div>
          <label htmlFor="description">
            <textarea
              id="description"
              name="description"
              value={inputs.description}
              onChange={handleChange}
              rows="1"
              className="description"
            />
          </label>
        </div>

        {proposalBuildMode && (
          <div>
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
                      <span>Public template</span>
                    </div>
                  </label>
                </div>
              </>
            )}

            {/* <div>
              <label htmlFor="isSubmitted">
                <div className="checkboxField">
                  <input
                    type="checkbox"
                    id="isSubmitted"
                    name="isSubmitted"
                    checked={inputs?.isSubmitted || false}
                    onChange={toggleBoolean}
                  />
                  <span>Submit as a template</span>
                </div>
              </label>
            </div> */}

            <div>
              <label htmlFor="allowMovingSections">
                <div className="checkboxField">
                  <input
                    type="checkbox"
                    id="allowMovingSections"
                    name="allowMovingSections"
                    checked={inputs?.settings?.allowMovingSections || false}
                    onChange={toggleSettingsBoolean}
                  />
                  <span>Allow moving sections</span>
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
                  <span>Allow moving cards</span>
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
                    checked={inputs?.settings?.allowAddingSections || false}
                    onChange={toggleSettingsBoolean}
                  />
                  <span>Allow adding new sections</span>
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
                  <span>Allow adding new cards</span>
                </div>
              </label>
            </div>
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
                const res = await updateProposal();
              }}
            >
              {loading ? "Saving" : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
