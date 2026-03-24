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
import {
  UPDATE_PROFILE_IMAGE,
  UPDATE_PROFILE_IMAGE_FILE,
} from "../../Mutations/User";

const AvatarEditor = dynamic(() => import("./Avatar"), { ssr: false });

export default function UpdateAvatarModal({ user }) {
  const { t } = useTranslation("connect");
  const [isOpen, setIsOpen] = useState(false);

  const [
    updateImageCreate,
    { data: imageData, loading: imageLoading, error: imageError },
  ] = useMutation(UPDATE_PROFILE_IMAGE, {
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  const [updateImageFile, { loading: imageFileLoading }] = useMutation(
    UPDATE_PROFILE_IMAGE_FILE,
    {
      refetchQueries: [{ query: CURRENT_USER_QUERY }],
    }
  );

  async function updateAvatar(avatar) {
    if (avatar) {
      const blob = dataURItoBlob(avatar);
      const image = new File([blob], "profile.jpg", { type: "image/jpeg" });
      if (user?.image?.id) {
        await updateImageFile({
          variables: {
            profileImageId: user.image.id,
            file: image,
          },
        });
      } else {
        await updateImageCreate({
          variables: {
            id: user?.id,
            file: image,
          },
        });
      }
      setIsOpen(false);
    } else {
      alert(t("avatar.error"));
    }
  }

  return (
    <Modal
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      open={isOpen}
      trigger={<Icon name="edit" size="large" color="teal" />}
      dimmer="blurring"
      size="small"
      closeIcon
    >
      <StyledModal>
        <Modal.Header>
          <div className="centeredHeader">
            <h1>{t("avatar.title")}</h1>
          </div>
        </Modal.Header>

        <Modal.Content scrolling>
          {user ? (
            <div className="content">
              <AvatarEditor
                handleChange={() => {}}
                setPreview={() => {}}
                onClose={(avatar) => updateAvatar(avatar)}
                uploadTitle={t("avatar.upload")}
                shortcut
                isLoading={imageLoading || imageFileLoading}
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
