import { useState } from "react";
import { useQuery } from "@apollo/client";
import moment from "moment";
import { useRouter } from "next/router";

import { GET_MY_RESOURCES, GET_PUBLIC_RESOURCES } from "../../Queries/Resource";
import DeleteResource from "./DeleteResource";
import { TrashIcon } from "../../DesignSystem/Icons";
import ResourceCard from "./ResourceCard";
import LinkResourceToProjectCardModal from "./LinkResourceToProjectCardModal";
import MessageCard from "../../DesignSystem/MessageCard";
import { stripHtml } from "../../Proposal/Card/Forms/utils";

import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import useTranslation from "next-translate/useTranslation";

function formatShortResourceDate(value) {
  if (!value) return null;
  return moment(value).format("MMM D");
}

function hasDistinctUpdate(resource) {
  if (!resource?.updatedAt || !resource?.createdAt) return Boolean(resource?.updatedAt);
  return (
    moment(resource.updatedAt).valueOf() !== moment(resource.createdAt).valueOf()
  );
}

/** Author first, then collaborators; deduped by profile id and username. */
function getResourcePeople(resource) {
  const seenIds = new Set();
  const seenUsernames = new Set();
  const people = [];

  const add = (person, role) => {
    if (!person) return;
    const id = person.id;
    const username = person.username?.trim();
    if (!id && !username) return;

    const usernameKey = username?.toLowerCase();
    if (id && seenIds.has(id)) return;
    if (usernameKey && seenUsernames.has(usernameKey)) return;

    if (id) seenIds.add(id);
    if (usernameKey) seenUsernames.add(usernameKey);

    people.push({
      id: id || usernameKey,
      username,
      role,
    });
  };

  add(resource.author, "author");
  for (const collaborator of resource.collaborators || []) {
    add(collaborator, "collaborator");
  }

  return people;
}

function renderResourceCardChips(resource, t) {
  const chips = [];

  if (resource.createdAt) {
    chips.push(
      <Chip
        key="created"
        variant="static"
        tone="neutral"
        label={t(
          "boardManagement.resourceCreatedChip",
          { date: formatShortResourceDate(resource.createdAt) },
          { default: "Created {{date}}" }
        )}
      />
    );
  }

  if (hasDistinctUpdate(resource)) {
    chips.push(
      <Chip
        key="updated"
        variant="static"
        tone="neutral"
        label={t(
          "boardManagement.resourceUpdatedChip",
          { date: formatShortResourceDate(resource.updatedAt) },
          { default: "Updated {{date}}" }
        )}
      />
    );
  }

  for (const person of getResourcePeople(resource)) {
    const displayName = person.username || t("boardManagement.notAvailable");
    const label =
      person.role === "author"
        ? t(
            "boardManagement.resourceAuthorChip",
            { username: displayName },
            { default: "{{username}} · Author" }
          )
        : displayName;

    chips.push(
      <Chip
        key={person.id}
        variant="static"
        tone={"neutral"}
        label={label}
      />
    );
  }

  return chips.length > 0 ? chips : null;
}

export default function MyResourcesList({
  query,
  user,
  searchTerm,
  filter,
  onPreview,
  onShare,
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const [linkResource, setLinkResource] = useState(null);

  const { data, error, loading } = useQuery(GET_MY_RESOURCES, {
    variables: { id: user?.id },
  });

  let resources = data?.resources ? [...data.resources] : [];

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
  if (filter === "public") {
    resources = resources.filter((r) => r.isPublic === true);
  }

  const refetchQueries = [
    {
      query: GET_MY_RESOURCES,
      variables: { id: user?.id },
    },
    {
      query: GET_PUBLIC_RESOURCES,
    },
  ];

  if (loading) return <p>{t("boardManagement.loading")}</p>;
  if (error) return <p>{t("boardManagement.errorLoadingResources")}</p>;
  const permissionNames = user.permissions?.map((p) => p?.name) || [];
  const isStudentOnly =
    permissionNames.includes("STUDENT") &&
    !permissionNames.includes("TEACHER") &&
    !permissionNames.includes("ADMIN") &&
    !permissionNames.includes("MENTOR");
  if (isStudentOnly) {
    return <></>;
  }

  if (resources.length === 0) {
    return (
      <MessageCard
        variant="information"
        message={
          searchTerm || filter !== "all"
            ? t("boardManagement.emptySearchResults", {}, {
                default: "No resources match your search or filter.",
              })
            : t("boardManagement.emptyMyResources", {}, {
                default: "You have not created any resources yet.",
              })
        }
      >
      </MessageCard>
    );
  }

  return (
    <>
      <div className="board">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            typeLabel={
              resource.isPublic
                ? t("boardManagement.publicChip", {}, { default: "Public" })
                : null
            }
            title={stripHtml(resource.title)}
            chips={renderResourceCardChips(resource, t)}
            actions={
              <>
                <Button variant="subtle" onClick={() => onPreview(resource.id)}>
                  {t("boardManagement.preview")}
                </Button>
                <Button
                  variant="subtle"
                  onClick={() =>
                    router.push(`/dashboard/resources/edit?id=${resource.id}`)
                  }
                >
                  {t("boardManagement.edit")}
                </Button>
                <Button
                  variant="subtle"
                  onClick={() =>
                    router.push(
                      `/dashboard/resources/duplicate?id=${resource.id}`
                    )
                  }
                >
                  {t("boardManagement.duplicate")}
                </Button>
                <Button
                  variant="subtle"
                  onClick={() => setLinkResource(resource)}
                >
                  {t("boardManagement.linkToProjectCard.button", {}, {
                    default: "Link to card",
                  })}
                </Button>
                <Button variant="tonal" style={{ color: "var(--MH-Theme-Status-Info-dark, #004F94)", background: "var(--MH-Theme-Status-Info-light, #E6F0FA)" }} onClick={() => onShare(resource.id)}>
                  {t("boardManagement.share")}
                </Button>
                <DeleteResource
                  resourceId={resource.id}
                  refetchQueries={refetchQueries}
                >
                  <Button 
                    variant="tonal"
                    style={{ color: "var(--MH-Theme-Status-Danger-dark, #95221D)", background: "var(--MH-Theme-Status-Danger-light, #FEECEB)" }}
                    >
                      <TrashIcon width={16} height={16} />
                  </Button>
                </DeleteResource>
              </>
            }
          />
        ))}
      </div>
      {linkResource && (
        <LinkResourceToProjectCardModal
          open={Boolean(linkResource)}
          resource={linkResource}
          user={user}
          onClose={() => setLinkResource(null)}
        />
      )}
    </>
  );
}
