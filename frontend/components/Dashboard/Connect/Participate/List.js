import { useQuery } from "@apollo/client";
import Link from "next/link";
import styled from "styled-components";
import { Icon, Label } from "semantic-ui-react";

import { MY_PARTICIPATING_ROUNDS } from "../../../Queries/ConnectPreference";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const Header = styled.div`
  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
    color: #171717;
  }
  p {
    margin: 4px 0 0;
    color: #5f6871;
    font-size: 14px;
    max-width: 640px;
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #888;

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
`;

const Action = styled.div`
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #eef1f2;

  a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 100px;
    border: 1px solid #336f8a;
    background: #336f8a;
    color: #ffffff;
    font-family: "Nunito", sans-serif;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    text-decoration: none;
  }
`;

const Empty = styled.div`
  padding: 48px 24px;
  text-align: center;
  background: #ffffff;
  border-radius: 16px;
  color: #5f6871;
`;

const STATUS_COLORS = {
  preferences_open: "green",
  preferences_closed: "yellow",
  matching: "blue",
  published: "teal",
  archived: "grey",
};

const STATUS_LABELS = {
  preferences_open: "Preferences open",
  preferences_closed: "Preferences closed",
  matching: "Matching in progress",
  published: "Matches published",
  archived: "Archived",
};

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return null;
  }
}

export default function ParticipateList() {
  const { data, loading } = useQuery(MY_PARTICIPATING_ROUNDS, {
    fetchPolicy: "cache-and-network",
  });

  const classes = data?.authenticatedItem?.studentIn || [];
  const roundsById = new Map();
  classes.forEach((cls) => {
    (cls.networks || []).forEach((net) => {
      (net.connectRounds || []).forEach((round) => {
        roundsById.set(round.id, round);
      });
    });
  });
  const rounds = Array.from(roundsById.values()).sort((a, b) => {
    const aDate = a.openAt || a.closeAt || "";
    const bDate = b.openAt || b.closeAt || "";
    return bDate.localeCompare(aDate);
  });

  return (
    <Shell>
      <Header>
        <h1>Participate in matching</h1>
        <p>
          Pick a round you&apos;re part of, rank the opportunities, answer the
          questions, and (for team projects) nominate the people you&apos;d
          like to work with.
        </p>
      </Header>

      {loading && rounds.length === 0 && <Empty>Loading…</Empty>}

      {!loading && rounds.length === 0 && (
        <Empty>
          No matching rounds available yet. Your teacher will open one when
          ready.
        </Empty>
      )}

      <Grid>
        {rounds.map((round) => {
          const open = formatDate(round.openAt);
          const close = formatDate(round.closeAt);
          const canParticipate = round.status === "preferences_open";
          return (
            <Card key={round.id}>
              <h3>{round.title}</h3>
              <Label color={STATUS_COLORS[round.status] || "grey"} size="tiny">
                {STATUS_LABELS[round.status] || round.status}
              </Label>
              {round.description && <p>{round.description}</p>}
              <Meta>
                {round.classNetwork && (
                  <span>
                    <Icon name="sitemap" /> {round.classNetwork.title}
                  </span>
                )}
                {(open || close) && (
                  <span>
                    <Icon name="calendar outline" />
                    {open || "—"} → {close || "—"}
                  </span>
                )}
                <span>
                  <Icon name="briefcase" />
                  {round.opportunities?.length || 0} opportunit
                  {round.opportunities?.length === 1 ? "y" : "ies"}
                </span>
              </Meta>
              <Action>
                <Link
                  href={{
                    pathname: "/dashboard/connect/participate",
                    query: { round: round.id },
                  }}
                >
                  {canParticipate ? "Submit preferences" : "View round"}
                </Link>
              </Action>
            </Card>
          );
        })}
      </Grid>
    </Shell>
  );
}
