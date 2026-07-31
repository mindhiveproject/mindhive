import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../../../DesignSystem/Button";
import { EXPLORE_ORGANIZATIONS_PAGED } from "../../../Queries/Organization";
import {
  manageOrganizationHref,
  profileEditHref,
} from "../../../../lib/profileEditNavigation";
import FilterBar from "../FilterBar";
import OrganizationConnectCard from "./OrganizationConnectCard";

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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 24px;
  text-align: center;
  background: #ffffff;
  border-radius: 16px;
  color: #5f6871;

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 22px;
    color: #171717;
  }

  p {
    margin: 0;
    max-width: 480px;
    font-size: 14px;
  }
`;

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: center;
`;

export default function ManageOrganizationsList({ user }) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const [search, setSearch] = useState("");

  const adminIds = useMemo(
    () =>
      (user?.adminOfOrganizations || [])
        .map((org) => org?.id)
        .filter(Boolean),
    [user?.adminOfOrganizations],
  );

  const where = useMemo(() => {
    if (adminIds.length === 0) {
      return { id: { in: ["__none__"] } };
    }
    const conditions = [{ id: { in: adminIds } }];
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
    return { AND: conditions };
  }, [adminIds, search]);

  const { data, loading } = useQuery(EXPLORE_ORGANIZATIONS_PAGED, {
    variables: {
      where,
      take: Math.max(adminIds.length, 1),
      skip: 0,
    },
    skip: adminIds.length === 0,
    fetchPolicy: "cache-and-network",
  });

  const organizations = data?.organizations || [];

  if (adminIds.length === 0) {
    return (
      <Shell>
        <Header>
          <h1>
            {t("manageOrganization.list.pageTitle", {}, {
              default: "Manage organizations",
            })}
          </h1>
        </Header>
        <Empty>
          <h2>
            {t("manageOrganization.emptyTitle", {}, {
              default: "No organization to manage",
            })}
          </h2>
          <p>
            {t("manageOrganization.emptyDescription", {}, {
              default:
                "Set up your sponsor organization first. After that, you can manage its public profile and people here.",
            })}
          </p>
          <ActionsRow>
            <DesignSystemButton
              variant="filled"
              type="button"
              onClick={() =>
                router.push(
                  profileEditHref({ page: "about", type: "organization" }),
                )
              }
            >
              {t("manageOrganization.setupCta", {}, {
                default: "Set up organization",
              })}
            </DesignSystemButton>
            <DesignSystemButton
              variant="outline"
              type="button"
              onClick={() => router.push("/dashboard/connect/organizations")}
            >
              {t("manageOrganization.browseCta", {}, {
                default: "Browse organizations",
              })}
            </DesignSystemButton>
          </ActionsRow>
        </Empty>
      </Shell>
    );
  }

  return (
    <Shell>
      <Header>
        <h1>
          {t("manageOrganization.list.pageTitle", {}, {
            default: "Manage organizations",
          })}
        </h1>
        <p>
          {t("manageOrganization.list.description", {}, {
            default:
              "Choose an organization you administer to edit its public profile and manage people.",
          })}
        </p>
      </Header>

      <FilterBar>
        <input
          className="search"
          type="search"
          placeholder={t("manageOrganization.list.searchPlaceholder", {}, {
            default: "Search your organizations…",
          })}
          aria-label={t("manageOrganization.list.searchLabel", {}, {
            default: "Search your organizations",
          })}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </FilterBar>

      {loading && organizations.length === 0 && (
        <Empty>
          <p>
            {t("manageOrganization.list.loading", {}, {
              default: "Loading…",
            })}
          </p>
        </Empty>
      )}

      {!loading && organizations.length === 0 && (
        <Empty>
          <p>
            {t("manageOrganization.list.emptyFiltered", {}, {
              default: "No organizations match your search.",
            })}
          </p>
        </Empty>
      )}

      {organizations.length > 0 && (
        <Grid>
          {organizations.map((org) => (
            <OrganizationConnectCard
              key={org.id}
              org={org}
              href={manageOrganizationHref(org.id)}
              linkLabel={t(
                "manageOrganization.list.manageOrganization",
                { name: org.name || "" },
                { default: "Manage {{name}}" },
              )}
            />
          ))}
        </Grid>
      )}
    </Shell>
  );
}
