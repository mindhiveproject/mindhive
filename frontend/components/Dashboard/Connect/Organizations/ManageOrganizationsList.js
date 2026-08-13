import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../../../DesignSystem/Button";
import Modal from "../../../DesignSystem/Modal";
import { EXPLORE_ORGANIZATIONS_PAGED } from "../../../Queries/Organization";
import { manageOrganizationHref } from "../../../../lib/profileEditNavigation";
import { BrowseCardsGrid } from "../ConnectBrowseLayout";
import FilterBar from "../FilterBar";
import OrganizationConnectCard from "./OrganizationConnectCard";
import CreateOrganizationForm from "./CreateOrganizationForm";

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
    font-family: "Inter", sans-serif;
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

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 24px;
  text-align: center;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #E6E6E6;
  color: #5f6871;

  h2 {
    margin: 0;
    font-family: "Inter", sans-serif;
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
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (router.query?.create === "1") {
      setShowCreate(true);
    }
  }, [router.query?.create]);

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

  const closeCreate = () => {
    setShowCreate(false);
    if (router.query?.create === "1") {
      router.replace("/dashboard/connect/manage-organization", undefined, {
        shallow: true,
      });
    }
  };

  const createModal = (
    <Modal
      open={showCreate}
      onClose={closeCreate}
      size="large"
      title={t("manageOrganization.create.title", {}, {
        default: "Create organization",
      })}
    >
      <CreateOrganizationForm
        user={user}
        onCancel={closeCreate}
        showHeader={false}
        embedded
      />
    </Modal>
  );

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
              onClick={() => setShowCreate(true)}
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
        {createModal}
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

      <ActionsRow style={{ justifyContent: "flex-start" }}>
        <DesignSystemButton
          variant="tonal"
          type="button"
          onClick={() => setShowCreate(true)}
        >
          {t("manageOrganization.setupCta", {}, {
            default: "Set up organization",
          })}
        </DesignSystemButton>
      </ActionsRow>

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
        <BrowseCardsGrid>
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
        </BrowseCardsGrid>
      )}
      {createModal}
    </Shell>
  );
}
