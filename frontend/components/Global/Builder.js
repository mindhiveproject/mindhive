import PropTypes from "prop-types";
import { useContext } from "react";
import useTranslation from 'next-translate/useTranslation';

import { StyledBuilder } from "../styles/StyledBuilder";
import { UserContext } from "./Authorized";
import FullScreenLoading from "../DesignSystem/FullScreenLoading";

export default function Dashboard({ children }) {
  const { user, loading: authLoading } = useContext(UserContext);
  const { t } = useTranslation('builder');

  // Must come before the !user branch: until the user query answers, a null
  // user means "not known yet", not "logged out".
  if (authLoading) {
    return <FullScreenLoading />;
  }

  if (!user) {
    return <div>{t('pleaseLogin', 'Please first log in!')}</div>;
  }

  return <StyledBuilder>{children}</StyledBuilder>;
}
