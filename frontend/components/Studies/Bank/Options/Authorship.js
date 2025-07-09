import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { Dropdown, Icon, Modal, Button } from "semantic-ui-react";
import useTranslation from 'next-translate/useTranslation';

import FindUser from "../../../Find/User";

import StyledModal from "../../../styles/StyledModal";

import { CHANGE_STUDY_AUTHOR } from "../../../Mutations/Study";
import { MY_STUDIES } from "../../../Queries/Study";

export default function Authorship({ user, study }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authorId, setAuthorId] = useState(study?.author?.id);
  const [confirmation, setConfirmation] = useState("");

  const [changeAuthor, { loading }] = useMutation(CHANGE_STUDY_AUTHOR, {
    variables: { studyId: study?.id },
    refetchQueries: [{ query: MY_STUDIES, variables: { id: user?.id } }],
  });

  const userClasses = [
    ...user?.teacherIn.map((cl) => cl?.id),
    ...user?.mentorIn.map((cl) => cl?.id),
    ...user?.studentIn.map((cl) => cl?.id),
  ];

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
            <div className="iconTitle">
              <Icon name="signup" />
              <p>{t('study.transferAuthorship', 'Transfer the authorship')}</p>
            </div>
          }
        />
      }
    >
      <Modal.Content>
        <Modal.Description>
          <StyledModal>
            <h3>
              {t('study.authorshipConfirm', 'Are you sure you want to transfer the authorship of this study?')}
            </h3>
            <p>{t('study.authorshipDescription', 'Transferring your authorship will permanently delete the connection between your account and the study. This action cannot be undone.')}</p>
            <div className="selectUser">
              <p>{t('study.selectUser', 'Select the user')}</p>
              <FindUser
                userClasses={userClasses}
                authorId={authorId}
                setAuthorId={setAuthorId}
              />
            </div>
            <div>
              <p>
                <strong>{t('study.typeChangeToConfirm', 'Type "CHANGE" to confirm')}</strong>
              </p>
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
          content={t('study.change', 'Change')}
          onClick={() => {
            if (confirmation === "CHANGE") {
              changeAuthor({ variables: { authorId } }).catch((err) => {
                alert(err.message);
              });
            } else {
              return alert(t('study.typeChangeAlert', 'Please type CHANGE to change the author of your study'));
            }
            setOpen(false);
          }}
        />
        <Button content={t('cancel', 'Cancel')} onClick={() => setOpen(false)} />
      </Modal.Actions>
    </Modal>
  );
}
