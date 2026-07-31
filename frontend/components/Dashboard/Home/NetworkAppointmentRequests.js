import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import {
  MY_CLASSES_FOR_APPOINTMENT_REQUESTS,
  NETWORK_APPOINTMENT_REQUESTS,
} from "../../Queries/Opportunity";
import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";

function buildAppointmentRequestsWhere(networkIds) {
  const ids = (networkIds || []).filter(Boolean);
  if (ids.length === 0) return null;
  return {
    requestsAppointment: { equals: true },
    status: { equals: "pending_review" },
    classNetworks: { some: { id: { in: ids } } },
  };
}

function collectReviewClasses(profile) {
  const byId = new Map();
  [...(profile?.teacherIn || []), ...(profile?.mentorIn || [])]
    .filter((cls) => cls?.id && cls?.code)
    .forEach((cls) => {
      if (!byId.has(cls.id)) {
        byId.set(cls.id, {
          id: cls.id,
          title: cls.title,
          code: cls.code,
          networks: cls.networks || [],
        });
      }
    });
  return Array.from(byId.values());
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

export default function NetworkAppointmentRequests() {
  const { t } = useTranslation("home");
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);

  const { data: classesData, loading: classesLoading } = useQuery(
    MY_CLASSES_FOR_APPOINTMENT_REQUESTS,
    { fetchPolicy: "cache-and-network" }
  );

  const reviewClasses = useMemo(
    () => collectReviewClasses(classesData?.authenticatedItem),
    [classesData?.authenticatedItem]
  );

  const networkIds = useMemo(() => {
    const ids = new Set();
    reviewClasses.forEach((cls) => {
      (cls.networks || []).forEach((network) => {
        if (network?.id) ids.add(network.id);
      });
    });
    return Array.from(ids);
  }, [reviewClasses]);

  const opportunitiesWhere = useMemo(
    () => buildAppointmentRequestsWhere(networkIds),
    [networkIds]
  );

  const { data, loading: opportunitiesLoading } = useQuery(
    NETWORK_APPOINTMENT_REQUESTS,
    {
      variables: { where: opportunitiesWhere },
      skip: !opportunitiesWhere,
      fetchPolicy: "cache-and-network",
    }
  );

  const rows = useMemo(() => {
    if (!opportunitiesWhere || reviewClasses.length === 0) return [];

    const networkToClasses = new Map();
    reviewClasses.forEach((cls) => {
      (cls.networks || []).forEach((network) => {
        if (!network?.id) return;
        const list = networkToClasses.get(network.id) || [];
        list.push(cls);
        networkToClasses.set(network.id, list);
      });
    });

    // classId -> { count, networkCounts: Map<networkId, count> }
    const byClass = new Map();

    (data?.opportunities || []).forEach((opportunity) => {
      const countedForClass = new Set();
      (opportunity?.classNetworks || []).forEach((network) => {
        const classes = networkToClasses.get(network?.id) || [];
        classes.forEach((cls) => {
          const entry = byClass.get(cls.id) || {
            class: cls,
            count: 0,
            networkCounts: new Map(),
          };
          if (!countedForClass.has(cls.id)) {
            countedForClass.add(cls.id);
            entry.count += 1;
          }
          entry.networkCounts.set(
            network.id,
            (entry.networkCounts.get(network.id) || 0) + 1
          );
          byClass.set(cls.id, entry);
        });
      });
    });

    const untitled = t("networkAppointmentRequests.untitled", {}, {
      default: "Untitled class",
    });

    return Array.from(byClass.values())
      .filter((entry) => entry.count > 0)
      .map((entry) => {
        let preferredNetworkId = entry.class.networks?.[0]?.id || null;
        let max = 0;
        entry.networkCounts.forEach((count, networkId) => {
          if (count > max) {
            max = count;
            preferredNetworkId = networkId;
          }
        });

        return {
          id: entry.class.id,
          code: entry.class.code,
          title: entry.class.title || untitled,
          count: entry.count,
          networkId: preferredNetworkId,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [data?.opportunities, opportunitiesWhere, reviewClasses, t]);

  const totalRequested = useMemo(
    () => rows.reduce((sum, row) => sum + row.count, 0),
    [rows]
  );

  const loading = classesLoading || opportunitiesLoading;

  if (!opportunitiesWhere || loading || rows.length === 0) {
    return null;
  }

  return (
    <Strip $collapsed={collapsed}>
      <div className="header">
        <h2>
          {t("networkAppointmentRequests.title", {}, {
            default: "Appointment requests",
          })}
        </h2>
        <div className="headerMeta">
          {collapsed ? (
            <div className="headerChip">
              <Chip
                label={t(
                  "networkAppointmentRequests.count",
                  { count: totalRequested },
                  { default: "{{count}} requested" }
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
                ? t("networkAppointmentRequests.show", {}, { default: "Show" })
                : t("networkAppointmentRequests.dismiss", {}, {
                    default: "Dismiss",
                  })}
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
                    "networkAppointmentRequests.count",
                    { count: row.count },
                    { default: "{{count}} requested" }
                  )}
                />
              </div>
            </div>
            <div className="action">
              <Button
                variant="outline"
                style={{ height: 32, paddingLeft: 12, paddingRight: 12 }}
                onClick={() => {
                  const query = {
                    page: "opportunities",
                    matchingPanel: "review",
                  };
                  if (row.networkId) query.networkId = row.networkId;
                  router.push({
                    pathname: `/dashboard/myclasses/${row.code}`,
                    query,
                  });
                }}
              >
                {t("networkAppointmentRequests.open", {}, { default: "Review" })}
              </Button>
            </div>
          </Row>
        ))}
      </div>
    </Strip>
  );
}
