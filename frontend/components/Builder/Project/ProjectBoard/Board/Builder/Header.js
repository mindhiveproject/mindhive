import { UPDATE_PROPOSAL_BOARD } from "../../../../../Mutations/Proposal";

import { OVERVIEW_PROPOSAL_BOARD_QUERY } from "../../../../../Queries/Proposal";

import { useMutation } from "@apollo/client";

import useForm from "../../../../../../lib/useForm";

import { Icon, Radio } from "semantic-ui-react";

import useTranslation from "next-translate/useTranslation";

export default function ProposalHeader({
  user,
  proposal,
  proposalBuildMode,
  refetchQueries,
  isPDF,
  setIsPDF,
}) {
  const { t } = useTranslation("builder");
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
        {!proposalBuildMode && (
          <div>
            <div className="titleEditBtn">
              <h1>{t("header.myProjectBoard", "My Project Board")}</h1>
              <div id="switchMode" style={{display: "flex", width: "max-content"}}>
              <button onClick={() => {setIsPDF(!isPDF);}} className="narrowButton">
                  <Icon name="list alternate"/> {t("proposalPage.viewFlattenBoard", "Text View")}
              </button>
              {/* <Radio
                toggle
                checked={isPDF}
                onChange={() => {
                  setIsPDF(!isPDF);
                }}
              /> */}
              </div>
            </div>

            <p>
              {t("header.createYourStudyProposal", "Create your study proposal here to begin your research journey ")}
            </p>
          </div>
        )}

        {proposalBuildMode && (
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
                  placeholder={t("header.titlePlaceholder", "Enter project board title")}
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
                  placeholder={t("header.descriptionPlaceholder", "Enter project board description")}
                />
              </label>
            </div>

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
                      <span>{t("header.publicTemplate", "Public template")}</span>
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
                  <span>{t("header.allowMovingSections", "Allow moving sections")}</span>
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
                  <span>{t("header.allowMovingCards", "Allow moving cards")}</span>
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
                  <span>{t("header.allowAddingSections", "Allow adding new sections")}</span>
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
                  <span>{t("header.allowAddingCards", "Allow adding new cards")}</span>
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
              {loading ? t("header.saving", "Saving") : t("header.save", "Save")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
