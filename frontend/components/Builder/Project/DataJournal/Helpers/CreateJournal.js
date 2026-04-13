import { useMutation } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import { CREATE_VIZJOURNAL } from "../../../../Mutations/VizJournal";
import { ADD_VIZPART } from "../../../../Mutations/VizPart";
import { GET_DATA_JOURNALS } from "../../../../Queries/DataArea";

const ADD_NEW_JOURNAL_VALUE = "__add_new_journal__";
const ADD_TEMPLATE_JOURNAL_VALUE = "__add_template_journal__";

export default function CreateJournal({
  projectId,
  studyId,
  createNewJournalCollection,
  journalCollections,
}) {
  const { t } = useTranslation("builder");
  const [createJournal, { data, loading, error }] = useMutation(
    CREATE_VIZJOURNAL,
    {
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
    }
  );

  const [
    createPart,
    {
      data: createPartData,
      loading: createPartLoading,
      error: createPartError,
    },
  ] = useMutation(ADD_VIZPART, {
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

  const addNewJournalToExistingCollection = () => {
    const journalCollection = journalCollections[0];
    createPart({
      variables: {
        input: {
          title: "Unnamed journal",
          vizChapters: {
            create: [{ title: "Unnamed workspace", description: "" }],
          },
          vizJournal: {
            connect: {
              id: journalCollection?.id,
            },
          },
        },
      },
    });
  };

  const initializeJournalCollectionWithJournalAndWorkspace = () => {
    createJournal({
      variables: {
        input: {
          title: "Unnamed journal collection",
          project: projectId
            ? {
                connect: {
                  id: projectId,
                },
              }
            : null,
          study: studyId
            ? {
                connect: {
                  id: studyId,
                },
              }
            : null,
          vizParts: {
            create: [
              {
                title: "Unnamed journal",
                vizChapters: {
                  create: [
                    {
                      title: "Unnamed workspace",
                      description: "",
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    });
  };

  const addNewJournal = () => {
    if (createNewJournalCollection) {
      initializeJournalCollectionWithJournalAndWorkspace();
    } else {
      addNewJournalToExistingCollection();
    }
  };

  const addNewJournalFromTemplate = () => {
    console.log("addNewJournalFromTemplate");
  };

  const [journalDropdownValue, setJournalDropdownValue] = useState(undefined);

  const handleJournalDropdownChange = (next) => {
    if (next === ADD_NEW_JOURNAL_VALUE) {
      addNewJournal();
      setJournalDropdownValue(undefined);
      return;
    }
    if (next === ADD_TEMPLATE_JOURNAL_VALUE) {
      addNewJournalFromTemplate();
      setJournalDropdownValue(undefined);
      return;
    }
    setJournalDropdownValue(next);
  };

  const journalDropdownOptions = [
    {
      value: ADD_NEW_JOURNAL_VALUE,
      label: t("dataJournal.sideNav.addJournalScratch", {}, {
        default: "Create a journal from scratch",
      }),
    },
    {
      value: ADD_TEMPLATE_JOURNAL_VALUE,
      label: t("dataJournal.sideNav.addJournalTemplate", {}, {
        default: "Add a journal template",
      }),
    },
  ];

  return (
    <div className="createJournalBtn">
      <DropdownSelect
        value={journalDropdownValue}
        options={journalDropdownOptions}
        onChange={handleJournalDropdownChange}
        ariaLabel={t("dataJournal.sideNav.addJournal", {}, {
          default: "Journal",
        })}
        placeholder={t("dataJournal.sideNav.addJournal", {}, {
          default: "Journal",
        })}
        icon="+"
        triggerStyle={{ backgroundColor: "#F6F9F8", border: "none", fontWeight: 600, fontSize: "16px", color: "#5D5763" }}
      />
    </div>
  );
}
