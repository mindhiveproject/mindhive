import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import Link from "next/link";
import styled from "styled-components";
import { Icon, Label, Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { MY_OPPORTUNITIES } from "../../../Queries/Opportunity";
import { DELETE_OPPORTUNITY } from "../../../Mutations/Opportunity";
import FilterBar from "../FilterBar";
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

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 100px;
  border: none;
  background: #336f8a;
  color: #ffffff;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;

  &:hover {
    background: #244f63;
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
    font-family: "Nunito", sans-serif;
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
  pending_review: "yellow",
  pre_selected: "orange",
  accepted: "olive",
  published: "green",
  closed: "blue",
  archived: "black",
};

const STATUS_LABELS = {
  draft: "Draft",
  pending_review: "Pending Review",
  pre_selected: "Pre-selected",
  accepted: "Accepted",
  published: "Published",
  closed: "Closed",
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
  }
`;

export default function OpportunitiesList({ user }) {
  const { t } = useTranslation("connect");
  const { isTeacher, isAdmin } = deriveRoles(user);
  const showReviewTab = isTeacher || isAdmin;
  const { data, loading, refetch } = useQuery(MY_OPPORTUNITIES, {
    fetchPolicy: "cache-and-network",
  });
  const [deleteOpportunity] = useMutation(DELETE_OPPORTUNITY);

  const opportunities = data?.authenticatedItem?.opportunitiesCreated || [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [networkFilter, setNetworkFilter] = useState(null);

  const networkOptions = useMemo(() => {
    const seen = new Map();
    opportunities.forEach((o) => {
      (o.classNetworks || []).forEach((n) => {
        if (n?.id && !seen.has(n.id)) seen.set(n.id, n);
      });
    });
    return Array.from(seen.values()).map((n) => ({
      key: n.id,
      text: n.title,
      value: n.id,
    }));
  }, [opportunities]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return opportunities.filter((o) => {
      if (q && !(o.title || "").toLowerCase().includes(q)) return false;
      if (statusFilter && o.status !== statusFilter) return false;
      if (
        networkFilter &&
        !(o.classNetworks || []).some((n) => n.id === networkFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [opportunities, search, statusFilter, networkFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this opportunity? This cannot be undone.")) {
      return;
    }
    await deleteOpportunity({ variables: { id } });
    refetch();
  };

  return (
    <Shell>
      <TopBar>
        <h1>My Opportunities</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {showReviewTab && (
            <TabRow>
              <Link href="/dashboard/connect/opportunities" className="active">
                {t("opportunityEditor.listTabs.mine", {}, {
                  default: "My opportunities",
                })}
              </Link>
              <Link href="/dashboard/connect/opportunities?tab=review">
                {t("opportunityEditor.listTabs.review", {}, {
                  default: "Review queue",
                })}
              </Link>
            </TabRow>
          )}
          <Link
            href={{
              pathname: "/dashboard/connect/opportunities",
              query: { op: "new" },
            }}
          >
            <PrimaryButton type="button">
              <Icon name="plus" />
              New opportunity
            </PrimaryButton>
          </Link>
        </div>
      </TopBar>

      {opportunities.length > 0 && (
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

      {loading && opportunities.length === 0 && <Empty>Loading…</Empty>}

      {!loading && opportunities.length === 0 && (
        <Empty>
          You haven&apos;t created any opportunities yet. Click{" "}
          <strong>New opportunity</strong> to publish your first project for
          students.
        </Empty>
      )}

      {!loading && opportunities.length > 0 && filtered.length === 0 && (
        <Empty>No opportunities match the current filters.</Empty>
      )}

      <Grid>
        {filtered.map((opportunity) => {
          const from = formatDate(opportunity.availableFrom);
          const to = formatDate(opportunity.availableTo);
          const coverSrc =
            opportunity.coverImage?.url || opportunity.coverImageUrl || null;
          return (
            <Card key={opportunity.id}>
              {coverSrc && (
                <div
                  style={{
                    margin: "-20px -20px 12px",
                    height: 120,
                    overflow: "hidden",
                    borderRadius: "16px 16px 0 0",
                    background: `url(${coverSrc}) center/cover no-repeat #eef1f2`,
                  }}
                />
              )}
              <h3>{opportunity.title}</h3>
              <Label
                color={STATUS_COLORS[opportunity.status] || "grey"}
                size="tiny"
              >
                {STATUS_LABELS[opportunity.status] || opportunity.status}
              </Label>
              {opportunity.shortDescription && (
                <p>{opportunity.shortDescription}</p>
              )}
              <CardMeta>
                {(from || to) && (
                  <span>
                    <Icon name="calendar outline" />
                    {from || "—"} → {to || "—"}
                  </span>
                )}
                <span>
                  <Icon name="users" />
                  Capacity {opportunity.studentCapacity ?? 1}
                </span>
                {opportunity.teamSize > 1 && (
                  <span>
                    <Icon name="group" />
                    Team of {opportunity.teamSize}
                  </span>
                )}
                {opportunity.classNetworks?.length > 0 && (
                  <span>
                    <Icon name="sitemap" />
                    {opportunity.classNetworks.length} network
                    {opportunity.classNetworks.length === 1 ? "" : "s"}
                  </span>
                )}
                {opportunity.publicRatingCount > 0 && (
                  <span>
                    <span style={{ color: "#f5b800" }}>★</span>
                    {opportunity.publicRatingAverage?.toFixed(1)} ·{" "}
                    {opportunity.publicRatingCount} rating
                    {opportunity.publicRatingCount === 1 ? "" : "s"}
                  </span>
                )}
              </CardMeta>
              <CardActions>
                <Link
                  href={{
                    pathname: "/dashboard/connect/opportunities",
                    query: { op: opportunity.id },
                  }}
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="danger"
                  onClick={() => handleDelete(opportunity.id)}
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
