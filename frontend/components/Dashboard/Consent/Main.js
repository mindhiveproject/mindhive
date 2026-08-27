import Link from "next/link";
import AddConsent from "./AddConsent";
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
  return (
    <StyledConsent>
      <h1 className="MH-Type-Heading-Base">Consent protocols</h1>
      <div className="header">
        <SectionNavbar
          variant="underline"
          showRule
          gapless
          aria-label="Consent protocols"
        >
          <NavbarItem as={Link} href="/dashboard/irb" selected={!selector}>
            My protocols
          </NavbarItem>
          <NavbarItem
            as={Link}
            href="/dashboard/irb/public"
            selected={selector === "public"}
          >
            Public protocols
          </NavbarItem>
        </SectionNavbar>
        {!selector && (
          <Link href="/dashboard/irb/add">
            <Button variant="filled" type="button">
              {t("consentAdmin.addConsentForm", {}, {
                default: "Add consent form",
              })}
            </Button>
          </Link>
        )}
      </div>

      {!selector && <ConsentsList query={query} user={user} />}

      {selector === "add" && <AddConsent user={user} />}

      {selector === "public" && (
        <PublicConsentsList query={query} user={user} />
      )}

      {selector && selector !== "add" && selector !== "public" && (
        <ConsentPage code={selector} user={user} query={query} />
      )}
    </StyledConsent>
  );
}
