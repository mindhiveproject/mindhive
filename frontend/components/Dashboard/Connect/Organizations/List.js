import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import styled from "styled-components";
import { Icon, Dropdown } from "semantic-ui-react";

import { EXPLORE_ORGANIZATIONS_PAGED } from "../../../Queries/Organization";
import FilterBar from "../FilterBar";

const PAGE_SIZE = 12;

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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
`;

const Card = styled.a`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0px 8px 32px rgba(0, 0, 0, 0.1);
  }

  .top {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background: #eef1f2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex: none;
  }

  .logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder {
    color: #5f6871;
    font-weight: 700;
    font-size: 22px;
  }

  h3 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .where {
    color: #5f6871;
    font-size: 12px;
  }

  .mission {
    color: #5f6871;
    font-size: 13px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
    color: #888;
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid #eef1f2;

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
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

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 16px;

  button {
    padding: 8px 16px;
    border-radius: 100px;
    border: 1px solid #d3dae0;
    background: #ffffff;
    color: #336f8a;
    font-family: "Nunito", sans-serif;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .info {
    font-size: 13px;
    color: #5f6871;
  }
`;

const DOMAIN_OPTIONS = [
  { key: "academic", text: "Academic Institution", value: "academic" },
  { key: "government", text: "Government Agency", value: "government" },
  { key: "industry", text: "Industry / Start-Up", value: "industry" },
  { key: "nonprofit", text: "Nonprofit", value: "nonprofit" },
  { key: "other", text: "Other", value: "other" },
];

export default function OrganizationsList() {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState(null);
  const [page, setPage] = useState(1);

  const where = useMemo(() => {
    const conditions = [];
    if (search.trim()) {
      const q = search.trim();
      conditions.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { mission: { contains: q, mode: "insensitive" } },
          { tagline: { contains: q, mode: "insensitive" } },
        ],
      });
    }
    if (domainFilter) {
      conditions.push({ primaryDomain: { equals: domainFilter } });
    }
    return conditions.length ? { AND: conditions } : {};
  }, [search, domainFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, domainFilter]);

  const { data, loading } = useQuery(EXPLORE_ORGANIZATIONS_PAGED, {
    variables: {
      where,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    },
    fetchPolicy: "cache-and-network",
  });

  const organizations = data?.organizations || [];
  const total = data?.organizationsCount || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Shell>
      <Header>
        <h1>Organizations</h1>
        <p>
          Browse the sponsors who host opportunities on MindHive Connect — see
          their mission, the team behind them, and every project they&apos;ve
          published.
        </p>
      </Header>

      <FilterBar>
        <input
          className="search"
          placeholder="Search organizations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Dropdown
          selection
          clearable
          placeholder="All domains"
          options={DOMAIN_OPTIONS}
          value={domainFilter}
          onChange={(_, { value }) => setDomainFilter(value || null)}
        />
      </FilterBar>

      {loading && organizations.length === 0 && <Empty>Loading…</Empty>}

      {!loading && total === 0 && (
        <Empty>No organizations match the current filters.</Empty>
      )}

      {organizations.length > 0 && (
        <Grid>
          {organizations.map((org) => {
            const where =
              org.department && org.location
                ? `${org.department} · ${org.location}`
                : org.department || org.location;
            return (
              <Link
                key={org.id}
                href={{
                  pathname: "/dashboard/connect/organizations",
                  query: { org: org.id },
                }}
                passHref
                legacyBehavior
              >
                <Card>
                  <div className="top">
                    <div className="logo">
                      {org.logo?.url ? (
                        <img src={org.logo.url} alt={org.name} />
                      ) : (
                        <span className="placeholder">
                          {(org.name || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3>
                        {org.name}
                        {org.verified && (
                          <Icon
                            name="check circle"
                            style={{
                              color: "#1d6b3a",
                              fontSize: 14,
                              margin: 0,
                            }}
                            title="Verified"
                          />
                        )}
                      </h3>
                      {where && <span className="where">{where}</span>}
                    </div>
                  </div>
                  {org.tagline && (
                    <p
                      style={{
                        margin: 0,
                        color: "#171717",
                        fontSize: 13,
                        fontStyle: "italic",
                      }}
                    >
                      {org.tagline}
                    </p>
                  )}
                  {org.mission && <p className="mission">{org.mission}</p>}
                  <div className="meta">
                    <span>
                      <Icon name="briefcase" />
                      {org.opportunitiesCount} opportunit
                      {org.opportunitiesCount === 1 ? "y" : "ies"}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </Grid>
      )}

      {totalPages > 1 && (
        <Pagination>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <Icon name="chevron left" /> Previous
          </button>
          <span className="info">
            Page {page} of {totalPages} · {total} total
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next <Icon name="chevron right" />
          </button>
        </Pagination>
      )}
    </Shell>
  );
}
