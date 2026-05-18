import { useQuery } from "@apollo/client";
import Link from "next/link";
import styled from "styled-components";
import { Icon, Label } from "semantic-ui-react";

import { MY_CONNECT_ROUNDS } from "../../../Queries/ConnectRound";

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

  .meta {
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
  matching: "Matching",
  published: "Published",
  archived: "Archived",
};

export default function MatchesList() {
  const { data, loading } = useQuery(MY_CONNECT_ROUNDS, {
    fetchPolicy: "cache-and-network",
  });

  const rounds = data?.authenticatedItem?.connectRoundsCreated || [];

  return (
    <Shell>
      <Header>
        <h1>Matches</h1>
        <p>
          Run the matching algorithm for a round, review and adjust proposed
          matches, then publish.
        </p>
      </Header>

      {loading && rounds.length === 0 && <Empty>Loading…</Empty>}

      {!loading && rounds.length === 0 && (
        <Empty>You haven&apos;t created any matching rounds yet.</Empty>
      )}

      <Grid>
        {rounds.map((round) => (
          <Card key={round.id}>
            <h3>{round.title}</h3>
            <Label color={STATUS_COLORS[round.status] || "grey"} size="tiny">
              {STATUS_LABELS[round.status] || round.status}
            </Label>
            <div className="meta">
              {round.classNetwork && (
                <span>
                  <Icon name="sitemap" /> {round.classNetwork.title}
                </span>
              )}
              <span>
                <Icon name="briefcase" />
                {round.opportunities?.length || 0} opportunit
                {round.opportunities?.length === 1 ? "y" : "ies"}
              </span>
            </div>
            <Action>
              <Link
                href={{
                  pathname: "/dashboard/connect/matches",
                  query: { round: round.id },
                }}
              >
                Manage matches
              </Link>
            </Action>
          </Card>
        ))}
      </Grid>
    </Shell>
  );
}
