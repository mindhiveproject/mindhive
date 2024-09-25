import { useState } from "react";
import Link from "next/link";
import { Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useForm from "../../../lib/useForm";

import { CURRENT_USER_QUERY } from "../../Queries/User";
import { UPDATE_USER } from "../../Mutations/User";
import { StyledInput } from "../../styles/StyledForm";
import { StyledSimpleSaveButton } from "../../styles/StyledProfile";

export default function Email({ query, user }) {
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
      <h1>Email Settings</h1>
      <h3>
        Update your MindHive email settings below to continue receiving
        important email updates
      </h3>
      <Divider />

      <div className="content">
        <div className="p24-thin">Current Email</div>
        <div>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={user?.email}
            disabled
          />
        </div>

        <div className="p24-thin">New Email</div>
        <div>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={inputs?.email}
            onChange={handleUpdate}
            required
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
