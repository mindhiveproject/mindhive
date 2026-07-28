import { useState } from "react";
import uniqid from "uniqid";
import useForm from "../../../../../lib/useForm";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";
import { Modal } from "semantic-ui-react";

import Button from "../../../../DesignSystem/Button";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import { StyledForm } from "../../../../styles/StyledForm";

export default function StudyVersion({
  engine,
  study,
  handleChange,
  handleMultipleUpdate,
  addFunctions,
  hasStudyChanged,
}) {
  const { t } = useTranslation("builder");
  const [version, setVersion] = useState(study?.currentVersion || "");

  const { inputs, handleChange: handleFormChange } = useForm({
    name: "",
    description: "",
  });

  const { versionHistory } = study;

  const versions =
    versionHistory && versionHistory?.length
      ? versionHistory.map((entry) => ({
          value: entry?.id,
          label: entry?.name,
        }))
      : [];

  const currentVersionEntry = versionHistory?.find(
    (entry) => entry?.id === study?.currentVersion
  );

  const createNewVersion = () => {
    if (!inputs?.name) {
      alert(
        t("version.enterVersionName", {}, {
          default: "Please enter the version name",
        })
      );
      return;
    }

    const canvasState = addFunctions?.getDiagramState?.() || {};
    const diagram = canvasState.diagram || study?.diagram;
    const flow = canvasState.flow ?? study?.flow;

    if (!diagram) {
      alert(
        t("version.missingDiagram", {}, {
          default: "This version has no saved diagram to load.",
        })
      );
      return;
    }

    const newVersion = {
      id: uniqid.time(),
      createdAt: Date.now(),
      name: inputs?.name,
      description: inputs?.description,
      diagram,
    };

    setVersion(newVersion?.id);

    const updatedVersionHistory = versionHistory
      ? [...versionHistory, newVersion]
      : [newVersion];

    handleMultipleUpdate({
      currentVersion: newVersion?.id,
      versionHistory: updatedVersionHistory,
      diagram,
      flow,
    });

    engine.getModel().setLocked(false);
  };

  const switchToVersion = () => {
    if (!version) return;

    const entry = versionHistory?.find((v) => v?.id === version);
    if (!entry?.diagram) {
      alert(
        t("version.missingDiagram", {}, {
          default: "This version has no saved diagram to load.",
        })
      );
      return;
    }

    if (hasStudyChanged) {
      const shouldLoad = confirm(
        t("version.confirmLoadUnsaved", {}, {
          default:
            "You have unsaved canvas changes. Load this version anyway? Your current canvas will be kept on the version you are leaving until you save.",
        })
      );
      if (!shouldLoad) return;
    }

    // Keep the live canvas on the version we are leaving (in memory).
    let nextHistory = versionHistory || [];
    const leavingId = study?.currentVersion;
    if (leavingId && typeof addFunctions?.getDiagramState === "function") {
      const currentState = addFunctions.getDiagramState();
      if (currentState?.diagram) {
        nextHistory = nextHistory.map((v) =>
          v?.id === leavingId ? { ...v, diagram: currentState.diagram } : v
        );
      }
    }

    const diagramToLoad =
      nextHistory.find((v) => v?.id === version)?.diagram || entry.diagram;

    const result = addFunctions.addStudyTemplateToCanvas({
      study: { diagram: diagramToLoad },
    });
    if (!result) return;

    handleMultipleUpdate({
      currentVersion: version,
      versionHistory: nextHistory,
      diagram: result.diagram,
      flow: result.flow,
    });
  };

  const deleteVersion = () => {
    if (!version) return;
    const versionName =
      versionHistory.find((v) => v?.id === version)?.name || "";
    if (
      confirm(
        t(
          "version.confirmDelete",
          { versionName },
          {
            default:
              "Are you sure you want to delete the {{versionName}}?",
          }
        )
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
    <div className="settingsSection" id="studyVersion">
      <div className="settingsSectionHeader">
        <h2>{t("version.title", {}, { default: "Study version" })}</h2>
        <p className="settingsSectionNote">
          {t("version.headerNote", {}, {
            default:
              "Save different study designs displayed on the screen on the left",
          })}
        </p>
      </div>

      {study?.currentVersion ? (
        <>
          <div className="studyVersionInfo">
            <div className="studyVersionInfoMeta">
              <span>
                {t("version.currentVersion", {}, {
                  default: "Current version",
                })}
              </span>
              {currentVersionEntry?.createdAt && (
                <span>
                  {t("version.createdOn", {}, { default: "Created on" })}{" "}
                  {moment(currentVersionEntry.createdAt).format(
                    "MMMM D, YYYY, h:mm"
                  )}
                </span>
              )}
            </div>
            <p className="studyVersionInfoName">
              {currentVersionEntry?.name}
            </p>
            {currentVersionEntry?.description && (
              <p className="studyVersionInfoDescription">
                {currentVersionEntry.description}
              </p>
            )}
          </div>

          <div className="versionSwitch">
            <DropdownSelect
              value={version}
              onChange={setVersion}
              options={versions}
              placeholder={t("version.placeholder", {}, {
                default: "Study versions",
              })}
              ariaLabel={t("version.title", {}, {
                default: "Study version",
              })}
            />
            <div className="versionSwitchActions">
              <Button variant="outline" onClick={switchToVersion}>
                {t("version.load", {}, { default: "Load" })}
              </Button>
              <Button
                variant="outline"
                onClick={deleteVersion}
                className="versionDeleteBtn"
                style={{
                  color: "var(--MH-Theme-Error, #b42318)",
                  borderColor: "var(--MH-Theme-Error, #b42318)",
                }}
              >
                {t("version.delete", {}, { default: "Delete" })}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p className="settingsEmptyNote">
          {t("version.noVersionSaved", {}, {
            default:
              "No study version has been saved yet. Create a new version by clicking on the button below.",
          })}
        </p>
      )}

      <CreateVersionModal
        engine={engine}
        inputs={inputs}
        handleFormChange={handleFormChange}
        createNewVersion={createNewVersion}
      />
    </div>
  );
}

function CreateVersionModal({
  engine,
  inputs,
  handleFormChange,
  createNewVersion,
}) {
  const { t } = useTranslation("builder");
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
      trigger={
        <Button variant="filled">
          {t("version.createNewVersion", {}, {
            default: "Create new version",
          })}
        </Button>
      }
      dimmer="blurring"
      size="small"
      closeIcon
    >
      <Modal.Header>
        <h2>
          {t("version.createNewVersion", {}, {
            default: "Create new version",
          })}
        </h2>
      </Modal.Header>

      <Modal.Content>
        <StyledForm>
          <label htmlFor="name">
            {t("version.name", {}, { default: "Name" })}
            <input
              type="text"
              name="name"
              value={inputs.name}
              onChange={handleFormChange}
            />
          </label>

          <label htmlFor="description">
            {t("version.description", {}, { default: "Description" })}
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
        <div className="versionModalActions">
          <Button variant="text" onClick={() => onClose()}>
            {t("version.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button
            variant="filled"
            onClick={() => {
              createNewVersion();
              setIsOpen(false);
            }}
          >
            {t("version.createNewVersion", {}, {
              default: "Create new version",
            })}
          </Button>
        </div>
      </Modal.Actions>
    </Modal>
  );
}
