import { useState } from "react";
import { useMutation } from "@apollo/client";
import { Dropdown, Icon, Modal, Button } from "semantic-ui-react";

import { ARCHIVE_STUDY } from "../../../Mutations/Study";
import { GET_USER_STUDIES } from "../../../Queries/User";
import { MY_STUDY } from "../../../Queries/Study";

import StyledModal from "../../../styles/StyledModal";

export default function Archive({ user, study, studiesInfo }) {
  const [open, setOpen] = useState(false);
  const isArchived = studiesInfo && studiesInfo[study?.id]?.hideInDevelop;

  const [archiveStudy, { loading }] = useMutation(ARCHIVE_STUDY, {
    variables: {
      study: study?.id,
      isArchived: !isArchived,
    },
    refetchQueries: [
      { query: GET_USER_STUDIES },
      { query: MY_STUDY, variables: { id: study?.id } },
    ],
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
              <div className="iconTitle">
                <Icon name="archive" />
                <p>{isArchived ? "Unarchive study" : "Archive Study"}</p>
              </div>
              {isArchived ? (
                <p style={{ padding: "5px" }}>
                  Unarchiving a study will return it
                  <br /> to the "Active" section in your
                  <br /> develop area. It will not impact <br />
                  how others see the study
                </p>
              ) : (
                <p style={{ padding: "5px" }}>
                  Archiving a study moves it to the <br />
                  "Archived" section in your <br />
                  Develop area. It will not impact <br />
                  how others see the study.
                </p>
              )}
            </>
          }
        />
      }
    >
      <Modal.Content>
        <Modal.Description>
          <StyledModal>
            <h3>
              Are you sure you want to{" "}
              <strong>{isArchived ? "unarchive" : "archive"}</strong> this
              study?
            </h3>
            {isArchived ? (
              <p>
                The study will be returned to the "Active" section within your
                Develop area. It will not impact how others see the study. You
                can rearchive a study at any time.
              </p>
            ) : (
              <p>
                Archiving a study allows you to focus on active studies. The
                study will be moved to an "Archived" section within your Develop
                area. It will not impact how others see the study. You can
                unarchive a study at any time.
              </p>
            )}
          </StyledModal>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button content="Cancel" onClick={() => setOpen(false)} />
        <Button
          style={{ background: "#007C70", color: "#FFFFFF" }}
          content={isArchived ? "Unarchive" : "Archive"}
          onClick={() => {
            archiveStudy().catch((err) => {
              alert(err.message);
            });
            setOpen(false);
          }}
        />
      </Modal.Actions>
    </Modal>
  );
}
