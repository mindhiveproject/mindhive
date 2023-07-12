import Link from "next/link";
import Router, { useRouter } from "next/router";
import NProgress from "nprogress";
import Nav from "../Navigation/Top";
import useTranslation from "next-translate/useTranslation";

import { StyledHeader, Logo, MainNavLink } from "../styles/StyledHeader";

Router.onRouteChangeStart = () => {
  NProgress.start();
};
Router.onRouteChangeComplete = () => {
  NProgress.done();
};
Router.onRouteChangeError = () => {
  NProgress.done();
};

const Header = ({ user }) => {
  const { t } = useTranslation("common");
  const router = useRouter();

  return (
    <StyledHeader>
      <div className="bar">
        <Logo>
          <Link href="/">
            <div className="logo">
              <img src="/logo.png" alt="icon" height="50" />
            </div>
          </Link>
        </Logo>

        <div className="links">
          <Link href="/discover">
            <MainNavLink
              selected={
                router.pathname === "/discover" || router.pathname === "/"
              }
            >
              {t("navigation.discover")}
            </MainNavLink>
          </Link>
          <Link href="/docs/about">
            <MainNavLink
              selected={
                router.pathname === "/docs/[slug]" &&
                router.query.slug === "about"
              }
            >
              {t("navigation.about")}
            </MainNavLink>
          </Link>
          <Link href="/teachers">
            <MainNavLink selected={router.pathname === "/teachers"}>
              {t("navigation.teachers")}
            </MainNavLink>
          </Link>
        </div>
        <Nav user={user} />
      </div>
    </StyledHeader>
  );
};

export default Header;
