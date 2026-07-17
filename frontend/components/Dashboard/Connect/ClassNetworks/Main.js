import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../../../DesignSystem/Button";
import {
  GET_ALL_NETWORKS,
  GET_PUBLIC_CLASS_NETWORKS,
} from "../../../Queries/ClassNetwork";
import RoleGuard from "../RoleGuard";
import { deriveRoles } from "../useConnectRole";
import NetworkDetailPage from "./NetworkDetail";
import {
  buildManageNetworksQueryVariables,
  countUniqueStudents,
  formatCount,
} from "./utils";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-height: 100vh;
  padding: 32px clamp(16px, 6vw, 64px);
  padding-top: 0;
  border-radius: 32px 0 0 32px;
  background-color: #f7f9f8;
`;

const Header = styled.div`
  display: grid;
  gap: 8px;

  h1 {
    margin: 0;
    color: #171717;
    font-family: "Lato", sans-serif;
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
  }

  p {
    max-width: 680px;
    margin: 0;
    color: #5f6871;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    line-height: 22px;
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
`;

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 20px;
  border: 1px solid #ece9e6;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);

  h3 {
    margin: 0;
    color: #171717;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    font-weight: 600;
    line-height: 24px;
  }

  p {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: #5f6871;
    font-family: "Inter", sans-serif;
    font-size: 13px;
    line-height: 20px;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid #eef1f2;
    color: #625b71;
    font-family: "Inter", sans-serif;
    font-size: 12px;
    line-height: 18px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
`;

const Empty = styled.div`
  padding: 48px 24px;
  border-radius: 16px;
  background: #ffffff;
  color: #5f6871;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 22px;
  text-align: center;
`;

const Status = styled.div`
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  color: #5f6871;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 22px;
`;

function NetworkCard({
  network,
  actions,
  showVisibility = false,
  showRegistryMeta = false,
}) {
  const { t } = useTranslation("connect");
  const classCount = network?.classes?.length || 0;
  const organizationCount = network?.memberOrganizations?.length || 0;
  const opportunityCount = network?.opportunities?.length || 0;
  const profileCount = network?.memberProfiles?.length || 0;
  const studentCount = showRegistryMeta ? countUniqueStudents(network) : 0;

  return (
    <Card>
      <h3>
        {network?.title ||
          t("classNetworks.untitled", {}, { default: "Untitled network" })}
      </h3>
      {network?.description ? <p>{network.description}</p> : null}
      <div className="meta">
        {showVisibility ? (
          <span>
            {network?.isPublic
              ? t("classNetworks.visibilityPublic", {}, { default: "Public" })
              : t("classNetworks.visibilityPrivate", {}, {
                  default: "Private",
                })}
          </span>
        ) : null}
        <span>
          {formatCount(
            t,
            classCount,
            "classNetworks.classCountSingle",
            "classNetworks.classCountPlural",
            "{{count}} linked class",
            "{{count}} linked classes"
          )}
        </span>
        <span>
          {formatCount(
            t,
            organizationCount,
            "classNetworks.organizationCountSingle",
            "classNetworks.organizationCountPlural",
            "{{count}} organization",
            "{{count}} organizations"
          )}
        </span>
        {showRegistryMeta ? (
          <span>
            {formatCount(
              t,
              profileCount,
              "classNetworks.profileCountSingle",
              "classNetworks.profileCountPlural",
              "{{count}} member profile",
              "{{count}} member profiles"
            )}
          </span>
        ) : null}
        {showRegistryMeta ? (
          <span>
            {formatCount(
              t,
              studentCount,
              "classNetworks.studentCountSingle",
              "classNetworks.studentCountPlural",
              "{{count}} student in linked classes",
              "{{count}} students in linked classes"
            )}
          </span>
        ) : null}
        <span>
          {formatCount(
            t,
            opportunityCount,
            "classNetworks.opportunityCountSingle",
            "classNetworks.opportunityCountPlural",
            "{{count}} opportunity",
            "{{count}} opportunities"
          )}
        </span>
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </Card>
  );
}

function PublicNetworks() {
  const { t } = useTranslation("connect");
  const { data, loading, error } = useQuery(GET_PUBLIC_CLASS_NETWORKS);
  const networks = data?.classNetworks || [];

  return (
    <RoleGuard allow={["teacher", "mentor"]}>
      <Shell>
        <Header>
          <h1>
            {t("classNetworks.publicTitle", {}, {
              default: "Explore public networks",
            })}
          </h1>
          <p>
            {t("classNetworks.publicDescription", {}, {
              default:
                "Browse class networks that are open for discovery across MindHive Connect.",
            })}
          </p>
        </Header>

        {loading ? (
          <Status>
            {t("classNetworks.loading", {}, { default: "Loading networks..." })}
          </Status>
        ) : error ? (
          <Status role="alert">
            {t("classNetworks.loadError", {}, {
              default: "Unable to load class networks.",
            })}
          </Status>
        ) : networks.length > 0 ? (
          <Grid>
            {networks.map((network) => (
              <NetworkCard key={network.id} network={network} />
            ))}
          </Grid>
        ) : (
          <Empty>
            {t("classNetworks.publicEmpty", {}, {
              default: "No public class networks are available yet.",
            })}
          </Empty>
        )}
      </Shell>
    </RoleGuard>
  );
}

function ManageNetworks({ user }) {
  const { t } = useTranslation("connect");
  const router = useRouter();
  const { isAdmin, adminClassNetworkIds, canManageClassNetwork } =
    deriveRoles(user);
  const queryVariables = useMemo(
    () => buildManageNetworksQueryVariables(isAdmin, adminClassNetworkIds),
    [adminClassNetworkIds, isAdmin]
  );
  const { data, loading, error } = useQuery(GET_ALL_NETWORKS, {
    variables: queryVariables,
    skip: !isAdmin && adminClassNetworkIds.length === 0,
  });
  const networks = data?.classNetworks || [];

  const handleOpenDetails = (network) => {
    if (!network?.id) return;
    router.push({
      pathname: "/dashboard/connect/networks",
      query: { mode: "manage", networkId: network.id },
    });
  };

  return (
    <RoleGuard allow={["classNetworkAdmin"]}>
      <Shell>
        <Header>
          <h1>
            {t("classNetworks.manageTitle", {}, {
              default: "Manage networks",
            })}
          </h1>
          <p>
            {t("classNetworks.manageDescription", {}, {
              default:
                "Review membership and matching for networks you administer, and manage network admins.",
            })}
          </p>
        </Header>

        {loading ? (
          <Status>
            {t("classNetworks.loading", {}, { default: "Loading networks..." })}
          </Status>
        ) : error ? (
          <Status role="alert">
            {t("classNetworks.loadError", {}, {
              default: "Unable to load class networks.",
            })}
          </Status>
        ) : networks.length > 0 ? (
          <Grid>
            {networks.map((network) => (
              <NetworkCard
                key={network.id}
                network={network}
                showVisibility
                showRegistryMeta
                actions={
                  canManageClassNetwork(network.id) ? (
                    <DesignSystemButton
                      variant="primary"
                      type="button"
                      onClick={() => handleOpenDetails(network)}
                      aria-label={t(
                        "classNetworks.viewDetailsAria",
                        { title: network?.title || "" },
                        { default: "View details for {{title}}" }
                      )}
                    >
                      {t("classNetworks.viewDetails", {}, {
                        default: "View details",
                      })}
                    </DesignSystemButton>
                  ) : null
                }
              />
            ))}
          </Grid>
        ) : (
          <Empty>
            {t("classNetworks.manageEmpty", {}, {
              default: "You do not manage any class networks yet.",
            })}
          </Empty>
        )}
      </Shell>
    </RoleGuard>
  );
}

export default function ClassNetworksMain({ query, user }) {
  if (query?.mode === "manage" && query?.networkId) {
    return <NetworkDetailPage query={query} user={user} />;
  }

  return query?.mode === "manage" ? (
    <ManageNetworks user={user} />
  ) : (
    <PublicNetworks />
  );
}
