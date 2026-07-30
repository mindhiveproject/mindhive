import { useState, useEffect } from "react";
import useForm from "../../../../../lib/useForm";
import { Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";

import VideoUploader from "./VideoUploader";

import { StyledSaveButton } from "../../../../styles/StyledProfile";
import { StyledInput } from "../../../../styles/StyledForm";

export default function IntroductionVideo({ query, user, onDirtyChange }) {
  const { t } = useTranslation("connect");
  const [changed, setChanged] = useState(false);
  const [videoSaving, setVideoSaving] = useState(false);

  const { inputs, handleChange } = useForm(
    {
      passion: user?.passion,
    },
    { freezeInitialSync: changed },
  );

  useEffect(() => {
    onDirtyChange?.(changed);
  }, [changed, onDirtyChange]);

  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: GET_PROFILE }],
  });

  const handleUpdate = (data) => {
    setChanged(true);
    handleChange(data);
  };

  const onFileUpload = async ({ file }) => {
    setVideoSaving(true);
    try {
      // Keystone stores the file in the profile_videos bucket and serves it
      // from the backend; GET_PROFILE is refetched so introVideoFile.url
      // appears on `user` when the mutation resolves.
      await updateProfile({
        variables: {
          id: user?.id,
          input: { introVideoFile: { upload: file } },
        },
      });
    } catch {
      alert(t("videoUploader.error", {}, { default: "Upload failed" }));
    } finally {
      setVideoSaving(false);
    }
  };

  const videoSrc = user?.introVideoFile?.url || null;

  async function saveChanges() {
    try {
      await updateProfile({
        variables: {
          id: user?.id,
          input: { passion: inputs?.passion },
        },
      });
      setChanged(false);
    } catch {
      alert(
        t("createProfileFlow.saveError", {}, {
          default: "Something went wrong while saving. Please try again.",
        }),
      );
    }
  }

  return (
    <div className="profileBlock">
      <div>
        <div className="title">{t("introduction.title")}</div>
        <p>{t("introduction.description")}</p>
      </div>
      <Divider />

      {videoSrc ? (
        <video width="100%" controls>
          <source src={videoSrc} />
          {t("introduction.videoNotSupported")}
        </video>
      ) : (
        <VideoUploader
          publicReadableId={user?.publicReadableId}
          onFileUpload={onFileUpload}
        />
      )}

      {videoSaving && (
        <p>{t("videoUploader.uploadProgress", { progress: 100 }, { default: "Saving video..." })}</p>
      )}

      <StyledInput>
        <div className="inputLineBlock">
          <h3>{t("introduction.passion.title")}</h3>
          <p>{t("introduction.passion.description")}</p>
          <textarea
            id="passion"
            rows="5"
            name="passion"
            placeholder=""
            value={inputs?.passion || ""}
            onChange={handleUpdate}
          />
        </div>
      </StyledInput>

      <StyledSaveButton changed={changed}>
        <button onClick={saveChanges} disabled={!changed}>
          {t("introduction.saveChanges")}
        </button>
      </StyledSaveButton>
    </div>
  );
}
