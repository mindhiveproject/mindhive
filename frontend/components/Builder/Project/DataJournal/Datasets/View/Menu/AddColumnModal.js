import { useCallback, useEffect, useRef, useState } from "react";

import { Modal } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../../../../../lib/useForm";
import { StyledAddColumnModal } from "../../../styles/StyledAddColumnModal";

import Copy from "./Operations/Copy";
import Compute from "./Operations/Compute";
import Reverse from "./Operations/Reverse";
import Recode from "./Operations/Recode";

const OPERATIONS = [
  {
    type: "copy",
    iconSrc: "/assets/icons/visualize/content_paste_go.svg",
    labelKey: "dataJournal.datasetMenu.operations.copyExisting",
    defaultLabel: "Copy existing variable",
  },
  {
    type: "compute",
    iconSrc: "/assets/icons/visualize/table_chart_view.svg",
    labelKey: "dataJournal.datasetMenu.operations.computeNew",
    defaultLabel: "Compute new variable",
  },
  {
    type: "reverse",
    iconSrc: "/assets/icons/visualize/database_reverse.svg",
    labelKey: "dataJournal.datasetMenu.operations.reverseScore",
    defaultLabel: "Reverse score",
  },
  {
    type: "recode",
    iconSrc: "/assets/icons/visualize/database_recode.svg",
    labelKey: "dataJournal.datasetMenu.operations.recodeVariable",
    defaultLabel: "Recode a variable",
  },
];

export default function AddColumnModal({
  open,
  onClose,
  data,
  variables,
  updateDataset,
}) {
  const { t } = useTranslation("builder");
  const [selectedType, setSelectedType] = useState("copy");
  const submitRef = useRef(null);
  const { inputs, handleChange, resetForm } = useForm({ name: "" });

  const resetFormRef = useRef(resetForm);
  resetFormRef.current = resetForm;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleSuccess = useCallback(() => {
    resetFormRef.current();
    submitRef.current = null;
    onCloseRef.current();
  }, []);

  const handleClose = useCallback(() => {
    resetFormRef.current();
    submitRef.current = null;
    setSelectedType("copy");
    onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!open) {
      resetFormRef.current();
      setSelectedType("copy");
      submitRef.current = null;
    }
  }, [open]);

  const variablesOptions = variables
    .filter((variable) => !variable?.hide)
    .map((variable) => ({
      key: variable?.field,
      value: variable?.field,
      text: variable?.field,
    }));

  const handleSubmit = () => {
    submitRef.current?.();
  };

  const selectedOp = OPERATIONS.find((o) => o.type === selectedType);

  const paneTitle = selectedOp
    ? t(selectedOp.labelKey, {}, { default: selectedOp.defaultLabel })
    : "";

  const opPaneProps = {
    data,
    variables,
    variablesOptions,
    inputs,
    handleChange,
    updateDataset,
    submitRef,
    onSuccess: handleSuccess,
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      dimmer
      size="large"
      closeIcon
    >
      <Modal.Header>
        {t("dataJournal.datasetMenu.addColumnModal.title", {}, {
          default: "Add a column",
        })}
      </Modal.Header>
      <Modal.Content scrolling>
        <StyledAddColumnModal>
          <div className="addColumnModalBody">
            <div className="addColumnModalRail">
              {OPERATIONS.map((op) => (
                <button
                  key={op.type}
                  type="button"
                  className={
                    selectedType === op.type
                      ? "addColumnModalRailItem addColumnModalRailItem--active"
                      : "addColumnModalRailItem"
                  }
                  onClick={() => setSelectedType(op.type)}
                >
                  <img src={op.iconSrc} alt="" aria-hidden="true" />
                  <span>
                    {t(op.labelKey, {}, { default: op.defaultLabel })}
                  </span>
                </button>
              ))}
            </div>
            <div className="addColumnModalPane">
              <h3 className="addColumnModalPaneHeading">{paneTitle}</h3>
              <div className="addColumnModalPaneScroll">
                {selectedType === "copy" && <Copy {...opPaneProps} />}
                {selectedType === "compute" && <Compute {...opPaneProps} />}
                {selectedType === "reverse" && <Reverse {...opPaneProps} />}
                {selectedType === "recode" && <Recode {...opPaneProps} />}
              </div>
            </div>
          </div>
        </StyledAddColumnModal>
      </Modal.Content>
      <Modal.Actions>
        <StyledAddColumnModal>
          <div className="addColumnModalFooter">
            <button
              type="button"
              className="addColumnModalCancelBtn"
              onClick={handleClose}
            >
              {t("dataJournal.datasetMenu.addColumnModal.cancel", {}, {
                default: "Cancel",
              })}
            </button>
            <button
              type="button"
              className="secondaryBtn"
              onClick={handleSubmit}
            >
              {t("dataJournal.datasetMenu.addColumnModal.submit", {}, {
                default: "Add column",
              })}
            </button>
          </div>
        </StyledAddColumnModal>
      </Modal.Actions>
    </Modal>
  );
}
