import { useMutation } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import DropdownMenu from "../../../../DesignSystem/DropdownMenu";
import { CREATE_VIZJOURNAL } from "../../../../Mutations/VizJournal";
import { ADD_VIZPART } from "../../../../Mutations/VizPart";
import { GET_DATA_JOURNALS } from "../../../../Queries/DataArea";

import JournalTemplateModal from "./JournalTemplateModal";

export default function CreateJournal({
  projectId,
  studyId,
  createNewJournalCollection,
  journalCollections,
}) {
  const { t } = useTranslation("builder");
  const [createJournal, { loading }] = useMutation(
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
      loading: createPartLoading,
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

  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const addNewJournalFromTemplate = () => {
    setTemplateModalOpen(true);
  };

  const blocked = loading || createPartLoading;

  const label = t(
    "dataJournal.sideNav.addJournal",
    {},
    { default: "Journal" },
  );
  const ariaLabel = t(
    "dataJournal.sideNav.addJournalAria",
    {},
    { default: "Add a new journal" },
  );

  const menuItems = [
    {
      key: "scratch",
      label: t("dataJournal.sideNav.addJournalScratch", {}, {
        default: "Create a journal from scratch",
      }),
      onClick: addNewJournal,
    },
    {
      key: "template",
      label: t("dataJournal.sideNav.addJournalTemplate", {}, {
        default: "Add a journal template",
      }),
      onClick: addNewJournalFromTemplate,
    },
  ];

  return (
    <div className="createJournalBtn">
      <DropdownMenu
        ariaLabel={ariaLabel}
        renderTrigger={({ onClick, open, ariaLabel: triggerAriaLabel }) => (
          <Button
            variant="subtle"
            leadingIcon={<img src="/assets/icons/plus.svg" alt="" />}
            type="button"
            aria-label={triggerAriaLabel}
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={onClick}
            disabled={blocked}
          >
            {label}
          </Button>
        )}
        items={menuItems}
      />
      <JournalTemplateModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        projectId={projectId}
        studyId={studyId}
        journalCollections={journalCollections}
        createNewJournalCollection={createNewJournalCollection}
      />
    </div>
  );
}
