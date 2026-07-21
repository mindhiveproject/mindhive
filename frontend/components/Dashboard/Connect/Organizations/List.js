import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import styled from "styled-components";
import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { EXPLORE_ORGANIZATIONS_PAGED } from "../../../Queries/Organization";
import FilterBar from "../FilterBar";
import OrganizationConnectCard from "./OrganizationConnectCard";

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
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 759px) {
    grid-template-columns: 1fr;
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
          {organizations.map((org) => (
            <OrganizationConnectCard key={org.id} org={org} />
          ))}
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
