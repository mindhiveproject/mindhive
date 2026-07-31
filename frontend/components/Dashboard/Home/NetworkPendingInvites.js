import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import { GET_NETWORK_INVITES } from "../../Queries/ClassNetwork";
import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import { classNetworkUrlRef } from "../../../lib/classNetworkRef";

function buildPendingInvitesWhere(networkIds) {
  const ids = (networkIds || []).filter(Boolean);
  if (ids.length === 0) return null;
  return {
    classNetwork: { id: { in: ids } },
    status: { equals: "pending" },
  };
}

const Strip = styled.div`
  display: inline-flex;
  flex-direction: column;
  gap: ${({ $collapsed }) => ($collapsed ? "0" : "10px")};
  width: fit-content;
  max-width: 100%;
  justify-self: start;
  padding: 14px 16px;
  margin-bottom: 24px;
  border-radius: 12px;
  background: ${({ $collapsed }) =>
    $collapsed
      ? "linear-gradient(135deg, #f7f8f9 0%, #f3f5f6 100%)"
      : "linear-gradient(135deg, #f7f9f8 0%, #eef5f9 100%)"};
  border: 1px solid ${({ $collapsed }) => ($collapsed ? "#e6eaee" : "#d3dae0")};
  opacity: ${({ $collapsed }) => ($collapsed ? 0.72 : 1)};
  transition: opacity 0.15s ease, border-color 0.15s ease, background 0.15s ease;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 32px;
  }

  .headerMeta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
  }

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 16px;
    font-weight: ${({ $collapsed }) => ($collapsed ? 500 : 600)};
    color: ${({ $collapsed }) => ($collapsed ? "#5f6871" : "#171717")};
  }

  .headerChip {
    opacity: ${({ $collapsed }) => ($collapsed ? 0.85 : 1)};
  }

  .headerAction {
    opacity: ${({ $collapsed }) => ($collapsed ? 0.85 : 1)};

    button {
      color: ${({ $collapsed }) =>
        $collapsed ? "#5f6871" : "var(--MH-Theme-Primary-Base, #337C84)"};
    }
  }

  .rows {
    display: ${({ $collapsed }) => ($collapsed ? "none" : "flex")};
    flex-direction: column;
    gap: 6px;
    width: max-content;
    max-width: 100%;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #d3dae0;
  box-sizing: border-box;

  .content {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    gap: 12px;
    justify-content: space-between;
  }

  .title {
    font-family: "Lato", sans-serif;
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
    color: #171717;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    flex: none;
  }

  .action {
    flex: none;
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;

    .content {
      flex: 1 1 100%;
      order: -1;
    }

    .title {
      max-width: none;
    }
  }
`;

function collectAdminNetworks(user) {
  const byId = new Map();
  [...(user?.adminOfClassNetworks || []), ...(user?.classNetworksCreated || [])]
    .filter((network) => network?.id)
    .forEach((network) => {
      if (!byId.has(network.id)) {
        byId.set(network.id, network);
      }
    });
  return Array.from(byId.values());
}

export default function NetworkPendingInvites({ user }) {
  const { t } = useTranslation("home");
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);

  const adminNetworks = useMemo(() => collectAdminNetworks(user), [user]);
  const adminNetworkIds = useMemo(
    () => adminNetworks.map((network) => network.id),
    [adminNetworks]
  );
  const invitesWhere = useMemo(
    () => buildPendingInvitesWhere(adminNetworkIds),
    [adminNetworkIds]
  );

  const { data, loading } = useQuery(GET_NETWORK_INVITES, {
    variables: { where: invitesWhere },
    skip: !invitesWhere,
    fetchPolicy: "cache-and-network",
  });

  const rows = useMemo(() => {
    if (!invitesWhere) return [];

    const titleById = new Map(
      adminNetworks.map((network) => [network.id, network.title])
    );
    const counts = new Map();

    (data?.networkInvites || []).forEach((invite) => {
      const networkId = invite?.classNetwork?.id;
      if (!networkId || !titleById.has(networkId)) return;
      const next = (counts.get(networkId) || 0) + 1;
      counts.set(networkId, next);
      if (invite?.classNetwork?.title) {
        titleById.set(networkId, invite.classNetwork.title);
      }
    });

    const untitled = t("networkPendingInvites.untitled", {}, {
      default: "Untitled network",
    });

    return Array.from(counts.entries())
      .filter(([, count]) => count > 0)
      .map(([id, count]) => {
        const network = adminNetworks.find((item) => item.id === id);
        return {
          id,
          publicId: network?.publicId || null,
          title: titleById.get(id) || untitled,
          count,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [adminNetworks, data?.networkInvites, invitesWhere, t]);

  const totalPending = useMemo(
    () => rows.reduce((sum, row) => sum + row.count, 0),
    [rows]
  );

  if (!invitesWhere || loading || rows.length === 0) {
    return null;
  }

  return (
    <Strip $collapsed={collapsed}>
      <div className="header">
        <h2>
          {t("networkPendingInvites.title", {}, {
            default: "Pending network invites",
          })}
        </h2>
        <div className="headerMeta">
          {collapsed ? (
            <div className="headerChip">
              <Chip
                label={t(
                  "networkPendingInvites.count",
                  { count: totalPending },
                  { default: "{{count}} pending" }
                )}
                style={{
                  borderColor: "#d3dae0",
                  color: "#5f6871",
                  background: "#f7f8f9",
                  backgroundColor: "#f7f8f9",
                }}
              />
            </div>
          ) : null}
          <div className="headerAction">
            <Button
              variant="text"
              onClick={() => setCollapsed((prev) => !prev)}
              style={{ height: 32, paddingLeft: 12, paddingRight: 12 }}
            >
              {collapsed
                ? t("networkPendingInvites.show", {}, { default: "Show" })
                : t("networkPendingInvites.dismiss", {}, { default: "Dismiss" })}
            </Button>
          </div>
        </div>
      </div>

      <div className="rows">
        {rows.map((row) => (
          <Row key={row.id}>
            <div className="content">
              <div className="title">{row.title}</div>
              <div className="count">
                <Chip
                  label={t(
                    "networkPendingInvites.count",
                    { count: row.count },
                    { default: "{{count}} pending" }
                  )}
                />
              </div>
            </div>
            <div className="action">
              <Button
                variant="outline"
                style={{ height: 32, paddingLeft: 12, paddingRight: 12 }}
                onClick={() =>
                  router.push(
                    `/dashboard/connect/networks?mode=manage&networkId=${encodeURIComponent(
                      classNetworkUrlRef(row) || row.id
                    )}#network-pending-invites`
                  )
                }
              >
                {t("networkPendingInvites.open", {}, { default: "Review" })}
              </Button>
            </div>
          </Row>
        ))}
      </div>
    </Strip>
  );
}
