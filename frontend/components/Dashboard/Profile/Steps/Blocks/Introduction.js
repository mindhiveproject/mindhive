import useForm from "../../../../../lib/useForm";
import { Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";

import { StyledForm } from "../../../../styles/StyledForm";
import VideoUploader from "./VideoUploader";

export default function IntroductionVideo({ query, user }) {
  const { inputs, handleChange } = useForm({
    introVideo: user?.introVideo,
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
  };

  const saveChanges = async () => {
    await updateProfile();
  };

  return (
    <div className="profileBlock">
      <div>
        <div className="title">Introduction Video</div>
        <p>
          We'd love for you to upload an introduction video to share with
          students and fellow MindHive members. This is your chance to tell
          everyone who you are, highlight your research, and share what excites
          you about your work.
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

      <div className="saveButtonBlock">
        <button onClick={saveChanges}>Save changes</button>
      </div>
    </div>
  );
}
