// Edit VizPart (which is Journal in the UI)

import styled from "styled-components";
import { createPortal } from "react-dom";
import useForm from "../../../../../lib/useForm";
import useTranslation from "next-translate/useTranslation";

import { OnlyAdminAccess } from "../../../../Global/Restricted";

import { useMutation } from "@apollo/client";
import { UPDATE_VIZPART } from "../../../../Mutations/VizPart";
import { GET_DATA_JOURNALS } from "../../../../Queries/DataArea";

import {
  StyledModalOverlay,
  StyledModalContent,
  StyledModalHeader,
  StyledModalBody,
  StyledModalFooter,
  StyledModalClose,
  StyledModalButton,
} from "../styles/StyledDataSourceModal";

const FormFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
    &[disabled] {
      opacity: 0.55;
      pointer-events: none;
    }
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field-label {
    font-family: Inter, sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #333;
  }

  input[type="text"],
  textarea {
    font-family: Inter, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    color: #1a1a1a;
    border: 1px solid #e6e6e6;
    border-radius: 6px;
    padding: 10px 12px;
    width: 100%;
    box-sizing: border-box;
    background: #fff;
    &:focus {
      outline: none;
      border-color: #333;
      box-shadow: 0 0 0 1px #333;
    }
  }

  textarea {
    min-height: 88px;
    resize: vertical;
  }

  .checkboxRow {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 4px;
  }

  .checkboxRow input[type="checkbox"] {
    margin-top: 2px;
    width: 16px;
    height: 16px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .checkboxRow span {
    font-family: Inter, sans-serif;
    font-size: 14px;
    color: #333;
    line-height: 1.35;
  }
`;

export default function EditJournal({
  user,
  projectId,
  studyId,
  part,
  open,
  onOpenChange,
}) {
  const { t } = useTranslation("builder");

  const { inputs, handleChange } = useForm({
    ...part,
  });

  const [updatePart, { loading }] = useMutation(UPDATE_VIZPART, {
    variables: {
      id: part?.id,
      input: {
        title: inputs?.title,
        description: inputs?.description,
        isTemplate: inputs?.isTemplate,
        settings: {
          studyId: studyId,
        },
      },
    },
    refetchQueries: [
      {
        query: GET_DATA_JOURNALS,
        variables: {
          where:
            projectId && studyId
              ? {
                  OR: [
                    { project: { id: { equals: projectId } } },
                    { study: { id: { equals: studyId } } },
                  ],
                }
              : projectId
              ? { project: { id: { equals: projectId } } }
              : studyId
              ? { study: { id: { equals: studyId } } }
              : null,
        },
      },
    ],
  });

  const close = () => onOpenChange(false);

  const update = async () => {
    await updatePart();
    close();
  };

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <StyledModalOverlay>
      <StyledModalContent
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-journal-title"
        onClick={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
      >
        <StyledModalHeader>
          <h2 id="edit-journal-title">
            {t("dataJournal.sideNav.editJournalTitle", "Edit journal")}
          </h2>
          <StyledModalClose
            type="button"
            onClick={close}
            aria-label={t("dataJournal.sideNav.collapsePanel", "Close")}
          >
            &times;
          </StyledModalClose>
        </StyledModalHeader>
        <StyledModalBody>
          <FormFields>
            <fieldset disabled={loading} aria-busy={loading}>
              <label htmlFor="title">
                <span className="field-label">
                  {t("dataJournal.sideNav.editJournalFieldTitle", "Title")}
                </span>
                <input
                  className="title"
                  type="text"
                  name="title"
                  id="title"
                  value={inputs?.title}
                  onChange={handleChange}
                  required
                />
              </label>

              <label htmlFor="description">
                <span className="field-label">
                  {t(
                    "dataJournal.sideNav.editJournalFieldDescription",
                    "Description",
                  )}
                </span>
                <textarea
                  className="description"
                  id="description"
                  name="description"
                  value={inputs?.description}
                  onChange={handleChange}
                  rows={3}
                />
              </label>

              <OnlyAdminAccess user={user}>
                <label className="checkboxRow" htmlFor="edit-journal-template">
                  <input
                    type="checkbox"
                    id="edit-journal-template"
                    name="isTemplate"
                    checked={!!inputs?.isTemplate}
                    onChange={(e) =>
                      handleChange({
                        target: { name: "isTemplate", value: e.target.checked },
                      })
                    }
                  />
                  <span>
                    {t(
                      "dataJournal.sideNav.editJournalTemplateCheckbox",
                      "Make a template",
                    )}
                  </span>
                </label>
              </OnlyAdminAccess>
            </fieldset>
          </FormFields>
        </StyledModalBody>
        <StyledModalFooter>
          <StyledModalButton type="button" className="cancel" onClick={close}>
            {t(
              "dataJournal.sideNav.editJournalCloseWithoutSaving",
              "Close without saving",
            )}
          </StyledModalButton>
          <StyledModalButton
            type="button"
            className="save"
            onClick={() => update()}
            disabled={loading}
          >
            {loading
              ? t("header.saving", "Saving")
              : t("dataJournal.sideNav.editJournalSaveClose", "Save and close")}
          </StyledModalButton>
        </StyledModalFooter>
      </StyledModalContent>
    </StyledModalOverlay>,
    document.body,
  );
}
