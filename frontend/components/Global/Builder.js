import PropTypes from "prop-types";
import { useContext } from "react";
import useTranslation from 'next-translate/useTranslation';

import { StyledBuilder } from "../styles/StyledBuilder";
import { UserContext } from "./Authorized";

export default function Dashboard({ children }) {
  const user = useContext(UserContext);
  const { t } = useTranslation('builder');

  if (!user) {
    return <div>{t('pleaseLogin', 'Please first log in!')}</div>;
  }

  return <StyledBuilder>{children}</StyledBuilder>;
}
