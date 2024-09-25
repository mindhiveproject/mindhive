import { useState } from "react";
import Link from "next/link";
import { Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useForm from "../../../../lib/useForm";

import { CURRENT_USER_QUERY } from "../../../Queries/User";
import { UPDATE_USER } from "../../../Mutations/User";
import { StyledInput } from "../../../styles/StyledForm";
import { StyledSimpleSaveButton } from "../../../styles/StyledProfile";

export default function Documents({ query, user }) {
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
      <h1>Consent Documents</h1>
      <h3>
        MindHive would like to use the following data in order to create better
        experiences for our users and to continue contributing to meaningful
        research
      </h3>
      <p>
        You have not uploaded all of the documentation required to participate
        in mentorship. Please review and upload the remaining documents below.
      </p>
      <Divider />

      <div className="content">
        <div className="buttons">
          <Link
            href={{
              pathname: `/dashboard/settings/consent`,
            }}
          >
            <button className="back">Back to Data & Consent</button>
          </Link>
        </div>
      </div>
    </StyledInput>
  );
}
