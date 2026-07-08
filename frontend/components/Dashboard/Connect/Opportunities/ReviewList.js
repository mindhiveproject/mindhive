import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import { Label } from "semantic-ui-react";

import {
  EXPLORE_CONTEXT,
  PENDING_OPPORTUNITIES_FOR_REVIEW,
} from "../../../Queries/Opportunity";
import { deriveRoles } from "../useConnectRole";

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

const Grid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  h3 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
  }

  p {
    margin: 0;
    color: #5f6871;
    font-size: 14px;
    line-height: 20px;
  }
`;

const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #888;
`;

const CardActions = styled.div`
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #eef1f2;

  a {
    display: block;
    padding: 8px 12px;
    border-radius: 100px;
    border: 1px solid #d3dae0;
    background: #ffffff;
    color: #336f8a;
    font-family: "Nunito", sans-serif;
    font-weight: 600;
    font-size: 13px;
    text-align: center;
    text-decoration: none;

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
`;

const CATEGORY_LABELS = {
  urban_health: "Urban Health",
  urban_environment: "Urban Environment",
  urban_infrastructure: "Urban Infrastructure",
  other: "Other",
};

const STATUS_COLORS = {
  pending_review: "yellow",
  pre_selected: "orange",
  accepted: "olive",
};

const REVIEW_STATUS_LABELS = {
  pending_review: "Submitted for review",
  pre_selected: "Pre-selected",
  accepted: "Accepted",
};

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return null;
  }
}

function sponsorName(mentor, t) {
  if (!mentor) {
    return t("myOpportunitiesList.unknownSponsor", {}, { default: "Unknown" });
  }
  const full = [mentor.firstName, mentor.lastName].filter(Boolean).join(" ");
  return (
    full ||
    mentor.username ||
    t("myOpportunitiesList.unknownSponsor", {}, { default: "Unknown" })
  );
}

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

      <Grid>
        {opportunities.map((opportunity) => {
          const category =
            opportunity.projectCategory === "other"
              ? opportunity.projectCategoryOther || CATEGORY_LABELS.other
              : CATEGORY_LABELS[opportunity.projectCategory] ||
                opportunity.projectCategory;
          return (
            <Card key={opportunity.id}>
              <h3>{opportunity.title}</h3>
              <Label
                color={STATUS_COLORS[opportunity.status] || "grey"}
                size="tiny"
              >
                {REVIEW_STATUS_LABELS[opportunity.status] ||
                  t(`opportunityEditor.statusOptions.${opportunity.status}`, {}, {
                    default: opportunity.status,
                  })}
              </Label>
              {opportunity.shortDescription && (
                <p>{opportunity.shortDescription}</p>
              )}
              <CardMeta>
                {category && <span>{category}</span>}
                <span>
                  {t("opportunityEditor.review.sponsorLabel", {}, {
                    default: "Sponsor",
                  })}
                  : {sponsorName(opportunity.mentor, t)}
                </span>
                {opportunity.organization?.name && (
                  <span>{opportunity.organization.name}</span>
                )}
                {formatDate(opportunity.updatedAt) && (
                  <span>
                    {t("opportunityEditor.review.submittedLabel", {}, {
                      default: "Submitted",
                    })}
                    : {formatDate(opportunity.updatedAt)}
                  </span>
                )}
              </CardMeta>
              <CardActions>
                <Link
                  href={{
                    pathname: "/dashboard/connect/opportunities",
                    query: { op: opportunity.id, review: "1" },
                  }}
                >
                  {t("opportunityEditor.review.reviewButton", {}, {
                    default: "Review",
                  })}
                </Link>
              </CardActions>
            </Card>
          );
        })}
      </Grid>
    </Shell>
  );
}
