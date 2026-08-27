import Link from "next/link";
import AddConsent from "./AddConsent";
import ConsentPage from "./ConsentPage";

import ConsentsList from "./ConsentsList";
import PublicConsentsList from "./PublicConsentsList";
import StyledConsent from "../../styles/StyledConsent";
import Button from "../../DesignSystem/Button";
import useTranslation from "next-translate/useTranslation";

export default function ConsentMain({ query, user }) {
  const { selector } = query;
  const { t } = useTranslation("dashboard");
  return (
    <StyledConsent>
      <h1 className="MH-Type-Heading-Base">Consent protocols</h1>
      <div className="header">
        <div className="menu">
          <Link href="/dashboard/irb">
            <div
              className={
                !selector ? "menuTitle selectedMenuTitle" : "menuTitle"
              }
            >
              <p>My protocols</p>
            </div>
          </Link>

          <Link href="/dashboard/irb/public">
            <div
              className={
                selector === "public"
                  ? "menuTitle selectedMenuTitle"
                  : "menuTitle"
              }
            >
              <p>Public protocols</p>
            </div>
          </Link>
        </div>
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
