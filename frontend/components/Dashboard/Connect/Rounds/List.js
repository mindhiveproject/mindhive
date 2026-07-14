import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import Link from "next/link";
import styled from "styled-components";
import { Icon, Label, Dropdown } from "semantic-ui-react";

import { MY_CONNECT_ROUNDS } from "../../../Queries/ConnectRound";
import { DELETE_CONNECT_ROUND } from "../../../Mutations/ConnectRound";
import FilterBar from "../FilterBar";
import Button from "../../../DesignSystem/Button";

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

  p {
    margin: 4px 0 0;
    color: #5f6871;
    font-size: 14px;
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

const CardMeta = styled.div`
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

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #eef1f2;

  a,
  button {
    flex: 1;
    padding: 8px 12px;
    border-radius: 100px;
    border: 1px solid #d3dae0;
    background: #ffffff;
    color: #336f8a;
    font-family: "Inter", sans-serif;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    text-align: center;
    text-decoration: none;
  }

  button.danger {
    border-color: #e8c4c4;
    color: #b3261e;
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
  draft: "grey",
  preferences_open: "green",
  preferences_closed: "yellow",
  matching: "blue",
  published: "teal",
  archived: "grey",
};

const STATUS_LABELS = {
  draft: "Draft",
  preferences_open: "Preferences open",
  preferences_closed: "Preferences closed",
  matching: "Matching",
  published: "Published",
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

export default function RoundsList() {
  const { data, loading, refetch } = useQuery(MY_CONNECT_ROUNDS, {
    fetchPolicy: "cache-and-network",
  });
  const [deleteConnectRound] = useMutation(DELETE_CONNECT_ROUND);

  const rounds = data?.authenticatedItem?.connectRoundsCreated || [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [networkFilter, setNetworkFilter] = useState(null);

  const networkOptions = useMemo(() => {
    const seen = new Map();
    rounds.forEach((r) => {
      if (r.classNetwork?.id && !seen.has(r.classNetwork.id)) {
        seen.set(r.classNetwork.id, r.classNetwork);
      }
    });
    return Array.from(seen.values()).map((n) => ({
      key: n.id,
      text: n.title,
      value: n.id,
    }));
  }, [rounds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rounds.filter((r) => {
      if (q && !(r.title || "").toLowerCase().includes(q)) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (networkFilter && r.classNetwork?.id !== networkFilter) return false;
      return true;
    });
  }, [rounds, search, statusFilter, networkFilter]);

  const handleDelete = async (id) => {
    if (
      !window.confirm("Delete this round? This cannot be undone.")
    ) {
      return;
    }
    await deleteConnectRound({ variables: { id } });
    refetch();
  };

  return (
    <Shell>
      <TopBar>
        <div>
          <h1>Matching rounds</h1>
          <p>
            Open a round for your class network, curate opportunities, and run
            the matching when preferences close.
          </p>
        </div>
        <Link
          href={{
            pathname: "/dashboard/connect/rounds",
            query: { round: "new" },
          }}
        >
          <Button type="button" variant="filled">
            New round
          </Button>
        </Link>
      </TopBar>

      {rounds.length > 0 && (
        <FilterBar>
          <input
            className="search"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Dropdown
            selection
            clearable
            placeholder="All statuses"
            options={Object.entries(STATUS_LABELS).map(([value, text]) => ({
              key: value,
              text,
              value,
            }))}
            value={statusFilter}
            onChange={(_, { value }) => setStatusFilter(value || null)}
          />
          {networkOptions.length > 0 && (
            <Dropdown
              selection
              clearable
              search
              placeholder="All networks"
              options={networkOptions}
              value={networkFilter}
              onChange={(_, { value }) => setNetworkFilter(value || null)}
            />
          )}
        </FilterBar>
      )}

      {loading && rounds.length === 0 && <Empty>Loading…</Empty>}

      {!loading && rounds.length === 0 && (
        <Empty>
          You haven&apos;t opened any matching rounds yet. Click{" "}
          <strong>New round</strong> to start one for a class network.
        </Empty>
      )}

      {!loading && rounds.length > 0 && filtered.length === 0 && (
        <Empty>No rounds match the current filters.</Empty>
      )}

      <Grid>
        {filtered.map((round) => {
          const open = formatDate(round.openAt);
          const close = formatDate(round.closeAt);
          return (
            <Card key={round.id}>
              <h3>{round.title}</h3>
              <Label color={STATUS_COLORS[round.status] || "grey"} size="tiny">
                {STATUS_LABELS[round.status] || round.status}
              </Label>
              {round.description && <p>{round.description}</p>}
              <CardMeta>
                {round.classNetwork && (
                  <span>
                    <Icon name="sitemap" />
                    {round.classNetwork.title}
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
              </CardMeta>
              <CardActions>
                <Link
                  href={{
                    pathname: "/dashboard/connect/rounds",
                    query: { round: round.id },
                  }}
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="danger"
                  onClick={() => handleDelete(round.id)}
                >
                  Delete
                </button>
              </CardActions>
            </Card>
          );
        })}
      </Grid>
    </Shell>
  );
}
