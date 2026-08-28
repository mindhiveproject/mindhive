import { useQuery } from "@apollo/client";
import moment from "moment";
import Link from "next/link";
import { Icon } from "semantic-ui-react";
import Tooltip from "../../DesignSystem/Tooltip";

import { GET_MY_RESOURCES, GET_PUBLIC_RESOURCES } from "../../Queries/Resource";
import DeleteResource from "./DeleteResource";
import { stripHtml } from "../../Proposal/Card/Forms/utils";

import useTranslation from "next-translate/useTranslation";

export default function MyResourcesList({
  query,
  user,
  searchTerm,
  filter,
  onPreview,
  onShare,
}) {
  const { t } = useTranslation("classes");

  const { data, error, loading } = useQuery(GET_MY_RESOURCES, {
    variables: { id: user?.id },
  });

  let resources = data?.resources ? [...data.resources] : []; // Create mutable copy

  // Client-side search and filter
  if (searchTerm) {
    resources = resources.filter(
      (r) =>
        stripHtml(r.title).toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (filter === "recent") {
    resources = [...resources].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  }
  if (filter === "public") {
    resources = resources.filter((r) => r.isPublic === true);
  }

  // Define refetchQueries for DeleteResource
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
  if (user.permissions?.map((p) => p?.name).includes("STUDENT")) {
    return <></>;
  }

  return (
    <div className="board">
      {resources.map((resource) => (
        <div key={resource.id} className="card">
          <h3 className="card-title">{stripHtml(resource.title)}</h3>
          <p className="card-meta">
            {t("boardManagement.author")}: {resource.author?.username}
          </p>
          <p className="card-meta">
            {t("boardManagement.created")}:{" "}
            {moment(resource.createdAt).format("MMMM D, YYYY")}
          </p>
          {resource.updatedAt && (
            <p className="card-meta">
              {t("boardManagement.updated")}:{" "}
              {moment(resource.updatedAt).format("MMMM D, YYYY")}
            </p>
          )}
          {resource.collaborators?.length > 0 && (
            <div className="card-collaborators">
              <strong>{t("boardManagement.collaborators")}:</strong>{" "}
              {resource.collaborators.map((c) => (
                <span key={c.id}>{c.username}</span>
              ))}
            </div>
          )}
          <div className="card-actions">
            <Tooltip content={t("boardManagement.preview")}>
              <Icon
                name="eye"
                className="action-icon preview"
                onClick={() => onPreview(resource.id)}
              />
            </Tooltip>
            <Tooltip content={t("boardManagement.edit")}>
              <Link href={`/dashboard/resources/edit?id=${resource.id}`}>
                <Icon name="edit" className="action-icon edit" />
              </Link>
            </Tooltip>
            <Tooltip content={t("boardManagement.duplicate")}>
              <Link
                href={`/dashboard/resources/duplicate?id=${resource.id}`}
              >
                <Icon name="copy" className="action-icon copy" />
              </Link>
            </Tooltip>
            <Tooltip content={t("boardManagement.share")}>
              <Icon
                name="share"
                className="action-icon share"
                onClick={() => onShare(resource.id)}
              />
            </Tooltip>
            <Tooltip content={t("boardManagement.delete")}>
              <DeleteResource
                resourceId={resource.id}
                refetchQueries={refetchQueries}
              >
                <Icon name="trash" className="action-icon delete" />
              </DeleteResource>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
}
