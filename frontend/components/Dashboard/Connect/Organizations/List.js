import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import styled from "styled-components";
import { Icon, Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { EXPLORE_ORGANIZATIONS_PAGED } from "../../../Queries/Organization";
import FilterBar from "../FilterBar";

const PAGE_SIZE = 12;

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px clamp(16px, 6vw, 64px);
  padding-top: 0px;
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

  &:focus-visible {
    outline: 2px solid #336f8a;
    outline-offset: 2px;
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

const Pagination = styled.nav`
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
    font-family: "Inter", sans-serif;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: 2px solid #336f8a;
      outline-offset: 2px;
    }
  }

  .info {
    font-size: 13px;
    color: #5f6871;
  }
`;

const DOMAIN_KEYS = [
  "academic",
  "government",
  "industry",
  "nonprofit",
  "other",
];

function VerifiedBadge({ t }) {
  return (
    <span
      role="img"
      aria-label={t("a11y.verified", {}, { default: "Verified" })}
      style={{ display: "inline-flex", lineHeight: 0 }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="#1d6b3a"
        aria-hidden
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    </span>
  );
}

function DecorativeIcon({ name }) {
  return <Icon name={name} aria-hidden />;
}

export default function OrganizationsList() {
  const { t } = useTranslation("connect");
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState(null);
  const [page, setPage] = useState(1);

  const domainOptions = useMemo(
    () =>
      DOMAIN_KEYS.map((value) => ({
        key: value,
        text: t(`organizationsList.domains.${value}`, {}, {
          default: value,
        }),
        value,
      })),
    [t]
  );

  const where = useMemo(() => {
    const conditions = [{ verified: { equals: true } }];
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
    return { AND: conditions };
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
        <h1>
          {t("organizationsList.pageTitle", {}, { default: "Organizations" })}
        </h1>
        <p>
          {t("organizationsList.description", {}, {
            default:
              "Browse the sponsors who host opportunities on MindHive Connect — see their mission, the team behind them, and every project they've published.",
          })}
        </p>
      </Header>

      <FilterBar>
        <input
          className="search"
          type="search"
          placeholder={t("organizationsList.searchPlaceholder", {}, {
            default: "Search organizations…",
          })}
          aria-label={t("organizationsList.searchLabel", {}, {
            default: "Search organizations",
          })}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Dropdown
          selection
          clearable
          placeholder={t("organizationsList.domainFilterPlaceholder", {}, {
            default: "All domains",
          })}
          aria-label={t("organizationsList.domainFilterLabel", {}, {
            default: "Filter by domain",
          })}
          options={domainOptions}
          value={domainFilter}
          onChange={(_, { value }) => setDomainFilter(value || null)}
        />
      </FilterBar>

      {loading && organizations.length === 0 && (
        <Empty>
          {t("organizationsList.loading", {}, { default: "Loading…" })}
        </Empty>
      )}

      {!loading && total === 0 && (
        <Empty>
          {t("organizationsList.emptyFiltered", {}, {
            default: "No organizations match the current filters.",
          })}
        </Empty>
      )}

      {organizations.length > 0 && (
        <Grid>
          {organizations.map((org) => {
            const locationLabel =
              org.department && org.location
                ? `${org.department} · ${org.location}`
                : org.department || org.location;
            const oppCount = org.opportunitiesCount || 0;
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
                        <img src={org.logo.url} alt="" />
                      ) : (
                        <span className="placeholder" aria-hidden>
                          {(org.name || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3>
                        {org.name}
                        {org.verified && <VerifiedBadge t={t} />}
                      </h3>
                      {locationLabel && (
                        <span className="where">{locationLabel}</span>
                      )}
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
                      <DecorativeIcon name="briefcase" />
                      {oppCount === 1
                        ? t(
                            "organizationsList.opportunityCount.one",
                            { count: oppCount },
                            { default: "{{count}} opportunity" }
                          )
                        : t(
                            "organizationsList.opportunityCount.many",
                            { count: oppCount },
                            { default: "{{count}} opportunities" }
                          )}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </Grid>
      )}

      {totalPages > 1 && (
        <Pagination
          aria-label={t("organizationsList.paginationLabel", {}, {
            default: "Organizations pagination",
          })}
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("organizationsList.previous", {}, { default: "Previous" })}
          </button>
          <span className="info">
            {t("organizationsList.paginationInfo", {
              page,
              totalPages,
              total,
            }, {
              default: "Page {{page}} of {{totalPages}} · {{total}} total",
            })}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("organizationsList.next", {}, { default: "Next" })}
          </button>
        </Pagination>
      )}
    </Shell>
  );
}
