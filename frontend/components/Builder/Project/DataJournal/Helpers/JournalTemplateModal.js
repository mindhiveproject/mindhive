// Modal to pick a VizPart template and clone it into the Data Journal (VizJournal + new VizPart).

import { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { CREATE_VIZJOURNAL } from "../../../../Mutations/VizJournal";
import { ADD_VIZPART } from "../../../../Mutations/VizPart";
import { GET_DATA_JOURNALS } from "../../../../Queries/DataArea";
import { VIZPART_TEMPLATES } from "../../../../Queries/VizPart";

import {
  StyledModalOverlay,
  StyledModalContent,
  StyledModalHeader,
  StyledModalBody,
  StyledModalFooter,
  StyledModalClose,
  StyledModalButton,
  StyledDataSourceList,
} from "../styles/StyledDataSourceModal";

function getDataJournalsWhere(projectId, studyId) {
  if (projectId && studyId) {
    return {
      OR: [
        { project: { id: { equals: projectId } } },
        { study: { id: { equals: studyId } } },
      ],
    };
  }
  if (projectId) return { project: { id: { equals: projectId } } };
  if (studyId) return { study: { id: { equals: studyId } } };
  return null;
}

const TemplateRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  background: white;
`;

const TemplateBody = styled.div`
  flex: 1;
  min-width: 0;
  h3 {
    margin: 0 0 6px;
    font-family: Nunito, sans-serif;
    font-weight: 600;
    font-size: 16px;
    color: #333;
  }
  p {
    margin: 0;
    font-family: Inter, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    color: #555;
  }
  .meta {
    margin-top: 8px;
    font-size: 12px;
    color: #666;
    font-family: Inter, sans-serif;
  }
`;

export default function JournalTemplateModal({
  open,
  onOpenChange,
  projectId,
  studyId,
  journalCollections,
  createNewJournalCollection,
}) {
  const { t } = useTranslation("builder");
  const [copyingId, setCopyingId] = useState(null);

  const where = getDataJournalsWhere(projectId, studyId);
  const refetchQueries = [
    {
      query: GET_DATA_JOURNALS,
      variables: { where },
    },
  ];

  const { data, loading, error } = useQuery(VIZPART_TEMPLATES, {
    skip: !open,
  });

  const [createJournal] = useMutation(CREATE_VIZJOURNAL, {
    refetchQueries,
  });

  const [createPart] = useMutation(ADD_VIZPART, {
    refetchQueries,
  });

  const templates = data?.vizParts || [];
  const journalCollection = journalCollections?.[0];

  const close = () => onOpenChange(false);

  const selectTemplate = async (template) => {
    setCopyingId(template.id);
    try {
      let currentJournal = journalCollection;

      if (!currentJournal?.id && createNewJournalCollection) {
        const newJournal = await createJournal({
          variables: {
            input: {
              title: t(
                "dataJournal.sideNav.templateModal.newCollectionTitle",
                {},
                { default: "Unnamed journal collection" },
              ),
              project: projectId
                ? { connect: { id: projectId } }
                : null,
              study: studyId
                ? { connect: { id: studyId } }
                : null,
            },
          },
        });
        currentJournal = newJournal?.data?.createVizJournal;
      }

      if (!currentJournal?.id) {
        window.alert(
          t(
            "dataJournal.sideNav.templateModal.missingJournal",
            {},
            {
              default:
                "No journal collection is available. Create a journal from scratch first.",
            },
          ),
        );
        return;
      }

      const vizChapters = (template.vizChapters || []).map((chapter) => ({
        title: chapter?.title,
        description: chapter?.description,
        vizSections: {
          create: (chapter?.vizSections || []).map((section) => ({
            type: section?.type,
            title: section?.title,
            description: section?.description,
            content: section?.content,
          })),
        },
      }));

      const datasourceConnect = (template.datasources || []).map((ds) => ({
        id: ds.id,
      }));

      const input = {
        title:
          t(
            "dataJournal.sideNav.templateModal.copyTitlePrefix",
            {},
            { default: "Copy of " },
          ) + (template?.title || ""),
        description: template?.description,
        dataOrigin:
          template?.dataOrigin === "UPLOADED" ? "UPLOADED" : "TEMPLATE",
        settings: template?.settings,
        content: template?.content,
        vizChapters: { create: vizChapters },
        vizJournal: { connect: { id: currentJournal.id } },
      };

      if (datasourceConnect.length > 0) {
        input.datasources = { connect: datasourceConnect };
      }

      await createPart({ variables: { input } });
      close();
    } catch (err) {
      window.alert(
        t(
          "dataJournal.sideNav.templateModal.copyError",
          { message: err?.message || String(err) },
          { default: "Could not create from template: {{message}}" },
        ),
      );
    } finally {
      setCopyingId(null);
    }
  };

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <StyledModalOverlay
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <StyledModalContent
        role="dialog"
        aria-modal="true"
        aria-labelledby="journal-template-modal-title"
        onClick={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
      >
        <StyledModalHeader>
          <h2 id="journal-template-modal-title">
            {t(
              "dataJournal.sideNav.templateModal.title",
              {},
              { default: "Choose a journal template" },
            )}
          </h2>
          <StyledModalClose
            type="button"
            onClick={close}
            aria-label={t(
              "dataJournal.sideNav.collapsePanel",
              {},
              { default: "Close" },
            )}
          >
            &times;
          </StyledModalClose>
        </StyledModalHeader>
        <StyledModalBody>
          {loading && (
            <p>
              {t(
                "dataJournal.sideNav.templateModal.loading",
                {},
                { default: "Loading templates…" },
              )}
            </p>
          )}
          {error && (
            <p role="alert">
              {t(
                "dataJournal.sideNav.templateModal.queryError",
                { message: error.message },
                { default: "Error loading templates: {{message}}" },
              )}
            </p>
          )}
          {!loading && !error && templates.length === 0 && (
            <p>
              {t(
                "dataJournal.sideNav.templateModal.empty",
                {},
                {
                  default:
                    "No templates are available yet. Mark a journal as a template (admin) or ask your team to add one.",
                },
              )}
            </p>
          )}
          {!loading && !error && templates.length > 0 && (
            <StyledDataSourceList>
              {templates.map((template) => {
                const n = template?.datasources?.length ?? 0;
                const datasetsLabel =
                  n === 0
                    ? t(
                        "dataJournal.sideNav.templateModal.datasetsNone",
                        {},
                        { default: "No datasets linked" },
                      )
                    : n === 1
                      ? t(
                          "dataJournal.sideNav.templateModal.datasetsOne",
                          {},
                          { default: "1 dataset linked" },
                        )
                      : t(
                          "dataJournal.sideNav.templateModal.datasetsMany",
                          { count: n },
                          { default: "{{count}} datasets linked" },
                        );

                return (
                  <TemplateRow key={template.id}>
                    <TemplateBody>
                      <h3>{template?.title || "—"}</h3>
                      {template?.description ? (
                        <p>{template.description}</p>
                      ) : null}
                      <div className="meta">{datasetsLabel}</div>
                    </TemplateBody>
                    <StyledModalButton
                      type="button"
                      className="save"
                      disabled={!!copyingId}
                      onClick={() => selectTemplate(template)}
                    >
                      {copyingId === template.id
                        ? t("header.saving", {}, { default: "Saving" })
                        : t(
                            "dataJournal.sideNav.templateModal.useTemplate",
                            {},
                            { default: "Use template" },
                          )}
                    </StyledModalButton>
                  </TemplateRow>
                );
              })}
            </StyledDataSourceList>
          )}
        </StyledModalBody>
        <StyledModalFooter>
          <StyledModalButton type="button" className="cancel" onClick={close}>
            {t(
              "dataJournal.sideNav.dataSourceModal.cancel",
              {},
              { default: "Cancel" },
            )}
          </StyledModalButton>
        </StyledModalFooter>
      </StyledModalContent>
    </StyledModalOverlay>,
    document.body,
  );
}
