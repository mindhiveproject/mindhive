import Link from "next/link";
import ConsentSettings from "./ConsentSettings";
import CustomizeConsent from "./CustomizeConsent";
import ConsentPage from "./ConsentPage";

import ConsentsList from "./ConsentsList";
import PublicConsentsList from "./PublicConsentsList";
import StyledConsent from "../../styles/StyledConsent";
import Button from "../../DesignSystem/Button";
import { NavbarItem, SectionNavbar } from "../../DesignSystem/Navbar";
import useTranslation from "next-translate/useTranslation";

export default function ConsentMain({ query, user }) {
  const { selector } = query;
  const { t } = useTranslation("dashboard");
  const isConsentPage = selector && selector !== "add" && selector !== "public";
  // the editor and settings pages bring their own header
  const isEditor =
    selector === "add" || (isConsentPage && query?.action !== "status");

  return (
    <StyledConsent>
      {!isEditor && (
        <>
          <h1 className="MH-Type-Heading-Base">
            {t("consentAdmin.heading", {}, { default: "Consent protocols" })}
          </h1>
          <div className="header">
            <SectionNavbar
              variant="underline"
              showRule
              gapless
              aria-label={t(
                "consentAdmin.heading",
                {},
                {
                  default: "Consent protocols",
                }
              )}
            >
              <NavbarItem as={Link} href="/dashboard/irb" selected={!selector}>
                {t("consentAdmin.myProtocols", {}, { default: "My protocols" })}
              </NavbarItem>
              <NavbarItem
                as={Link}
                href="/dashboard/irb/public"
                selected={selector === "public"}
              >
                {t(
                  "consentAdmin.publicProtocols",
                  {},
                  {
                    default: "Public protocols",
                  }
                )}
              </NavbarItem>
            </SectionNavbar>
            {!selector && (
              <Link href="/dashboard/irb/add">
                <Button variant="filled" type="button">
                  {t(
                    "consentAdmin.addConsentForm",
                    {},
                    {
                      default: "Add consent form",
                    }
                  )}
                </Button>
              </Link>
            )}
          </div>
        </>
      )}

      {!selector && <ConsentsList user={user} />}

      {selector === "add" &&
        (query?.from ? (
          <CustomizeConsent code={query.from} user={user} />
        ) : (
          <ConsentSettings user={user} />
        ))}

      {selector === "public" && <PublicConsentsList user={user} />}

      {isConsentPage && (
        // key forces a fresh form state when moving between protocols
        <ConsentPage key={selector} code={selector} user={user} query={query} />
      )}
    </StyledConsent>
  );
}
