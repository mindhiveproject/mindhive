import React, { Component } from "react";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import {
  NavStyles,
  NavRightContainer,
  NavButton,
  NavButtonSecondary,
} from "../styles/StyledNavigation";

const Nav = ({ user }) => {
  const { t } = useTranslation("common");
  return (
    <NavStyles>
      <NavRightContainer>
        {user ? (
          <Link href="/dashboard">
            <NavButton>{t("navigation.dashboard")}</NavButton>
          </Link>
        ) : (
          <div className="menuLinks">
            <Link href="/login">
              <NavButton>{t("navigation.login")}</NavButton>
            </Link>
            <Link href="/signup">
              <NavButtonSecondary>{t("navigation.signup")}</NavButtonSecondary>
            </Link>
          </div>
        )}
      </NavRightContainer>
    </NavStyles>
  );
};

export default Nav;
