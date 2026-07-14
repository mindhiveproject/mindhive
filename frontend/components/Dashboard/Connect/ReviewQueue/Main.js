// Review queue — surface for users assigned as a reviewer on one or
// more ConnectRounds. Lists every round they're on with its
// opportunities grouped by status. Click an opportunity to enter the
// review-mode view (R4).
import { useMemo } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import styled from "styled-components";

import { MY_REVIEW_QUEUE } from "../../../Queries/ConnectRound";
import RoleGuard from "../RoleGuard";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
    color: #171717;
  }

  p.intro {
    margin: 0;
    color: #5f6871;
    font-size: 14px;
    max-width: 720px;
  }
`;

const RoundCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
  }

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 20px;
    color: #171717;
  }

  .round-meta {
    color: #5f6871;
    font-size: 13px;
    margin-top: 4px;
  }

  .status-pill {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 100px;
    background: #eef5f9;
    color: #336f8a;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
`;

const StatusGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  h3 {
    margin: 0;
    font-family: "Inter", sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: #5f6871;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
`;

const OppList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
`;

const OppCard = styled.button`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #d3dae0;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  font-family: inherit;

  &:hover {
    border-color: #336f8a;
    box-shadow: 0px 4px 16px rgba(51, 111, 138, 0.08);
  }

  .opp-title {
    font-weight: 600;
    color: #171717;
    font-size: 14px;
    line-height: 1.3;
  }

  .opp-short {
    color: #5f6871;
    font-size: 13px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .opp-meta {
    color: #888;
    font-size: 12px;
    margin-top: auto;
  }
`;

const Empty = styled.div`
  padding: 48px 24px;
  text-align: center;
  background: #ffffff;
  border-radius: 16px;
  color: #5f6871;
`;

const STATUS_ORDER = [
  "pending_review",
  "pre_selected",
  "accepted",
  "published",
  "closed",
  "draft",
  "archived",
];

const STATUS_LABEL = {
  pending_review: "Pending review",
  pre_selected: "Pre-selected",
  accepted: "Accepted",
  published: "Published",
  closed: "Closed",
  draft: "Draft",
  archived: "Archived",
};

function mentorName(p) {
  if (!p) return "";
  return (
    `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
    p.username ||
    ""
  );
}

function groupByStatus(opportunities) {
  const map = new Map();
  for (const status of STATUS_ORDER) map.set(status, []);
  for (const opp of opportunities || []) {
    const bucket = map.has(opp.status) ? opp.status : "draft";
    map.get(bucket).push(opp);
  }
  return Array.from(map.entries()).filter(([, opps]) => opps.length > 0);
}

function ReviewQueueInner() {
  const router = useRouter();
  const { data, loading, error } = useQuery(MY_REVIEW_QUEUE, {
    fetchPolicy: "cache-and-network",
  });

  const rounds = useMemo(
    () => data?.authenticatedItem?.connectRoundsReviewing || [],
    [data]
  );

  const openOpportunity = (oppId, roundId) => {
    router.push({
      pathname: "/dashboard/connect/review",
      query: { op: oppId, round: roundId },
    });
  };

  if (loading && rounds.length === 0) {
    return (
      <Shell>
        <h1>Review queue</h1>
        <p>Loading…</p>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <h1>Review queue</h1>
        <p style={{ color: "#871b16" }}>
          Couldn't load your review queue: {error.message}
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1>Review queue</h1>
      <p className="intro">
        Rounds you've been assigned to oversee. Click any opportunity to
        review its details, leave notes, and change its status.
      </p>

      {rounds.length === 0 ? (
        <Empty>
          You're not assigned as a reviewer on any rounds yet. Ask a round
          creator (teacher) to add your email to their round's Reviewers
          panel.
        </Empty>
      ) : null}

      {rounds.map((round) => {
        const groups = groupByStatus(round.opportunities);
        const totalOpps = (round.opportunities || []).length;
        return (
          <RoundCard key={round.id}>
            <header>
              <div>
                <h2>{round.title}</h2>
                <div className="round-meta">
                  {round.classNetwork?.title
                    ? `${round.classNetwork.title} · `
                    : ""}
                  Created by {mentorName(round.createdBy) || "unknown"} ·{" "}
                  {totalOpps} opportunit{totalOpps === 1 ? "y" : "ies"}
                </div>
              </div>
              <span className="status-pill">{round.status}</span>
            </header>

            {totalOpps === 0 ? (
              <p style={{ color: "#5f6871", fontSize: 13, margin: 0 }}>
                No opportunities in this round yet.
              </p>
            ) : null}

            {groups.map(([status, opps]) => (
              <StatusGroup key={status}>
                <h3>
                  {STATUS_LABEL[status] || status} ({opps.length})
                </h3>
                <OppList>
                  {opps.map((opp) => (
                    <OppCard
                      key={opp.id}
                      type="button"
                      onClick={() => openOpportunity(opp.id, round.id)}
                    >
                      <span className="opp-title">{opp.title}</span>
                      {opp.shortDescription ? (
                        <span className="opp-short">{opp.shortDescription}</span>
                      ) : null}
                      <span className="opp-meta">
                        {opp.organization?.name
                          ? `${opp.organization.name}`
                          : ""}
                        {opp.mentor
                          ? `${opp.organization?.name ? " · " : ""}${mentorName(opp.mentor)}`
                          : ""}
                      </span>
                    </OppCard>
                  ))}
                </OppList>
              </StatusGroup>
            ))}
          </RoundCard>
        );
      })}
    </Shell>
  );
}

// Reviewers can come from any base role (teacher / scientist / sponsor /
// mentor / student) — assignment is per-round, not role-based. So no
// role gating here; the empty state handles "user with zero rounds".
// We just require a signed-in account.
export default function ReviewQueueMain() {
  return (
    <RoleGuard
      allow={["student", "mentor", "teacher", "scientist", "admin"]}
    >
      <ReviewQueueInner />
    </RoleGuard>
  );
}
