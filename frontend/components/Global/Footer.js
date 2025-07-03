import Link from "next/link";
import { StyledFooter } from "../styles/StyledFooter";
import useTranslation from "next-translate/useTranslation";

const Footer = () => {
  const { t } = useTranslation("home");
  return (
    <StyledFooter>
      <div className="infoPanel">
        <h1>{t("footer.title")}</h1>
        <p>{t("footer.description")}</p>
        <p>{t("footer.audience")}</p>
        <p>{t("footer.copyright")}</p>
      </div>

      <div className="linksPanel">
        <div>
          <Link href="/docs/about">
            <p className="link">{t("footer.about")}</p>
          </Link>
        </div>
        <div>
          <Link href="/docs/privacy" locale="en-us">
            <p className="link">{t("footer.privacy")}</p>
          </Link>
        </div>
        <div>
          <Link href="/docs/terms" locale="en-us">
            <p className="link">{t("footer.terms")}</p>
          </Link>
        </div>
        <div>
          <p>
            <a href="mailto: info@mindhive.science">{t("footer.email")}</a>
          </p>
        </div>
      </div>
    </StyledFooter>
  );
};

export default Footer;
