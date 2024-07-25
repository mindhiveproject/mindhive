import useForm from "../../../../../lib/useForm";
import UpdateAvatarModal from "../../../../Account/AvatarEditor/AvatarModal";
import { Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";

import { StyledForm } from "../../../../styles/StyledForm";

export default function IntroductionVideo({ query, user }) {
  const { inputs, handleChange } = useForm({
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    pronouns: user?.pronouns,
    location: user?.location,
    profileType: query?.type,
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

  async function handleSubmit(e) {
    e.preventDefault();
    await updateProfile();
  }

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
    </div>
  );
}
