import { useRouter } from "next/dist/client/router";
import DisplayError from "../ErrorMessage";
import { StyledForm } from "../styles/StyledForm";
import { useMutation } from "@apollo/client";
import { RESET_MUTATION } from "../Mutations/User";
import useForm from "../../lib/useForm";
import useTranslation from "next-translate/useTranslation";
import Button from "../DesignSystem/Button";

export default function Reset({ query }) {
  const { t } = useTranslation("common");
  const token = query?.t;

  const router = useRouter();

  const { inputs, handleChange, resetForm } = useForm({
    email: "",
    password: "",
    token: token,
    confirmPassword: "",
  });

  const [reset, { data, loading, error }] = useMutation(RESET_MUTATION, {
    variables: inputs,
  });

  const successfulError = data?.redeemProfilePasswordResetToken?.code
    ? data.redeemProfilePasswordResetToken
    : undefined;

  async function handleSubmit(e) {
    e.preventDefault();
    if (inputs?.email == "") {
      return alert("Enter your email address");
    }
    if (inputs?.password !== inputs?.confirmPassword) {
      return alert("The passwords do not match");
    }
    if (inputs?.password?.length < 9) {
      return alert("The password is too short");
    }
    // Normalize email to lowercase
    const normalizedInputs = {
      ...inputs,
      email: inputs.email?.toLowerCase().trim(),
    };
    const res = await reset({
      variables: normalizedInputs,
    });
    if (!res?.data?.redeemProfilePasswordResetToken) {
      alert("The password was changed");
      resetForm();
      router.push({
        pathname: "/login",
      });
    }
  }

  return (
    <StyledForm method="POST" onSubmit={handleSubmit}>
      <h1>{t("auth.resetTitle", {}, { default: "Reset password" })}</h1>
      <DisplayError error={error || successfulError} />
      <fieldset>
        <label htmlFor="email">
          {t("auth.email", {}, { default: "Email" })}
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            autoComplete="email"
            value={inputs?.email}
            onChange={handleChange}
          />
        </label>
        <label htmlFor="password">
          {t("auth.password", {}, { default: "Password" })}
          <input
            type="password"
            name="password"
            placeholder="Enter your new password"
            autoComplete="new-password"
            value={inputs?.password}
            onChange={handleChange}
          />
        </label>
        <label htmlFor="confirmPassword">
          {t("auth.confirmPassword", {}, { default: "Confirm Password" })}
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm your new password"
            autoComplete="new-password"
            value={inputs?.confirmPassword}
            onChange={handleChange}
          />
        </label>

        <Button
          type="submit"
          variant="filled"
          disabled={loading}
        >
          {t("auth.reset", {}, { default: "Reset" })}
        </Button>
      </fieldset>
    </StyledForm>
  );
}
