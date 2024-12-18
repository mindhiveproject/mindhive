import { useState } from "react";
import uniqid from "uniqid";
import useForm from "../../../../../lib/useForm";
import moment from "moment";

import { Dropdown, Modal, Icon } from "semantic-ui-react";
import { StyledForm } from "../../../../styles/StyledForm";

export default function StudyVersion({
  engine,
  study,
  handleChange,
  handleMultipleUpdate,
  addFunctions,
  hasStudyChanged,
}) {
  const [version, setVersion] = useState(study?.currentVersion || "");

  const { inputs, handleChange: handleFormChange } = useForm({
    name: "",
    description: "",
  });

  const { versionHistory } = study;

  const versions =
    versionHistory && versionHistory?.length
      ? versionHistory.map((version) => ({
          key: version?.id,
          text: version?.name,
          value: version?.id,
        }))
      : [];

  const createNewVersion = () => {
    if (!inputs?.name) return alert("Please enter the version name");
    const { diagram } = study;

    const newVersion = {
      id: uniqid.time(),
      createdAt: Date.now(),
      name: inputs?.name, // for users to customize
      description: inputs?.description, // for users to customize
      diagram,
    };

    setVersion(newVersion?.id);

    // update the study
    const updatedVersionHistory = versionHistory
      ? [...versionHistory, newVersion]
      : [newVersion];

    handleMultipleUpdate({
      currentVersion: newVersion?.id,
      versionHistory: updatedVersionHistory,
    });

    engine.getModel().setLocked(false);
  };

  const switchToVersion = () => {
    handleChange({
      target: {
        name: "currentVersion",
        value: version,
      },
    });
    const diagram = versionHistory.filter((v) => v?.id === version)[0]?.diagram;
    addFunctions.addStudyTemplateToCanvas({ study: { diagram } });
  };

  const deleteVersion = () => {
    if (
      confirm(
        `Are you sure you want to delete the ${
          versionHistory.filter((v) => v?.id === version)[0]?.name
        }?`
      )
    ) {
      const updatedVersionHistory = versionHistory.filter(
        (v) => v?.id !== version
      );
      handleMultipleUpdate({
        versionHistory: updatedVersionHistory,
      });
    }
  };

  return (
    <div className="studyVersion">
      <div>
        <div className="studyVersionHeader">
          <h2>Study version</h2>
          <span className="studyVersionHeaderNote">
            Save different study designs displayed on the screen on the left
          </span>
        </div>

        {study?.currentVersion ? (
          <>
            <div className="studyVersionInfo">
              <div className="studyVersionHeader">
                <div>
                  <h4>Current version</h4>
                </div>

                <div>
                  <h4>
                    Created on{" "}
                    {moment(
                      versionHistory?.filter(
                        (v) => v?.id === study?.currentVersion
                      )[0]?.createdAt
                    ).format("MMMM D, YYYY, h:mm")}
                  </h4>
                </div>
              </div>

              <p>
                {
                  versionHistory?.filter(
                    (v) => v?.id === study?.currentVersion
                  )[0]?.name
                }
              </p>
              <p className="studyVersionInfoDescription">
                {
                  versionHistory?.filter(
                    (v) => v?.id === study?.currentVersion
                  )[0]?.description
                }
              </p>
            </div>

            <div className="switch">
              <div>
                <Dropdown
                  placeholder="Study versions"
                  fluid
                  selection
                  options={versions}
                  onChange={(event, data) => setVersion(data?.value)}
                  value={version}
                />
              </div>

              <button onClick={switchToVersion}>Load</button>

              <button onClick={deleteVersion} className="deleteBtn">
                Delete
              </button>
            </div>
          </>
        ) : (
          <p>
            No study version has been saved yet. Create a new version by
            clicking on the button below.
          </p>
        )}
      </div>

      <div>
        <CreateVersionModal
          engine={engine}
          inputs={inputs}
          handleFormChange={handleFormChange}
          createNewVersion={createNewVersion}
        />
      </div>
    </div>
  );
}

const CreateVersionModal = ({
  engine,
  inputs,
  handleFormChange,
  createNewVersion,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => {
    engine.getModel().setLocked(true);
    setIsOpen(true);
  };

  const onClose = () => {
    engine.getModel().setLocked(false);
    setIsOpen(false);
  };

  return (
    <Modal
      onClose={() => onClose()}
      onOpen={() => onOpen()}
      open={isOpen}
      trigger={<button>Create new version</button>}
      dimmer="blurring"
      size="small"
      closeIcon
    >
      <Modal.Header>
        <h2>Create new version</h2>
      </Modal.Header>

      <Modal.Content>
        <StyledForm>
          <label htmlFor="name">
            Name
            <input
              type="text"
              name="name"
              value={inputs.name}
              onChange={handleFormChange}
            />
          </label>

          <label htmlFor="description">
            Description
            <input
              type="text"
              name="description"
              value={inputs.description}
              onChange={handleFormChange}
            />
          </label>
        </StyledForm>
      </Modal.Content>
      <Modal.Actions>
        <button
          onClick={() => {
            createNewVersion();
            setIsOpen(false);
          }}
        >
          Create new version
        </button>
      </Modal.Actions>
    </Modal>
  );
};
