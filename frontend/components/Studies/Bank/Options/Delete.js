import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { Dropdown, Icon, Modal, Button } from "semantic-ui-react";
import useTranslation from 'next-translate/useTranslation';

import StyledModal, { StyledModalButtons } from "../../../styles/StyledModal";

import { HIDE_STUDY } from "../../../Mutations/Study";
import { MY_STUDIES } from "../../../Queries/Study";

export default function Delete({ study, user }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const [hideStudy, { loading }] = useMutation(HIDE_STUDY, {
    variables: { id: study?.id },
    refetchQueries: [{ query: MY_STUDIES, variables: { id: user?.id } }],
  });

  const handleChange = (e) => {
    setInputValue(e.target.value);
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
                <p className="red">{t('study.delete', 'Delete Study')}</p>
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
              {t('study.deleteConfirm', 'Are you sure you want to delete this study?')}
            </h3>
            <p>{t('study.deleteDescription', 'Deleting a study will permanently delete the study and all its data for you and all study collaborators. If you would like to keep your data you can archive the study. Archiving will move the study to an "Archived" section within your Develop area and keep the study active for all study collaborators. This action cannot be undone.')}</p>
            <div>
              <p>
                <strong>{t('study.typeDeleteToConfirm', 'Type "DELETE" to confirm')}</strong>
              </p>
              <input type="text" onChange={handleChange} />
            </div>
          </StyledModal>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button
          style={{ background: "#D53533", color: "#FFFFFF" }}
          content={t('study.delete', 'Delete')}
          onClick={() => {
            if (inputValue === "DELETE") {
              hideStudy().catch((err) => {
                alert(err.message);
              });
              router.push({
                pathname: `/dashboard/develop/studies`,
              });
            } else {
              return alert(t('study.typeDeleteAlert', 'Please type DELETE to delete your study'));
            }
            setOpen(false);
          }}
        />
        <Button content={t('cancel', 'Cancel')} onClick={() => setOpen(false)} />
      </Modal.Actions>
    </Modal>
  );
}
