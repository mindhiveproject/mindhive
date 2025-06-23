import { useState } from "react";
import { useMutation } from "@apollo/client";
import { DropdownItem, Modal, Checkbox } from "semantic-ui-react";
import useForm from "../../../../../../lib/useForm";

import { OnlyAdminAccess } from "../../../../../Global/Restricted";

import StyledModal from "../../../../../styles/StyledModal";
import { StyledModalButtons } from "../../../../../styles/StyledModal";
import { StyledInput } from "../../../../../styles/StyledForm";

import { UPDATE_VIZPART } from "../../../../../Mutations/VizPart";
import { GET_VIZJOURNALS } from "../../../../../Queries/VizJournal";

export default function PartSettings({ user, projectId, studyId, part }) {
  const [isOpen, setIsOpen] = useState(false);

  const { inputs, handleChange } = useForm({
    ...part,
  });

  const [updatePart, { data, loading, error }] = useMutation(UPDATE_VIZPART, {
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

  const update = async () => {
    await updatePart();
    setIsOpen(false);
  };

  return (
    <Modal
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      open={isOpen}
      trigger={
        <DropdownItem>
          <div className="menuItem">
            <img src={`/assets/icons/visualize/edit.svg`} />
            <div>Edit</div>
          </div>
        </DropdownItem>
      }
      dimmer="blurring"
      size="small"
      closeIcon
      onFocus={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <StyledModal>
        <Modal.Header>
          <h1>Edit</h1>
        </Modal.Header>
        <Modal.Content>
          <StyledInput>
            <fieldset disabled={loading} aria-busy={loading}>
              <label htmlFor="title">
                <h3>Title</h3>
                <input
                  className="title"
                  type="title"
                  name="title"
                  value={inputs?.title}
                  onChange={handleChange}
                  required
                />
              </label>

              <label htmlFor="description">
                <h3>Description</h3>
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
                <div>
                  <Checkbox
                    label="Make a template"
                    onChange={(e, data) =>
                      handleChange({
                        target: { name: "isTemplate", value: data.checked },
                      })
                    }
                    checked={inputs?.isTemplate}
                  />
                </div>
              </OnlyAdminAccess>
            </fieldset>
          </StyledInput>
        </Modal.Content>
        <Modal.Actions>
          <button onClick={() => setIsOpen(false)}>Close without saving</button>
          <button onClick={() => update()}>Save & Close</button>
        </Modal.Actions>
      </StyledModal>
    </Modal>
  );
}
