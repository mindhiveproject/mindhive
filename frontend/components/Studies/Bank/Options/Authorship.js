import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { Dropdown, Icon, Modal, Button } from "semantic-ui-react";

import FindUser from "../../../Find/User";

import StyledModal from "../../../styles/StyledModal";

import { CHANGE_STUDY_AUTHOR } from "../../../Mutations/Study";
import { MY_STUDIES } from "../../../Queries/Study";

export default function Authorship({ user, study }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authorId, setAuthorId] = useState(study?.author?.id);
  const [confirmation, setConfirmation] = useState("");

  const [changeAuthor, { loading }] = useMutation(CHANGE_STUDY_AUTHOR, {
    variables: { studyId: study?.id },
    refetchQueries: [{ query: MY_STUDIES, variables: { id: user?.id } }],
  });

  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      size="small"
      trigger={
        <Dropdown.Item
          text={
            <>
              <div className="heading">
                <Icon name="signup" />
                <span>Transfer the authorship</span>
              </div>
            </>
          }
        />
      }
    >
      <Modal.Content>
        <Modal.Description>
          <StyledModal>
            <h3>
              Are you sure you want to <strong>transfer the authorship</strong>{" "}
              of this study?
            </h3>
            <p>
              Transfering your authorship will{" "}
              <strong>permanently delete</strong> the connection between your
              account and the study.
              <span className="red">
                <strong> This action cannot be undone.</strong>
              </span>
            </p>
            <div>
              <FindUser authorId={authorId} setAuthorId={setAuthorId} />
            </div>

            <div>
              <h2>Type "CHANGE" to confirm</h2>
              <input
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </div>
          </StyledModal>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button
          style={{ background: "#D53533", color: "#FFFFFF" }}
          content="Change"
          onClick={() => {
            if (confirmation === "CHANGE") {
              changeAuthor({ variables: { authorId } }).catch((err) => {
                alert(err.message);
              });
            } else {
              return alert(
                "Please type CHANGE to change the author of your study"
              );
            }
            setOpen(false);
          }}
        />
        <Button content="Cancel" onClick={() => setOpen(false)} />
      </Modal.Actions>
    </Modal>
  );
}
