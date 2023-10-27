import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../lib/useForm";
import DisplayError from "../../ErrorMessage";

import { StyledForm } from "../../styles/StyledForm";

import { CURRENT_USER_QUERY } from "../../Queries/User";
import { UPDATE_USER } from "../../Mutations/User";
import UpdateAvatarModal from "../../Account/AvatarEditor/AvatarModal";
import IdentIcon from "../../Account/IdentIcon";

export default function EditSettings({ query, user }) {
  const { t } = useTranslation("account");

  const { inputs, handleChange, clearForm } = useForm({ ...user });

  const [updateProfile, { data, loading, error }] = useMutation(UPDATE_USER, {
    variables: inputs,
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  async function handleSubmit(e) {
    e.preventDefault();
    await updateProfile();
  }

  return (
    <>
      <h1>Settings</h1>

      <StyledForm method="POST" onSubmit={handleSubmit}>
        <DisplayError error={error} />

        <label>Avatar</label>
        <div>
          {user?.avatar ? (
            <img src={user?.avatar} alt={user?.name} />
          ) : (
            <div>
              <IdentIcon size="120" value={user?.name} />
            </div>
          )}
          <UpdateAvatarModal user={user} />
        </div>

        <fieldset disabled={loading} aria-busy={loading}>
          <div className="infoPane">
            <label htmlFor="username">
              {t("common.username")}
              <input
                type="username"
                name="username"
                autoComplete="username"
                value={inputs?.username}
                onChange={handleChange}
                required
              />
            </label>

            <label htmlFor="email">
              {t("common.email")}
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={inputs?.email}
                onChange={handleChange}
                required
              />
            </label>

            <div className="submitButton">
              <button type="submit">{t("common.update")}</button>
            </div>
          </div>
        </fieldset>
      </StyledForm>
    </>
  );
}
