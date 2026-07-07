import { useEffect, useState } from "react";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import {
  SignupButton,
  SignupForm,
  SponsorRecommendation,
  SponsorSignupRow,
} from "../styles/StyledForm";

const SPONSOR_NOTICE_STORAGE_KEY = "signup-sponsor-nyu-cusp-notice-dismissed";

export default function Sign() {
  const { t } = useTranslation("common");
  const [showSponsorNotice, setShowSponsorNotice] = useState(true);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SPONSOR_NOTICE_STORAGE_KEY) === "true") {
        setShowSponsorNotice(false);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const dismissSponsorNotice = () => {
    setShowSponsorNotice(false);
    try {
      window.localStorage.setItem(SPONSOR_NOTICE_STORAGE_KEY, "true");
    } catch {
      // ignore storage errors
    }
  };

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

        <SponsorSignupRow>
          {showSponsorNotice && (
            <SponsorRecommendation role="note">
              <p>
                {t(
                  "signup.sponsorNyuCuspRecommendation",
                  {},
                  {
                    default:
                      "Recommended option for NYU CUSP Capstone sponsors.",
                  },
                )}
              </p>
              <button
                type="button"
                onClick={dismissSponsorNotice}
                aria-label={t("close", {}, { default: "Close" })}
              >
                <img src="/assets/icons/close.svg" alt="" />
              </button>
            </SponsorRecommendation>
          )}
          <Link href="/signup/sponsor">
            <SignupButton>
              <div>
                <img src="/assets/signup/sponsor.svg" alt="icon" height="20" />
              </div>
              <div>{t("signup.sponsor")}</div>
            </SignupButton>
          </Link>
        </SponsorSignupRow>
      </div>

      <span>
        {t("signup.haveAccount")}{` `}
        <Link href="/login">{t("signup.loginHere")}</Link>
      </span>
    </SignupForm>
  );
}
