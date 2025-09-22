import { useQuery } from "@apollo/client";
import moment from "moment";
import Link from "next/link";
import { Icon, Popup } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import { GET_PUBLIC_RESOURCES } from "../../Queries/Resource";

export default function PublicResourcesList({
  query,
  user,
  searchTerm,
  filter,
  onPreview,
}) {
  const { data, error, loading } = useQuery(GET_PUBLIC_RESOURCES);
  const { t } = useTranslation("classes");
  let resources = data?.resources ? [...data.resources] : []; // Create mutable copy

  // Client-side search and filter
  if (searchTerm) {
    resources = resources.filter(
      (r) =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (filter === "recent") {
    resources = [...resources].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    ); // Sort on a new copy
  }

  if (loading) return <p>{t("boardManagement.loadingDotdotdot")}</p>;
  if (error) return <p>{t("boardManagement.errLoadingPublicResource")}</p>;

  return (
    <div className="board">
      {resources.map((resource) => (
        <div key={resource.id} className="card">
          <h3 className="card-title">{resource.title}</h3>
          <p className="card-meta">{t("boardManagement.author")}: {resource.author?.username}</p>
          <p className="card-meta">
          {t("boardManagement.created")} {moment(resource.createdAt).format("MMMM D, YYYY")}
          </p>
          {resource.updatedAt && (
            <p className="card-meta">
              {t("boardManagement.updated")}: {moment(resource.updatedAt).format("MMMM D, YYYY")}
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
            <Popup
              content={t("boardManagement.preview")}
              trigger={
                <Icon
                  name="eye"
                  className="action-icon preview"
                  onClick={() => onPreview(resource.id)}
                />
              }
            />
            <Popup
              content={t("boardManagement.copy")}
              trigger={
                <Link
                  href={{
                    pathname: "/dashboard/resources/copy",
                    query: { id: resource.id },
                  }}
                >
                  <Icon name="copy" className="action-icon copy" />
                </Link>
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}
