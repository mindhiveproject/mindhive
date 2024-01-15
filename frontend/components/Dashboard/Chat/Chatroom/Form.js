import { useState } from "react";

import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalActions,
} from "semantic-ui-react";
import JoditEditor from "../../../Jodit/Editor";

export default function Form({
  btnName,
  message,
  setMessage,
  submit,
  children,
}) {
  const [open, setOpen] = useState(false);
  return (
    <Modal
      closeIcon
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={children}
    >
      <ModalHeader>
        <h2>Add posting</h2>
      </ModalHeader>
      <ModalContent>
        <div className="modalWrapper">
          <JoditEditor content={message} setContent={setMessage} />
        </div>
      </ModalContent>
      <ModalActions>
        <button
          onClick={() => {
            submit();
            setMessage("");
            setOpen(false);
          }}
        >
          {btnName}
        </button>
      </ModalActions>
    </Modal>
  );
}
