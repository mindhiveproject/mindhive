import { useState } from "react";

import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalActions,
} from "semantic-ui-react";
import JoditEditor from "../../../Jodit/Editor";
import Button from "../../../DesignSystem/Button";
import useTranslation from "next-translate/useTranslation";

export default function Form({
  btnName,
  message,
  setMessage,
  submit,
  children,
}) {
  const { t } = useTranslation("dashboard");
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
        <h2>{t("chat.addPosting", {}, { default: "Add posting" })}</h2>
      </ModalHeader>
      <ModalContent>
        <div className="modalWrapper">
          <JoditEditor content={message} setContent={setMessage} />
        </div>
      </ModalContent>
      <ModalActions>
        <Button
          variant="filled"
          onClick={() => {
            submit();
            setMessage("");
            setOpen(false);
          }}
        >
          {btnName}
        </Button>
      </ModalActions>
    </Modal>
  );
}
