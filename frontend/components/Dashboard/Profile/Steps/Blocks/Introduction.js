import { useState } from "react";
import useForm from "../../../../../lib/useForm";
import { Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";

import VideoUploader from "./VideoUploader";

import { StyledSaveButton } from "../../../../styles/StyledProfile";
import { StyledInput } from "../../../../styles/StyledForm";

export default function IntroductionVideo({ query, user }) {
  const { t } = useTranslation("connect");
  const [changed, setChanged] = useState(false);

  const { inputs, handleChange } = useForm({
    introVideo: user?.introVideo,
    passion: user?.passion,
  });

  const [updateProfile, { data, loading, error }] = useMutation(
    UPDATE_PROFILE,
    {
      variables: {
        id: user?.id,
        input: { ...inputs },
      },
      refetchQueries: [{ query: GET_PROFILE }],
    }
  );

  const handleUpdate = (data) => {
    setChanged(true);
    handleChange(data);
  };

  const onFileUpload = ({ filename, timestamp }) => {
    handleChange({
      target: {
        name: "introVideo",
        value: {
          filename,
          timestamp,
        },
      },
    });
    setChanged(true);
  };

  const saveChanges = async () => {
    await updateProfile();
    setChanged(false);
  };

  return (
    <div className="profileBlock">
      <div>
        <div className="title">{t("introduction.title")}</div>
        <p>{t("introduction.description")}</p>
      </div>
      <Divider />

      {inputs?.introVideo?.filename ? (
        <video width="100%" controls>
          <source
            src={`/videos/${inputs?.introVideo?.filename}`}
            type="video/mp4"
          />
          {t("introduction.videoNotSupported")}
        </video>
      ) : (
        <VideoUploader
          publicReadableId={user?.publicReadableId}
          onFileUpload={onFileUpload}
        />
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
