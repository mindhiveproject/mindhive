import { useQuery } from "@apollo/client";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import { GET_MY_CONSENTS } from "../../Queries/Consent";

export default function ConsentsList({ user }) {
  const { t } = useTranslation("dashboard");
  const { data, error, loading } = useQuery(GET_MY_CONSENTS, {
    variables: { userId: user?.id },
    skip: !user?.id,
    // Show cached protocols instantly, then refresh so newly created or
    // copied protocols always appear.
    fetchPolicy: "cache-and-network",
  });

  const consents = data?.consents || [];

  if (error) {
    return (
      <p className="consentListError" role="alert">
        {t(
          "consentAdmin.loadError",
          {},
          {
            default: "We couldn’t load your protocols. Please try again.",
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
            "consentAdmin.noProtocols",
            {},
            {
              default: "You don’t have any consent protocols yet.",
            }
          )}
        </h3>
        <p>
          {t(
            "consentAdmin.noProtocolsInfo",
            {},
            {
              default:
                "Create a new protocol, or customize one of the public protocols.",
            }
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="consentListContainer">
      <div className="consentListHeader hasActions">
        <div>{t("consentAdmin.title", {}, { default: "Title" })}</div>
        <div>{t("consentAdmin.owner", {}, { default: "Owner" })}</div>
      </div>

      <div className="consentListBoard">
        {consents.map((consent) => {
          const isOwner = consent?.author?.id === user?.id;
          const href = `/dashboard/irb/${consent?.code}`;
          return (
            <div key={consent.id} className="consentListRow hasActions">
              <div className="consentListRowTitle">
                {/* stretched over the whole row: the row opens the settings */}
                <Link
                  className="consentListRowLink"
                  href={{ pathname: href, query: { action: "settings" } }}
                >
                  {consent?.title}
                </Link>
              </div>
              <div className="consentListRowMeta">
                {isOwner
                  ? t("consentAdmin.you", {}, { default: "You" })
                  : consent?.author?.username}
              </div>
              {/* TODO: a Status button once the status page is designed */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
