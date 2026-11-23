// Shown after a dataset is created or copied: attach it to one of this
// study's/board's journals, to a new journal, or leave it unattached.
// Nothing is attached without the user choosing it here.
import { useEffect, useId, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import useTranslation from "next-translate/useTranslation";

import Modal from "../../../../DesignSystem/Modal";
import Button from "../../../../DesignSystem/Button";
import Radio from "../../../../DesignSystem/Radio";
import Input from "../../../../DesignSystem/Input";
import { GET_DATA_JOURNALS } from "../../../../Queries/DataArea";
import { ADD_VIZPART } from "../../../../Mutations/VizPart";
import { UPDATE_DATASOURCE } from "../../../../Mutations/Datasource";
import { useDataJournal } from "../Context/DataJournalContext";

const CREATE_JOURNAL_COLLECTION = gql`
  mutation CREATE_JOURNAL_COLLECTION_FOR_DATASET(
    $input: VizJournalCreateInput!
  ) {
    createVizJournal(data: $input) {
      id
      vizParts {
        id
        title
      }
    }
  }
`;

const NEW = "__new__";

export function journalsWhereFor(projectId, studyId) {
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

/**
 * @param {{ dataset: { id: string, title?: string } | null,
 *   onDone: (journal: { id: string, title?: string } | null) => void }} props
 *   `onDone(null)` when the user leaves the dataset unattached.
 */
export default function AttachToJournalModal({ dataset, onDone }) {
  const { t } = useTranslation("builder");
  const { projectId, studyId } = useDataJournal();
  const groupLabelId = useId();
  const where = journalsWhereFor(projectId, studyId);

  const { data, loading } = useQuery(GET_DATA_JOURNALS, {
    variables: { where },
    skip: !where || !dataset,
  });
  const collections = data?.vizJournals || [];
  const journals = useMemo(
    () => collections.flatMap((vj) => vj?.vizParts || []).filter(Boolean),
    [collections],
  );

  const [choice, setChoice] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(null);

  // Fresh choices for each dataset: the first journal, or a new one if none.
  useEffect(() => {
    if (!dataset) return;
    setError(null);
    setWorking(false);
    setNewTitle(dataset.title || "");
  }, [dataset?.id]);
  useEffect(() => {
    if (!dataset || loading) return;
    setChoice(journals[0]?.id ?? NEW);
  }, [dataset?.id, loading, journals.length]);

  const refetchQueries = [
    { query: GET_DATA_JOURNALS, variables: { where } },
    "GET_DATASOURCES",
  ];
  const [createPart] = useMutation(ADD_VIZPART);
  const [createCollection] = useMutation(CREATE_JOURNAL_COLLECTION);
  const [updateDatasource] = useMutation(UPDATE_DATASOURCE, {
    refetchQueries,
    awaitRefetchQueries: true,
  });

  if (!dataset) return null;

  const untitled = t("dataJournal.attachDataset.untitledJournal", {}, {
    default: "Unnamed journal",
  });

  const createJournal = async () => {
    const title = newTitle.trim() || untitled;
    const workspace = {
      create: [{ title: "Unnamed workspace", description: "" }],
    };
    if (collections[0]?.id) {
      const res = await createPart({
        variables: {
          input: {
            title,
            vizChapters: workspace,
            vizJournal: { connect: { id: collections[0].id } },
          },
        },
      });
      const id = res?.data?.createVizPart?.id;
      return id ? { id, title } : null;
    }
    const res = await createCollection({
      variables: {
        input: {
          title: "Unnamed journal collection",
          ...(projectId && { project: { connect: { id: projectId } } }),
          ...(studyId && { study: { connect: { id: studyId } } }),
          vizParts: { create: [{ title, vizChapters: workspace }] },
        },
      },
    });
    return res?.data?.createVizJournal?.vizParts?.[0] || null;
  };

  const handleAttach = async () => {
    if (!choice || working) return;
    setWorking(true);
    setError(null);
    try {
      const journal =
        choice === NEW ? await createJournal() : journals.find((j) => j.id === choice);
      if (!journal?.id) throw new Error("No journal");
      await updateDatasource({
        variables: {
          id: dataset.id,
          data: { journal: { connect: [{ id: journal.id }] } },
        },
      });
      onDone(journal);
    } catch (err) {
      console.error("Error attaching dataset to journal:", err);
      setError(
        t("dataJournal.attachDataset.error", {}, {
          default: "The dataset could not be attached. It is saved, unattached.",
        }),
      );
      setWorking(false);
    }
  };

  const optionRow = (value, label, extra = null) => (
    <div
      key={value}
      style={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid var(--MH-Theme-Neutrals-Light, #e0e0e0)",
        borderRadius: 8,
        padding: "0 12px 0 0",
        background:
          choice === value ? "var(--MH-Theme-Primary-Lighter, #f0f6ff)" : "transparent",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
        onClick={() => !working && setChoice(value)}
      >
        <Radio
          checked={choice === value}
          onChange={() => setChoice(value)}
          disabled={working}
          ariaLabel={typeof label === "string" ? label : undefined}
        />
        <span className="MH-Type-Body-Base" style={{ color: "#171717" }}>
          {label}
        </span>
      </div>
      {extra}
    </div>
  );

  return (
    <Modal
      open
      onClose={() => !working && onDone(null)}
      maxWidth={480}
      title={
        <span className="MH-Type-Header-Small">
          {t("dataJournal.attachDataset.title", {}, {
            default: "Add this dataset to a journal?",
          })}
        </span>
      }
      actions={
        <>
          <Button
            variant="outline"
            type="button"
            disabled={working}
            onClick={() => onDone(null)}
          >
            {t("dataJournal.attachDataset.skip", {}, {
              default: "Leave unattached",
            })}
          </Button>
          <Button
            variant="filled"
            type="button"
            disabled={working || loading || !choice}
            onClick={handleAttach}
          >
            {choice === NEW
              ? t("dataJournal.attachDataset.createAndAttach", {}, {
                  default: "Create journal and add",
                })
              : t("dataJournal.attachDataset.attach", {}, {
                  default: "Add to journal",
                })}
          </Button>
        </>
      }
    >
      <p className="MH-Type-Body-Base" style={{ marginTop: 0 }}>
        {t(
          "dataJournal.attachDataset.intro",
          { title: dataset.title || "" },
          {
            default:
              "“{{title}}” is saved. Add it to a journal to analyze it there, or leave it unattached: you can add it from a journal's data sources later.",
          },
        )}
      </p>
      {loading ? (
        <p className="MH-Type-Body-Base">
          {t("dataJournal.attachDataset.loading", {}, {
            default: "Loading journals…",
          })}
        </p>
      ) : (
        <div
          role="radiogroup"
          aria-labelledby={groupLabelId}
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          <span id={groupLabelId} className="MH-Type-Label-Base" style={{ color: "#171717" }}>
            {t("dataJournal.attachDataset.groupLabel", {}, {
              default: "Journal",
            })}
          </span>
          {journals.map((j) => optionRow(j.id, j.title || untitled))}
          {optionRow(
            NEW,
            t("dataJournal.attachDataset.newJournal", {}, {
              default: "A new journal",
            }),
            choice === NEW ? (
              <div style={{ padding: "0 0 12px 48px" }}>
                <Input
                  label={t("dataJournal.attachDataset.newJournalName", {}, {
                    default: "Journal name",
                  })}
                  value={newTitle}
                  onChange={setNewTitle}
                  disabled={working}
                />
              </div>
            ) : null,
          )}
        </div>
      )}
      {error ? (
        <p
          role="alert"
          className="MH-Type-Body-Base"
          style={{ color: "#c62828", marginBottom: 0 }}
        >
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
