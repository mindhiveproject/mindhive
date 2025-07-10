import { useState } from "react";
import Link from "next/link";
import { Divider } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useForm from "../../../lib/useForm";
import useTranslation from "next-translate/useTranslation";

import { CURRENT_USER_QUERY } from "../../Queries/User";
import { UPDATE_USER } from "../../Mutations/User";
import { StyledInput } from "../../styles/StyledForm";
import { StyledSimpleSaveButton } from "../../styles/StyledProfile";

export default function Username({ query, user }) {
  const { t } = useTranslation("common");
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
      <h1>{t("username.title")}</h1>
      <h3>{t("username.description")}</h3>
      <Divider />

      <div className="content">
        <div className="p24-thin">{t("username.currentUsername")}</div>
        <div>
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={user?.username}
            disabled
          />
        </div>

        <div className="p24-thin">{t("username.newUsername")}</div>
        <div>
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={inputs?.username}
            onChange={handleUpdate}
            required
          />
        </div>

        <div className="buttons">
          <StyledSimpleSaveButton changed={changed}>
            <button onClick={handleSave}>{t("username.updatePreferences")}</button>
          </StyledSimpleSaveButton>

          <Link
            href={{
              pathname: `/dashboard/settings`,
            }}
          >
            <button className="back">{t("consent.backToSettings")}</button>
          </Link>
        </div>
      </div>
    </StyledInput>
  );
}
