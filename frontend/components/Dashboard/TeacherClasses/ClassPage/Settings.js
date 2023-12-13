import { useState } from "react";
import { useMutation } from "@apollo/client";

import { DELETE_CLASS } from "../../../Mutations/Classes";
import { GET_CLASSES } from "../../../Queries/Classes";

import { Modal, Button } from "semantic-ui-react";

import StyledModal from "../../../styles/StyledModal";

import { useRouter } from "next/router";

export default function Settings({ myclass, user }) {
  const [inputValue, setInputValue] = useState({});
  const [open, setOpen] = useState(false);
  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const router = useRouter();
  const [deleteClass, { loading }] = useMutation(DELETE_CLASS, {
    variables: { id: myclass?.id },
    refetchQueries: [
      {
        query: GET_CLASSES,
        variables: {
          input: {
            OR: [
              {
                creator: {
                  id: { equals: user?.id },
                },
              },
              {
                mentors: {
                  some: { id: { equals: user?.id } },
                },
              },
            ],
          },
        },
      },
    ],
  });

  return (
    <div className="settings">
      <h2>Delete your class</h2>
      <p>
        Deleting your class will permanently delete your class within the “My
        Classes” area. This action cannot be undone.
      </p>

      <div className="informationBlock">
        <div className="block">
          <p>You will not have access to:</p>
          <ul>
            <li>Your class</li>
            <li>
              Any studies or results generated from students in your class
            </li>
          </ul>
        </div>

        <div className="block">
          <p>Your students will have access to:</p>
          <ul>
            <li>
              Their workspace and any studies, tasks or surveys they created
              during your class
            </li>
            <li>Note: New students will not be able to join your class</li>
          </ul>
        </div>
      </div>

      <div>
        <Modal
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
          open={open}
          size="small"
          trigger={<button disabled={loading}>Delete class</button>}
        >
          <Modal.Content>
            <Modal.Description>
              <StyledModal>
                <h3>
                  Are you sure you want to <strong>delete</strong> this class?
                </h3>
                <p>
                  Deleting your class will{" "}
                  <strong>permanently delete your class</strong> within the “My
                  Classes” area.{" "}
                  <span className="red">
                    <strong>This action cannot be undone.</strong>
                  </span>
                </p>
                <div>
                  <p>
                    <strong>Type "DELETE" to confirm</strong>
                  </p>
                  <input type="text" onChange={handleChange} />
                </div>
              </StyledModal>
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <Button
              style={{ background: "#D53533", color: "#FFFFFF" }}
              content="Delete"
              onClick={() => {
                if (inputValue === "DELETE") {
                  deleteClass().catch((err) => alert(err.message));
                  router.push({
                    pathname: "/dashboard/myclasses",
                  });
                } else {
                  return alert("Please type DELETE to delete your class");
                }
                setOpen(false);
              }}
            />
            <Button content="Cancel" onClick={() => setOpen(false)} />
          </Modal.Actions>
        </Modal>
      </div>
    </div>
  );
}
