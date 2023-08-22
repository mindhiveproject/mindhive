import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import { StyledForm } from "../styles/StyledForm";
import useForm from "../../lib/useForm";
import DisplayError from "../ErrorMessage";
import { REQUEST_RESET_MUTATION } from "../Mutations/User";

export default function RequestReset() {
  const { t } = useTranslation("account");

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
    await requestreset();
    alert("Check your email box");
    resetForm();
  }

  return (
    <StyledForm method="POST" onSubmit={handleSubmit}>
      <h1>{t("reset.requestResetPassword")}</h1>
      <DisplayError error={error} />
      <fieldset>
        {data?.sendUserPasswordResetLink === null && (
          <p>{t("reset.checkYourMail")}</p>
        )}
        <label htmlFor="email">
          {t("common.email")}
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={inputs.email}
            onChange={handleChange}
          />
        </label>

        <button type="submit">{t("reset.requestReset")}</button>
      </fieldset>
    </StyledForm>
  );
}
