import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import { StyledForm } from "../styles/StyledForm";
import useForm from "../../lib/useForm";
import DisplayError from "../ErrorMessage";
import { REQUEST_RESET_MUTATION } from "../Mutations/User";
import Button from "../DesignSystem/Button";

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
    // Normalize email to lowercase
    const normalizedInputs = {
      email: inputs.email?.toLowerCase().trim(),
    };
    const res = await requestreset({
      variables: normalizedInputs,
    });
    alert("If this email is associated to a user, we have sent them a password reset email. If this user is a student, we have sent the password reset email to their teacher(s).");
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

        <Button
          type="submit"
          variant="filled"
          disabled={loading}
        >
          {t("auth.requestReset", {}, { default: "Request reset" })}
        </Button>
      </fieldset>
    </StyledForm>
  );
}
