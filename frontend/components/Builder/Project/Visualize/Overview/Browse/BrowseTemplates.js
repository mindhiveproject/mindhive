import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";

import {
  DropdownItem,
  ModalHeader,
  ModalDescription,
  ModalContent,
  ModalActions,
  Button,
  Modal,
} from "semantic-ui-react";

import { VIZPART_TEMPLATES } from "../../../../../Queries/VizPart";
import { ADD_VIZPART } from "../../../../../Mutations/VizPart";
import { GET_VIZJOURNALS } from "../../../../../Queries/VizJournal";
import { CREATE_VIZJOURNAL } from "../../../../../Mutations/VizJournal";

export default function BrowseTemplates({ projectId, studyId, journal }) {
  const [open, setOpen] = useState(false);

  const [addPart, { data: addPartData }] = useMutation(ADD_VIZPART, {
    refetchQueries: [
      {
        query: GET_VIZJOURNALS,
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

  const { data, loading, error } = useQuery(VIZPART_TEMPLATES);
  const templates = data?.vizParts || [];

  const [createJournal, { data: createJournalData }] =
    useMutation(CREATE_VIZJOURNAL);

  const selectTemplate = async ({ template }) => {
    let currentJournal = journal;

    // create a new journal if there is no journal
    if (!journal) {
      const newJournal = await createJournal({
        variables: {
          input: {
            title: "Unnamed journal",
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
          },
        },
      });
      currentJournal = newJournal?.data?.createVizJournal;
    }

    const vizChapters = template.vizChapters.map((chapter) => ({
      title: chapter?.title,
      description: chapter?.description,
      vizSections: {
        create: chapter?.vizSections.map((section) => ({
          type: section?.type,
          title: section?.title,
          description: section?.description,
          content: section?.content,
        })),
      },
    }));

    await addPart({
      variables: {
        input: {
          title: "Copy of " + template?.title,
          description: template?.description,
          dataOrigin:
            template?.dataOrigin === "UPLOADED" ? "UPLOADED" : "TEMPLATE",
          settings: template?.settings,
          content: template?.content,
          vizChapters: {
            create: vizChapters,
          },
          vizJournal: {
            connect: {
              id: currentJournal?.id,
            },
          },
        },
      },
    });

    setOpen(false);
  };

  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={
        <DropdownItem>
          <div className="menuItem">
            <img src={`/assets/icons/visualize/description.svg`} />
            <div>Browse templates</div>
          </div>
        </DropdownItem>
      }
    >
      <ModalHeader>Select a Template</ModalHeader>
      <ModalContent>
        <ModalDescription>
          {templates.map((template) => (
            <div key={template?.id}>
              <div>
                <h2>{template?.title}</h2>
              </div>
              <div>
                <p>{template?.description}</p>
              </div>
              <button onClick={async () => await selectTemplate({ template })}>
                Copy
              </button>
            </div>
          ))}
        </ModalDescription>
      </ModalContent>
      <ModalActions>
        <Button color="black" onClick={() => setOpen(false)}>
          Close
        </Button>
      </ModalActions>
    </Modal>
  );
}
