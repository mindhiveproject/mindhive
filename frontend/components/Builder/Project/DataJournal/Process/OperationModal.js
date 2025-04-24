import { useState } from "react";

import { Modal, DropdownItem } from "semantic-ui-react";

import useForm from "../../../../../lib/useForm";

import Copy from "./Operations/Copy";
import Compute from "./Operations/Compute";
import Reverse from "./Operations/Reverse";
import Recode from "./Operations/Recode";

export default function OperationModal({
  type,
  data,
  variables,
  updateDataset,
  title,
  iconSrc,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { inputs, handleChange, resetForm } = useForm({ name: "" });

  const variablesOptions = variables
    .filter((variable) => !variable?.hide)
    .map((variable) => ({
      key: variable?.field,
      value: variable?.field,
      text: variable?.field,
    }));

  return (
    <Modal
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      open={isOpen}
      trigger={
        <DropdownItem>
          <div className="menuItem">
            <img src={iconSrc} />
            <div>{title}</div>
          </div>
        </DropdownItem>
      }
      dimmer="blurring"
      size="small"
      closeIcon
    >
      {type === "copy" && (
        <Copy
          title={title}
          data={data}
          variables={variables}
          variablesOptions={variablesOptions}
          inputs={inputs}
          handleChange={handleChange}
          updateDataset={updateDataset}
          setIsOpen={setIsOpen}
          resetForm={resetForm}
        />
      )}

      {type === "compute" && (
        <Compute
          title={title}
          data={data}
          variables={variables}
          variablesOptions={variablesOptions}
          inputs={inputs}
          handleChange={handleChange}
          updateDataset={updateDataset}
          setIsOpen={setIsOpen}
          resetForm={resetForm}
        />
      )}
      
      {type === "reverse" && (
        <Reverse
          title={title}
          data={data}
          variables={variables}
          variablesOptions={variablesOptions}
          inputs={inputs}
          handleChange={handleChange}
          updateDataset={updateDataset}
          setIsOpen={setIsOpen}
          resetForm={resetForm}
        />
      )}

      {type === "recode" && (
        <Recode
          title={title}
          data={data}
          variables={variables}
          variablesOptions={variablesOptions}
          inputs={inputs}
          handleChange={handleChange}
          updateDataset={updateDataset}
          setIsOpen={setIsOpen}
          resetForm={resetForm}
        />
      )}
    </Modal>
  );
}
