import PropTypes from "prop-types";
import { useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import useTranslation from 'next-translate/useTranslation';

import { StyledBuilder } from "../styles/StyledBuilder";
import { UserContext } from "./Authorized";
import FullScreenLoading from "../DesignSystem/FullScreenLoading";
import { loginHrefWithNext } from "../../lib/safeNextPath";

export default function Dashboard({ children }) {
  const { user, loading: authLoading } = useContext(UserContext);
  const { t } = useTranslation('builder');
  const router = useRouter();

  // Must come before the !user branch: until the user query answers, a null
  // user means "not known yet", not "logged out".
  if (authLoading) {
    return <FullScreenLoading />;
  }

  // Deep links (study cards, shared builder URLs) land here when the session
  // is missing or expired. Hand the current path to the login page so the
  // user comes back to the same study/tab instead of /dashboard.
  if (!user) {
    return (
      <div>
        <p>{t('pleaseLogin', 'Please first log in!')}</p>
        <Link href={loginHrefWithNext(router.asPath)}>
          {t('pleaseLoginLink', 'Log in to continue')}
        </Link>
      </div>
    );
  }

  return <StyledBuilder>{children}</StyledBuilder>;
}
