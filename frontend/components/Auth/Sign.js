import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import { StyledForm, SignupButton, SignupForm } from "../styles/StyledForm";

export default function Sign() {
  const { t } = useTranslation("common");

  return (
    <SignupForm>
      <h1>{t("signup.title")}</h1>

      <div className="signupOptions">
        <Link href="/signup/participant">
          <SignupButton>
            <div>
              <img
                src="/assets/signup/participant.png"
                alt="icon"
                height="20"
              />
            </div>
            <div>{t("signup.participant")}</div>
          </SignupButton>
        </Link>

        <Link href="/signup/student">
          <SignupButton>
            <div>
              <img src="/assets/signup/student.png" alt="icon" height="20" />
            </div>
            <div>{t("signup.student")}</div>
          </SignupButton>
        </Link>

        <Link href="/signup/scientist">
          <SignupButton>
            <div>
              <img src="/assets/signup/scientist.png" alt="icon" height="20" />
            </div>
            <div>{t("signup.scientist")}</div>
          </SignupButton>
        </Link>

        <Link href="/signup/teacher">
          <SignupButton>
            <div>
              <img src="/assets/signup/teacher.png" alt="icon" height="20" />
            </div>
            <div>{t("signup.teacher")}</div>
          </SignupButton>
        </Link>
      </div>

      <span>
        {t("signup.haveAccount")}{` `}
        <Link href="/login">{t("signup.loginHere")}</Link>
      </span>
    </SignupForm>
  );
}
