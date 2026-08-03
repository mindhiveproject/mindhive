import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import { StyledFooter } from "../styles/StyledFooter";

const Footer = () => {
  const { t } = useTranslation("home");
  const email = t("footer.email", {}, { default: "info@mindhive.science" });
  const brandName = t("footer.title", {}, { default: "MindHive" });

  return (
    <StyledFooter>
      <div className="logoRow">
        <img className="logo" src="/logo_mh_bw.svg" alt={brandName} />
      </div>

      <div className="footerBody">
        <div className="infoPanel">
          <p>
            {t("footer.description", {}, {
              default:
                "MindHive is a web-based citizen science platform that supports real-world brain and behavior research.",
            })}
          </p>
          <p>
            {t("footer.audience", {}, {
              default:
                "MindHive was designed for students & teachers who seek authentic STEM research experience, and for neuroscientists & cognitive/social psychologists who seek to address their research questions outside of the lab.",
            })}
          </p>
          <p>{t("footer.copyright", {}, { default: "© 2026" })}</p>
        </div>

        <nav
          className="linksPanel"
          aria-label={t("footer.navLabel", {}, { default: "Footer" })}
        >
          <Link href="/docs/about" legacyBehavior>
            <a className="link">
              {t("footer.about", {}, { default: "About" })}
            </a>
          </Link>
          <Link href="/teachers" legacyBehavior>
            <a className="link">
              {t("footer.teachers", {}, { default: "Teachers" })}
            </a>
          </Link>
          <Link href="/docs/privacy" locale="en-us" legacyBehavior>
            <a className="link">
              {t("footer.privacy", {}, { default: "Privacy Policy" })}
            </a>
          </Link>
          <Link href="/docs/terms" locale="en-us" legacyBehavior>
            <a className="link">
              {t("footer.terms", {}, { default: "Terms & Conditions" })}
            </a>
          </Link>
          <a className="link" href={`mailto:${email}`}>
            {email}
          </a>
        </nav>
      </div>
    </StyledFooter>
  );
};

export default Footer;
