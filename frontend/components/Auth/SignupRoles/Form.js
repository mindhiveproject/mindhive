import { StyledForm } from "../../styles/StyledForm";
import DisplayError from "../../ErrorMessage";
import useTranslation from "next-translate/useTranslation";
import TermsConditions from "./TermsConditions";
import GoogleSignup from "./GoogleSignup";

export default function Form({
  role,
  profile,
  handleChange,
  handleSubmit,
  submitBtnName,
  loading,
  error,
  classCode,
}) {
  const { t } = useTranslation("account");

  console.log({ role });

  return (
    <StyledForm method="POST" onSubmit={(e) => handleSubmit({ e, classCode })}>
      <DisplayError error={error} />

      <fieldset disabled={loading} aria-busy={loading}>
        <div className="infoPane">
          <label htmlFor="username">
            {t("common.username")}
            <input
              type="text"
              name="username"
              value={profile?.username}
              onChange={handleChange}
              required
            />
          </label>

          <label htmlFor="email">
            {t("common.email")}
            <input
              type="email"
              name="email"
              value={profile?.email}
              onChange={handleChange}
              required
            />
          </label>

          <label htmlFor="password">
            {t("common.password")}
            <input
              type="password"
              name="password"
              value={profile?.password}
              onChange={handleChange}
              required
            />
          </label>

          {role === "student" && (
            <>
              <label htmlFor="zipcode">
                <p>Zip code</p>
                <input
                  type="text"
                  name="zipcode"
                  placeholder="Enter your zip code"
                  value={profile?.zipcode}
                  onChange={({ target }) =>
                    handleChange({
                      target: {
                        name: "info",
                        value: { ...profile?.info, zipcode: target?.value },
                      },
                    })
                  }
                  required
                />
              </label>

              <label htmlFor="age">
                <p>Age</p>
                <input
                  type="text"
                  name="age"
                  placeholder="Enter your age"
                  value={profile?.age}
                  onChange={({ target }) =>
                    handleChange({
                      target: {
                        name: "info",
                        value: { ...profile?.info, age: target?.value },
                      },
                    })
                  }
                  required
                />
              </label>
            </>
          )}

          <div className="submitButton">
            <button type="submit">{submitBtnName}</button>
          </div>
        </div>
      </fieldset>

      {["scientist", "teacher"].includes(role) && (
        <GoogleSignup role={role} classCode={classCode} />
      )}

      <TermsConditions btnName={`"Create account"`} />
    </StyledForm>
  );
}
