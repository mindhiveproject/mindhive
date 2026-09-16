import { useState } from "react";
import { useQuery } from "@apollo/client";
import moment from "moment";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import { GET_PUBLIC_RESOURCES } from "../../Queries/Resource";
import { stripHtml } from "../../Proposal/Card/Forms/utils";

import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import ResourceCard from "./ResourceCard";
import LinkResourceToProjectCardModal from "./LinkResourceToProjectCardModal";

function formatResourceDates(resource, t) {
  const created = `${t("boardManagement.created", {}, { default: "Created" })}: ${moment(
    resource.createdAt
  ).format("MMMM D, YYYY")}`;
  if (!resource.updatedAt) return created;
  return `${created} · ${t("boardManagement.updated", {}, { default: "Updated" })}: ${moment(
    resource.updatedAt
  ).format("MMMM D, YYYY")}`;
}

export default function PublicResourcesList({
  query,
  user,
  searchTerm,
  filter,
  onPreview,
}) {
  const { data, error, loading } = useQuery(GET_PUBLIC_RESOURCES);
  const { t } = useTranslation("classes");
  const router = useRouter();
  const [linkResource, setLinkResource] = useState(null);
  let resources = data?.resources ? [...data.resources] : [];

  const permissionNames = user?.permissions?.map((p) => p?.name) || [];
  const canLinkToProjectCard = permissionNames.some((name) =>
    ["TEACHER", "MENTOR", "ADMIN"].includes(name)
  );

  if (searchTerm) {
    resources = resources.filter(
      (r) =>
        stripHtml(r.title).toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  resources = [...resources].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt).getTime();
    return bTime - aTime;
  });

  if (loading) return <p>{t("boardManagement.loadingDotdotdot")}</p>;
  if (error) return <p>{t("boardManagement.errLoadingPublicResource")}</p>;

  if (resources.length === 0) {
    return (
      <p
        className="MH-Type-Body-Base"
        style={{ color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)" }}
      >
        {searchTerm || filter !== "all"
          ? t("boardManagement.emptySearchResults", {}, {
              default: "No resources match your search or filter.",
            })
          : t("boardManagement.emptyPublicResources", {}, {
              default: "No public resources are available yet.",
            })}
      </p>
    );
  }

  return (
    <>
      <div className="board">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            typeLabel={t("boardManagement.publicChip", {}, { default: "Public" })}
            title={stripHtml(resource.title)}
            subtitle={`${t("boardManagement.author", {}, { default: "Author" })}: ${
              resource.author?.username || t("boardManagement.notAvailable")
            }`}
            description={formatResourceDates(resource, t)}
            chips={
              resource.collaborators?.length > 0
                ? resource.collaborators.map((c) => (
                    <Chip
                      key={c.id}
                      variant="static"
                      tone="neutral"
                      label={c.username}
                    />
                  ))
                : null
            }
            actions={
              <>
                <Button variant="subtle" onClick={() => onPreview(resource.id)}>
                  {t("boardManagement.preview")}
                </Button>
                <Button
                  variant="subtle"
                  onClick={() =>
                    router.push({
                      pathname: "/dashboard/resources/copy",
                      query: { id: resource.id },
                    })
                  }
                >
                  {t("boardManagement.copy")}
                </Button>
                {canLinkToProjectCard && (
                  <Button
                    variant="subtle"
                    onClick={() => setLinkResource(resource)}
                  >
                    {t("boardManagement.linkToProjectCard.button", {}, {
                      default: "Link to card",
                    })}
                  </Button>
                )}
              </>
            }
          />
        ))}
      </div>
      {linkResource && (
        <LinkResourceToProjectCardModal
          open
          resource={linkResource}
          user={user}
          onClose={() => setLinkResource(null)}
        />
      )}
    </>
  );
}
