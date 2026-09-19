import { useState } from "react";
import { useMutation } from "@apollo/client";
import { Dropdown, Icon, Modal, Button } from "semantic-ui-react";
import useTranslation from 'next-translate/useTranslation';

import { ARCHIVE_STUDY } from "../../../Mutations/Study";
import { GET_USER_STUDIES } from "../../../Queries/User";
import { MY_STUDY } from "../../../Queries/Study";

import StyledModal from "../../../styles/StyledModal";

export default function Archive({ user, study, studiesInfo, trigger }) {
  const { t } = useTranslation('common');
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
        trigger ?? (
          <Dropdown.Item
            className="dropdownItem"
            text={
              <>
                <div className="iconTitle">
                  <Icon name="archive" />
                  <p>{isArchived ? t('study.unarchive', 'Unarchive study') : t('study.archive', 'Archive Study')}</p>
                </div>
              </>
            }
          />
        )
      }
    >
      <Modal.Content>
        <Modal.Description>
          <StyledModal>
            <h3>
              {isArchived ? t('study.unarchiveConfirm', 'Are you sure you want to unarchive this study?') : t('study.archiveConfirm', 'Are you sure you want to archive this study?')}
            </h3>
            {isArchived ? (
              <p>{t('study.unarchiveDescription', 'The study will be returned to the "Active" section within your Develop area. It will not impact how others see the study. You can rearchive a study at any time.')}</p>
            ) : (
              <p>{t('study.archiveDescription', 'Archiving a study allows you to focus on active studies. The study will be moved to an "Archived" section within your Develop area. It will not impact how others see the study. You can unarchive a study at any time.')}</p>
            )}
          </StyledModal>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button
          style={{ background: "#007C70", color: "#FFFFFF" }}
          content={isArchived ? t('study.unarchive', 'Unarchive') : t('study.archive', 'Archive')}
          onClick={() => {
            archiveStudy().catch((err) => {
              alert(err.message);
            });
            setOpen(false);
          }}
        />
        <Button content={t('cancel', 'Cancel')} onClick={() => setOpen(false)} />
      </Modal.Actions>
    </Modal>
  );
}
