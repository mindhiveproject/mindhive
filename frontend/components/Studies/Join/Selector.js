import { StyledSelector } from "../../styles/StyledJoinStudyFlow";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

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
              <button>{t('join.selector.guestButton')}</button>
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
              <button>{t('join.selector.returningButton')}</button>
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
              <button>{t('join.selector.newButton')}</button>
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
              <button>{t('join.selector.memberButton')}</button>
            </Link>
          </div>
        )}
      </div>
    </StyledSelector>
  );
}
