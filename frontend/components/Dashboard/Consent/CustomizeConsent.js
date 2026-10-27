import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_CONSENT } from "../../Queries/Consent";
import ConsentSettings from "./ConsentSettings";

// New protocol prefilled from a public one ("Customize"). Nothing is
// created until the user clicks Create protocol.
export default function CustomizeConsent({ code, user }) {
  const { t } = useTranslation("dashboard");
  const { data, loading } = useQuery(GET_CONSENT, { variables: { code } });

  if (loading && !data) {
    return (
      <p className="consentListLoading">
        {t("consentAdmin.loading", {}, { default: "Loading…" })}
      </p>
    );
  }

  // key: remount the form once the template has loaded
  return (
    <ConsentSettings
      key={data?.consent?.id || "blank"}
      template={data?.consent}
      user={user}
    />
  );
}
