import { StyledSelector } from "../../styles/StyledJoinStudyFlow";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import Button from "../../DesignSystem/Button";

export default function Selector({ user, study, query }) {
  const { t } = useTranslation("common");
  const { settings } = study;

  return (
    <StyledSelector>
      <div className="selectorHeader">
        <h1>
          {t("join.selector.header", {}, {
            default: "How would you like to participate today?",
          })}
        </h1>
      </div>
      <div className="selectorOptions">
        {settings?.guestParticipation && (
          <div className="option borderRight">
            <h2>
              {t("join.selector.guestTitle", {}, {
                default: "Guest participant",
              })}
            </h2>
            <p>
              {t("join.selector.guestDesc", {}, {
                default:
                  "Proceed directly to the study. Guests cannot save information for the next time.",
              })}
            </p>
            <Link
              href={{
                pathname: `/join/details`,
                query: { ...query, guest: true },
              }}
            >
              <Button variant="outline" style={{ width: "100%" }}>
                {t("join.selector.guestButton", {}, {
                  default: "Continue as guest",
                })}
              </Button>
            </Link>
          </div>
        )}

        {!user && (
          <div className="option borderRight">
            <h2>
              {t("join.selector.returningTitle", {}, {
                default: "Returning MindHive member",
              })}
            </h2>
            <p>
              {t("join.selector.returningDesc", {}, {
                default:
                  "Already have a MindHive account? Log in for a faster study experience.",
              })}
            </p>
            <Link
              href={{
                pathname: `/join/login`,
                query: { ...query },
              }}
            >
              <Button variant="outline" style={{ width: "100%" }}>
                {t("join.selector.returningButton", {}, { default: "Log in" })}
              </Button>
            </Link>
          </div>
        )}

        {!user && (
          <div className="option">
            <h2>
              {t("join.selector.newTitle", {}, {
                default: "New MindHive member",
              })}
            </h2>
            <p>
              {t("join.selector.newDesc", {}, {
                default: "Sign up to speed up study participation next time",
              })}
            </p>
            <Link
              href={{
                pathname: `/join/signup`,
                query: { ...query },
              }}
            >
              <Button variant="outline" style={{ width: "100%" }}>
                {t("join.selector.newButton", {}, { default: "Sign up" })}
              </Button>
            </Link>
          </div>
        )}

        {user && (
          <div className="option">
            <h2>
              {t("join.selector.memberTitle", {}, {
                default: "MindHive member",
              })}
            </h2>
            <p>
              {t("join.selector.memberDesc", {}, {
                default: "Continue as a member for a faster study experience.",
              })}
            </p>
            <Link
              href={{
                pathname: `/join/details`,
                query: { ...query, guest: false },
              }}
            >
              <Button variant="filled" style={{ width: "100%" }}>
                {t("join.selector.memberButton", {}, {
                  default: "Continue as a member",
                })}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </StyledSelector>
  );
}
