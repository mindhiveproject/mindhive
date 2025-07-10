import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { Dropdown, Icon, Modal, Button } from "semantic-ui-react";
import useTranslation from 'next-translate/useTranslation';

import StyledModal from "../../../styles/StyledModal";

import { UPDATE_PROJECT_BOARD } from "../../../Mutations/Proposal";
import { GET_MY_PROJECT_BOARDS } from "../../../Queries/Proposal";

export default function Delete({ project, user }) {
  const { t } = useTranslation('builder');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState({});

  const [updateProject, { loading }] = useMutation(UPDATE_PROJECT_BOARD, {
    variables: { id: project?.id },
    refetchQueries: [
      { query: GET_MY_PROJECT_BOARDS, variables: { userId: user?.id } },
    ],
  });

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const deleteProject = async () => {
    if (project?.author?.id === user?.id) {
      await updateProject({
        variables: {
          input: { isHidden: true },
          collaborators: { disconnect: { id: user?.id } },
        },
      });
    } else {
      await updateProject({
        variables: {
          input: { collaborators: { disconnect: { id: user?.id } } },
        },
      });
    }
  };

  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      size="small"
      trigger={
        <Dropdown.Item
          className="dropdownItem"
          text={
            <>
              <div className="iconTitle">
                <Icon name="trash" className="red" />
                <p className="red">{t('project.delete')}</p>
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
              {t('project.deleteConfirm')}
            </h3>
            {/* <p>
              Deleting a study will{" "}
              <strong>permanently delete the study and all its data</strong> for
              you and all study collaborators. If you would like to keep your
              data you can archive the study. Archiving will move the study to
              an "Archived" section within your Develop area and keep the study
              active for all study collaborators.{" "}
              <span className="red">
                <strong>This action cannot be undone.</strong>
              </span>
            </p> */}
            <div>
              <p>
                <strong>{t('project.typeDeleteToConfirm')}</strong>
              </p>
              <input type="text" onChange={handleChange} />
            </div>
          </StyledModal>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button
          style={{ background: "#D53533", color: "#FFFFFF" }}
          content={t('project.delete')}
          onClick={() => {
            if (inputValue === "DELETE") {
              deleteProject().catch((err) => {
                alert(err.message);
              });
              router.push({
                pathname: `/dashboard/develop/projects`,
              });
            } else {
              return alert(t('project.typeDeleteAlert'));
            }
            setOpen(false);
          }}
        />
        <Button content={t('project.cancel')} onClick={() => setOpen(false)} />
      </Modal.Actions>
    </Modal>
  );
}
