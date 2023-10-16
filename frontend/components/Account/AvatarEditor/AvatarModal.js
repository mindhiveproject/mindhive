import { Modal } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import dynamic from "next/dynamic";
import { Icon } from "semantic-ui-react";

import StyledModal from "../../styles/StyledModal";

import { dataURItoBlob } from "../../../lib/useForm";

import NoAccount from "../NoAccount";

import { CURRENT_USER_QUERY } from "../../Queries/User";
import { UPDATE_PROFILE_IMAGE } from "../../Mutations/User";

const AvatarEditor = dynamic(() => import("./Avatar"), { ssr: false });

export default function UpdateAvatarModal({ user }) {
  const { t } = useTranslation("account");
  const [isOpen, setIsOpen] = useState(false);

  const [
    updateImage,
    { data: imageData, loading: imageLoading, error: imageError },
  ] = useMutation(UPDATE_PROFILE_IMAGE, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  async function updateAvatar(avatar) {
    if (avatar) {
      const image = dataURItoBlob(avatar);
      await updateImage({
        variables: {
          id: user?.id,
          image,
        },
      });
      setIsOpen(false);
    } else {
      alert("Please upload the picture");
    }
  }

  return (
    <Modal
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      open={isOpen}
      trigger={
        <Icon name="edit" size="large" color="teal" />
      }
      dimmer="blurring"
      size="small"
      closeIcon
    >
      <StyledModal>
        <Modal.Header>
          <h1>{t("common.uploadAvatarPicture")}</h1>
        </Modal.Header>

        <Modal.Content scrolling>
          {user ? (
            <div className="content">
              <AvatarEditor
                handleChange={() => {}}
                setPreview={() => {}}
                onClose={(avatar) => updateAvatar(avatar)}
                uploadTitle={t("common.update")}
                shortcut
              />
            </div>
          ) : (
            <NoAccount />
          )}
        </Modal.Content>
      </StyledModal>
    </Modal>
  );
}
