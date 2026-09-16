import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import AddResource from "./AddResource";
import ViewResource from "./ViewResource";
import CopyResource from "./CopyResource";
import EditResource from "./EditResource";
import DuplicateResource from "./DuplicateResource";
import ShareCollaborators from "./ShareCollaborators";
import MyResourcesList from "./MyResourcesList";
import PublicResourcesList from "./PublicResourcesList";
import ResourcePreviewModal from "./ResourcePreviewModal";

import StyledResource from "../../styles/StyledResource";
import Button from "../../DesignSystem/Button";
import ButtonGroup from "../../DesignSystem/ButtonGroup";
import { NavbarItem, SectionNavbar } from "../../DesignSystem/Navbar";
import { AddIcon } from "../../DesignSystem/Icons";

import useTranslation from "next-translate/useTranslation";

export default function ResourcesMain({ query, user }) {
  const { selector } = query;
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [previewId, setPreviewId] = useState(null);
  const [shareId, setShareId] = useState(null);
  const { t } = useTranslation("classes");

  const isPublicTab = selector === "public";

  // Hide header for action routes, but show for 'public' and overview
  const isActionRoute =
    ["add", "copy", "duplicate", "view"].includes(selector) ||
    (selector && selector !== "public");

  const goBack = () => {
    window.location.href = "/dashboard/resources";
  };

  useEffect(() => {
    if (isPublicTab && filter === "public") {
      setFilter("all");
    }
  }, [isPublicTab, filter]);

  const filterItems = [
    {
      value: "all",
      label: t("boardManagement.filter.all"),
    },
    {
      value: "public",
      label: t("boardManagement.filter.publicOnly"),
    },
  ];

  return (
    <StyledResource>
      {!isActionRoute && (
        <>
          <h1>{t("boardManagement.resourceCenterTitle")}</h1>
          <p>{t("boardManagement.resourceCenterDescription")}</p>
          <div className="header">
            <SectionNavbar
              variant="underline"
              showRule
              gapless
              aria-label={t("boardManagement.resourceCenterTitle")}
            >
              <NavbarItem
                as={Link}
                href="/dashboard/resources"
                selected={!selector}
              >
                {t("boardManagement.myResources")}
              </NavbarItem>
              <NavbarItem
                as={Link}
                href="/dashboard/resources/public"
                selected={selector === "public"}
              >
                {t("boardManagement.publicResources")}
              </NavbarItem>
            </SectionNavbar>
            <Button
              variant="filled"
              leadingIcon={<AddIcon />}
              onClick={() => router.push("/dashboard/resources/add")}
            >
              {t("boardManagement.createNewResource")}
            </Button>
          </div>
          <div className="searchBar">
            <input
              type="search"
              className="resourceSearch"
              placeholder={t("boardManagement.searchPlaceholder")}
              aria-label={t("boardManagement.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {!isPublicTab && (
              <ButtonGroup
                type="Round"
                size="Small"
                selectionMode="single"
                selectionRequired
                items={filterItems}
                value={filter}
                onChange={(next) => setFilter(next || "all")}
                aria-label={t("boardManagement.filterAriaLabel", {}, {
                  default: "Filter resources",
                })}
              />
            )}
          </div>
        </>
      )}

      {!selector && (
        <>
          <h2>{t("boardManagement.myResources")}</h2>
          <MyResourcesList
            query={query}
            user={user}
            searchTerm={searchTerm}
            filter={filter}
            onPreview={setPreviewId}
            onShare={setShareId}
          />
        </>
      )}
      {selector === "public" && (
        <>
          <h2>{t("boardManagement.publicResources")}</h2>
          <p>{t("boardManagement.publicResourcesDescription")}</p>
          <PublicResourcesList
            query={query}
            user={user}
            searchTerm={searchTerm}
            filter={filter}
            onPreview={setPreviewId}
          />
        </>
      )}

      {selector === "add" && <AddResource user={user} goBack={goBack} />}
      {selector === "copy" && (
        <CopyResource user={user} query={query} goBack={goBack} />
      )}
      {selector === "duplicate" && (
        <DuplicateResource user={user} query={query} goBack={goBack} />
      )}
      {selector &&
        selector !== "add" &&
        selector !== "public" &&
        selector !== "copy" &&
        selector !== "duplicate" &&
        selector !== "view" && (
          <EditResource
            selector={selector}
            user={user}
            query={query}
            isAdmin={user.permissions?.map((p) => p?.name).includes("ADMIN")}
            goBack={goBack}
          />
        )}
      {selector === "view" && (
        <ViewResource user={user} query={query} goBack={goBack} />
      )}

      {previewId && (
        <ResourcePreviewModal
          id={previewId}
          onClose={() => setPreviewId(null)}
        />
      )}
      {shareId && (
        <ShareCollaborators
          id={shareId}
          user={user}
          onClose={() => setShareId(null)}
        />
      )}
    </StyledResource>
  );
}
