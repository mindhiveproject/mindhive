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

import { VIZCHAPTER_TEMPLATES } from "../../../../../Queries/VizChapter";
import { ADD_VIZCHAPTER } from "../../../../../Mutations/VizChapter";
import { STUDY_VIZJOURNAL } from "../../../../../Queries/VizJournal";

export default function BrowseTemplates({ studyId, journal }) {
  const [open, setOpen] = useState(false);

  const [addChapter, { data: addChapterData }] = useMutation(ADD_VIZCHAPTER, {
    refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
  });

  const { data, loading, error } = useQuery(VIZCHAPTER_TEMPLATES);
  const templates = data?.vizChapters || [];

  const selectTemplate = async ({ template }) => {
    const vizSections = template.vizSections.map((section) => ({
      type: section?.type,
      title: section?.title,
      description: section?.description,
      content: section?.content,
    }));

    await addChapter({
      variables: {
        input: {
          title: "Copy of " + template?.title,
          description: template?.description,
          vizPart: {
            connect: {
              id: journal?.vizParts[0]?.id,
            },
          },
          vizSections: {
            create: vizSections,
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
        <DropdownItem onClick={() => {}}>
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
              <button onClick={() => selectTemplate({ template })}>Copy</button>
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
