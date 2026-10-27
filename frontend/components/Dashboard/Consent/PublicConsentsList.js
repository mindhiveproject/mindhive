import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { GET_PUBLIC_CONSENTS } from "../../Queries/Consent";
import Button from "../../DesignSystem/Button";

export default function PublicConsentsList({ user }) {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const { data, error, loading } = useQuery(GET_PUBLIC_CONSENTS, {
    fetchPolicy: "cache-and-network",
  });
  const consents = data?.consents || [];

  if (error) {
    return (
      <p className="consentListError" role="alert">
        {t(
          "consentAdmin.loadPublicError",
          {},
          {
            default: "We couldn’t load the public protocols. Please try again.",
          }
        )}
      </p>
    );
  }

  if (loading && !data) {
    return (
      <p className="consentListLoading">
        {t("consentAdmin.loading", {}, { default: "Loading…" })}
      </p>
    );
  }

  if (consents.length === 0) {
    return (
      <div className="consentListEmpty">
        <h3>
          {t(
            "consentAdmin.noPublicProtocols",
            {},
            {
              default: "There are no public protocols yet.",
            }
          )}
        </h3>
      </div>
    );
  }

  return (
    <>
      <div className="consentListContainer">
        <div className="consentListHeader hasAction">
          <div>{t("consentAdmin.title", {}, { default: "Title" })}</div>
          <div>
            {t("consentAdmin.description", {}, { default: "Description" })}
          </div>
          <div>
            {t("consentAdmin.dateCreated", {}, { default: "Date created" })}
          </div>
          <div aria-hidden="true" />
        </div>

        <div className="consentListBoard">
          {consents.map((consent) => {
            const href = `/dashboard/irb/${consent?.code}`;
            return (
              <div
                key={consent.id}
                className="consentListRow hasAction"
                onClick={() => router.push(href)}
              >
                <div className="consentListRowTitle">
                  <Link href={href} onClick={(e) => e.stopPropagation()}>
                    {consent?.title}
                  </Link>
                </div>
                <div className="consentListRowMeta">{consent?.description}</div>
                <div className="consentListRowMeta">
                  {moment(consent?.createdAt).format("MMMM D, YYYY")}
                </div>
                <div className="consentListRowAction">
                  {/* opens a prefilled new protocol; nothing is copied yet */}
                  <Link
                    href={{
                      pathname: "/dashboard/irb/add",
                      query: { from: consent?.code },
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="outline" type="button">
                      {t(
                        "consentAdmin.customize",
                        {},
                        { default: "Customize" }
                      )}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
