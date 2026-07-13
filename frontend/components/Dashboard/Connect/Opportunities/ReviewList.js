import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import {
  EXPLORE_CONTEXT,
  PENDING_OPPORTUNITIES_FOR_REVIEW,
} from "../../../Queries/Opportunity";
import { deriveRoles } from "../useConnectRole";
import OpportunityCompactCard, {
  buildReviewOpportunityMetaLine,
  OpportunityCompactGrid,
  OpportunityListSection,
} from "./OpportunityCompactCard";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
    color: #171717;
  }
`;

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  a {
    padding: 8px 16px;
    border-radius: 100px;
    border: 1px solid #d3dae0;
    background: #ffffff;
    color: #336f8a;
    font-family: "Nunito", sans-serif;
    font-weight: 600;
    font-size: 14px;
    text-decoration: none;

    &.active {
      background: #336f8a;
      color: #ffffff;
      border-color: #336f8a;
    }

    &:focus-visible {
      outline: 2px solid #336f8a;
      outline-offset: 2px;
    }
  }
`;

const Empty = styled.div`
  padding: 48px 24px;
  text-align: center;
  background: #ffffff;
  border-radius: 16px;
  color: #5f6871;
  font-family: "Inter", sans-serif;
`;

const REVIEW_STATUS_KEYS = {
  pending_review: "pendingReview",
  returned: "returned",
  pre_selected: "preSelected",
  accepted: "accepted",
};

const REVIEW_STATUS_DEFAULTS = {
  pending_review: "Submitted for review",
  returned: "Returned",
  pre_selected: "Pre-selected",
  accepted: "Accepted",
};

function collectReviewerNetworkIds(me) {
  const ids = new Set();
  const groups = [me?.studentIn || [], me?.mentorIn || [], me?.teacherIn || []];
  groups.forEach((classes) => {
    classes.forEach((cls) => {
      (cls.networks || []).forEach((network) => {
        if (network?.id) ids.add(network.id);
      });
    });
  });
  return ids;
}

export default function ReviewList({ user }) {
  const { t } = useTranslation("connect");
  const { isAdmin } = deriveRoles(user);
  const { data, loading } = useQuery(PENDING_OPPORTUNITIES_FOR_REVIEW, {
    fetchPolicy: "cache-and-network",
  });
  const { data: ctxData } = useQuery(EXPLORE_CONTEXT, {
    fetchPolicy: "cache-and-network",
  });

  const reviewerNetworkIds = useMemo(
    () => collectReviewerNetworkIds(ctxData?.authenticatedItem),
    [ctxData],
  );

  const opportunities = useMemo(() => {
    const all = data?.opportunities || [];
    if (isAdmin) return all;
    return all.filter((opportunity) => {
      const oppNetworkIds = (opportunity.classNetworks || []).map((n) => n.id);
      if (oppNetworkIds.length === 0) return false;
      return oppNetworkIds.some((id) => reviewerNetworkIds.has(id));
    });
  }, [data, isAdmin, reviewerNetworkIds]);

  const statusLabel = (status) => {
    const key = REVIEW_STATUS_KEYS[status];
    if (key) {
      return t(`myOpportunitiesList.status.${key}`, {}, {
        default: REVIEW_STATUS_DEFAULTS[status] || status,
      });
    }
    return t(`opportunityEditor.statusOptions.${status}`, {}, {
      default: status,
    });
  };

  return (
    <Shell>
      <TopBar>
        <h1>
          {t("opportunityEditor.review.pageTitle", {}, {
            default: "Review opportunities",
          })}
        </h1>
        <TabRow role="tablist">
          <Link
            href="/dashboard/connect/opportunities"
            role="tab"
          >
            {t("opportunityEditor.listTabs.mine", {}, {
              default: "My opportunities",
            })}
          </Link>
          <Link
            href="/dashboard/connect/opportunities?tab=review"
            className="active"
            role="tab"
            aria-current="page"
          >
            {t("opportunityEditor.listTabs.review", {}, {
              default: "Review queue",
            })}
          </Link>
        </TabRow>
      </TopBar>

      <OpportunityListSection>
        {loading && opportunities.length === 0 && (
          <Empty>
            {t("opportunityEditor.loading", {}, { default: "Loading…" })}
          </Empty>
        )}

        {!loading && opportunities.length === 0 && (
          <Empty>
            {t("opportunityEditor.review.empty", {}, {
              default: "No opportunities are waiting for review.",
            })}
          </Empty>
        )}

        {opportunities.length > 0 && (
          <OpportunityCompactGrid>
            {opportunities.map((opportunity) => (
              <OpportunityCompactCard
                key={opportunity.id}
                title={opportunity.title}
                status={opportunity.status}
                statusLabel={statusLabel(opportunity.status)}
                metaLine={buildReviewOpportunityMetaLine(opportunity, t)}
                reviewHref={{
                  pathname: "/dashboard/connect/opportunities",
                  query: { op: opportunity.id, review: "1" },
                }}
                reviewLabel={t("opportunityEditor.review.reviewButton", {}, {
                  default: "Review",
                })}
              />
            ))}
          </OpportunityCompactGrid>
        )}
      </OpportunityListSection>
    </Shell>
  );
}
