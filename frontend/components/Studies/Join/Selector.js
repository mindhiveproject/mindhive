import { StyledSelector } from "../../styles/StyledJoinStudyFlow";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import Button from "../../DesignSystem/Button";

export default function Selector({ user, study, query }) {
  const { t } = useTranslation('common');
  const { settings } = study;

  return (
    <StyledSelector>
      <div className="selectorHeader">
        <h1>{t('join.selector.header')}</h1>
      </div>
      <div className="selectorOptions">
        {settings?.guestParticipation && (
          <div className="option borderRight">
            <h2>{t('join.selector.guestTitle')}</h2>
            <p>{t('join.selector.guestDesc')}</p>
            <Link
              href={{
                pathname: `/join/details`,
                query: { ...query, guest: true },
              }}
            >
              <Button variant="outline">
                {t("join.selector.guestButton", {}, { default: "Continue as guest" })}
              </Button>
            </Link>
          </div>
        )}

        {!user && (
          <div className="option borderRight">
            <h2>{t('join.selector.returningTitle')}</h2>
            <p>{t('join.selector.returningDesc')}</p>
            <Link
              href={{
                pathname: `/join/login`,
                query: { ...query },
              }}
            >
              <Button variant="outline">
                {t("join.selector.returningButton", {}, { default: "Log in" })}
              </Button>
            </Link>
          </div>
        )}

        {!user && (
          <div className="option">
            <h2>{t('join.selector.newTitle')}</h2>
            <p>{t('join.selector.newDesc')}</p>
            <Link
              href={{
                pathname: `/join/signup`,
                query: { ...query },
              }}
            >
              <Button variant="outline">
                {t("join.selector.newButton", {}, { default: "Sign up" })}
              </Button>
            </Link>
          </div>
        )}

        {user && (
          <div className="option">
            <h2>{t('join.selector.memberTitle')}</h2>
            <p>{t('join.selector.memberDesc')}</p>
            <Link
              href={{
                pathname: `/join/details`,
                query: { ...query, guest: false },
              }}
            >
              <Button variant="outline">
                {t("join.selector.memberButton", {}, { default: "Continue as a member" })}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </StyledSelector>
  );
}
