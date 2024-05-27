import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import { StyledForm } from "../styles/StyledForm";
import useForm from "../../lib/useForm";
import DisplayError from "../ErrorMessage";
import { REQUEST_RESET_MUTATION } from "../Mutations/User";

export default function RequestReset() {
  const { t } = useTranslation("common");

  const { inputs, handleChange, resetForm } = useForm({
    email: "",
  });
  const [requestreset, { data, loading, error }] = useMutation(
    REQUEST_RESET_MUTATION,
    {
      variables: inputs,
    }
  );
  async function handleSubmit(e) {
    e.preventDefault();
    const res = await requestreset();
    alert("If this user exists, we have sent you a password reset email");
    resetForm();
  }

  return (
    <StyledForm method="POST" onSubmit={handleSubmit}>
      <h1>{t("auth.requestReset")}</h1>
      <DisplayError error={error} />
      <fieldset>
        {data?.sendUserPasswordResetLink === null && (
          <p>{t("auth.checkYourMail")}</p>
        )}
        <label htmlFor="email">
          {t("auth.email")}
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={inputs.email}
            onChange={handleChange}
          />
        </label>

        <button type="submit">{t("auth.requestReset")}</button>
      </fieldset>
    </StyledForm>
  );
}
