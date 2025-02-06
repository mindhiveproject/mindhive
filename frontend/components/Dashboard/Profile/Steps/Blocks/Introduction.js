import { useState } from "react";
import useForm from "../../../../../lib/useForm";
import { Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";

import VideoUploader from "./VideoUploader";

import { StyledSaveButton } from "../../../../styles/StyledProfile";
import { StyledInput } from "../../../../styles/StyledForm";

export default function IntroductionVideo({ query, user }) {
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
        <div className="title">Introduction Video</div>
        <p>
          We'd love for you to upload an introduction video to share with
          students and fellow MindHive members. You can use it to share a
          project you think students might get excited about.
        </p>
      </div>
      <Divider />

      {inputs?.introVideo?.filename ? (
        <video width="100%" controls>
          <source
            src={`/videos/${inputs?.introVideo?.filename}`}
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      ) : (
        <VideoUploader
          publicReadableId={user?.publicReadableId}
          onFileUpload={onFileUpload}
        />
      )}

      <StyledInput>
        <div className="inputLineBlock">
          <h3>What are you passionate about right now?</h3>
          <p>
            For example, you can briefly describe a science project you are
            working on. Or you can tell us about your experience bringing
            science to the public. This is your space to showcase what you’re
            currently working on and how it shapes the expertise you bring to
            our community.
          </p>
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
          Save changes
        </button>
      </StyledSaveButton>
    </div>
  );
}
