import { useState } from "react";
import Link from "next/link";
import { Icon } from "semantic-ui-react";

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

import useTranslation from "next-translate/useTranslation";

export default function ResourcesMain({ query, user }) {
  const { selector } = query;
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [previewId, setPreviewId] = useState(null);
  const [shareId, setShareId] = useState(null);
  const { t } = useTranslation("classes");

  // Hide header for action routes, but show for 'public' and overview
  const isActionRoute =
    ["add", "copy", "duplicate", "view"].includes(selector) ||
    (selector && selector !== "public");

  const goBack = () => {
    window.location.href = "/dashboard/resources";
  };

  return (
    <StyledResource>
      {!isActionRoute && (
        <>
          <h1>{t("boardManagement.resourceCenterTitle")}</h1>
          <p>{t("boardManagement.resourceCenterDescription")}</p>
          <div className="header">
            <div className="menu">
              <Link href="/dashboard/resources">
                <div
                  className={
                    !selector ? "menuTitle selectedMenuTitle" : "menuTitle"
                  }
                >
                  <p>{t("boardManagement.myResources")}</p>
                </div>
              </Link>
              <Link href="/dashboard/resources/public">
                <div
                  className={
                    selector === "public"
                      ? "menuTitle selectedMenuTitle"
                      : "menuTitle"
                  }
                >
                  <p>{t("boardManagement.publicResources")}</p>
                </div>
              </Link>
            </div>
            <Link href="/dashboard/resources/add">
              <button>{t("boardManagement.createNewResource")}</button>
            </Link>
          </div>
          <div className="searchBar">
            <input
              type="text"
              placeholder={t("boardManagement.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">{t("boardManagement.filter.all")}</option>
              <option value="recent">{t("boardManagement.filter.recent")}</option>
              {selector !== "public" && (
                <option value="public">{t("boardManagement.filter.publicOnly")}</option>
              )}
            </select>
          </div>
        </>
      )}

      {!selector && (
        <>
          <h2>{t("boardManagement.myResources")}</h2>
          <p>{t("boardManagement.myResourcesDescription")}</p>
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
