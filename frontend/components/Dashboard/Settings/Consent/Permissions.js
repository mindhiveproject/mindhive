import { useState } from "react";
import Link from "next/link";
import { Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useForm from "../../../../lib/useForm";

import { CURRENT_USER_QUERY } from "../../../Queries/User";
import { UPDATE_USER } from "../../../Mutations/User";
import { StyledInput } from "../../../styles/StyledForm";
import { StyledSimpleSaveButton } from "../../../styles/StyledProfile";

export default function Permissions({ query, user }) {
  const [changed, setChanged] = useState(false);

  const { inputs, handleChange, clearForm } = useForm({ ...user });
  const [updateProfile, { data, loading, error }] = useMutation(UPDATE_USER, {
    variables: inputs,
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  const handleUpdate = (data) => {
    setChanged(true);
    handleChange(data);
  };

  async function handleSave(e) {
    e.preventDefault();
    await updateProfile();
    setChanged(false);
  }

  return (
    <StyledInput>
      <h1>Data and Consent Settings</h1>
      <h3>
        MindHive would like to use the following data in order to create better
        experiences for our users and to continue contributing to meaningful
        research
      </h3>
      <p>
        If you would like to change your current data preferences or opt out of
        data sharing altogether, you may do so below. Please contact
        mindhive.question@mindhive.com if you have any questions.
      </p>
      <Divider />

      <div className="content">
        <div className="buttons">
          <StyledSimpleSaveButton changed={changed}>
            <button onClick={handleSave}>Update Preferences</button>
          </StyledSimpleSaveButton>

          <Link
            href={{
              pathname: `/dashboard/settings/consent`,
            }}
          >
            <button className="back">Go back</button>
          </Link>
        </div>
      </div>
    </StyledInput>
  );
}
