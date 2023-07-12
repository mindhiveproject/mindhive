import { useState } from "react";

import { Modal } from "semantic-ui-react";
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
      <div className="modalWrapper">
        <JoditEditor content={message} setContent={setMessage} />
        <button
          onClick={() => {
            submit();
            setMessage("");
            setOpen(false);
          }}
        >
          {btnName}
        </button>
      </div>
    </Modal>
  );
}
