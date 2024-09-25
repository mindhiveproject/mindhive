import { useState } from "react";
import Link from "next/link";
import { Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useForm from "../../../lib/useForm";

import { CURRENT_USER_QUERY } from "../../Queries/User";
import { UPDATE_USER } from "../../Mutations/User";
import { StyledInput } from "../../styles/StyledForm";
import { StyledSimpleSaveButton } from "../../styles/StyledProfile";
import LanguageSelector from "../../User/LanguageSelector";

export default function Languages({ query, user }) {
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
      <h1>Language Settings</h1>
      <h3>You can customize and change your language settings below.</h3>
      <Divider />

      <div className="content">
        <div className="p24-thin">Display Language </div>
        <div>
          <LanguageSelector
            handleChange={handleUpdate}
            value={inputs?.language}
          />
        </div>

        <div className="buttons">
          <StyledSimpleSaveButton changed={changed}>
            <button onClick={handleSave}>Update Preferences</button>
          </StyledSimpleSaveButton>

          <Link
            href={{
              pathname: `/dashboard/settings`,
            }}
          >
            <button className="back">Back to Settings</button>
          </Link>
        </div>
      </div>
    </StyledInput>
  );
}
