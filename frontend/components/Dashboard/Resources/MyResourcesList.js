import { useQuery } from "@apollo/client";
import moment from "moment";
import Link from "next/link";
import { Icon, Popup } from "semantic-ui-react";

import { GET_MY_RESOURCES, GET_PUBLIC_RESOURCES } from "../../Queries/Resource";
import DeleteResource from "./DeleteResource";

export default function MyResourcesList({
  query,
  user,
  searchTerm,
  filter,
  onPreview,
  onShare,
}) {
  const { data, error, loading } = useQuery(GET_MY_RESOURCES, {
    variables: { id: user?.id },
  });

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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading your resources.</p>;
  if (user.permissions?.map((p) => p?.name).includes("STUDENT")) {
    return <></>;
  }

  return (
    <div className="board">
      {resources.map((resource) => (
        <div key={resource.id} className="card">
          <h3 className="card-title">{resource.title}</h3>
          <p className="card-meta">Author: {resource.author?.username}</p>
          <p className="card-meta">
            Created: {moment(resource.createdAt).format("MMMM D, YYYY")}
          </p>
          {resource.updatedAt && (
            <p className="card-meta">
              Updated: {moment(resource.updatedAt).format("MMMM D, YYYY")}
            </p>
          )}
          {resource.collaborators?.length > 0 && (
            <div className="card-collaborators">
              <strong>Collaborators:</strong>{" "}
              {resource.collaborators.map((c) => (
                <span key={c.id}>{c.username}</span>
              ))}
            </div>
          )}
          <div className="card-actions">
            <Popup
              content="Preview"
              trigger={
                <Icon
                  name="eye"
                  className="action-icon preview"
                  onClick={() => onPreview(resource.id)}
                />
              }
            />
            <Popup
              content="Edit"
              trigger={
                <Link href={`/dashboard/resources/edit?id=${resource.id}`}>
                  <Icon name="edit" className="action-icon edit" />
                </Link>
              }
            />
            <Popup
              content="Duplicate"
              trigger={
                <Link href={`/dashboard/resources/duplicate?id=${resource.id}`}>
                  <Icon name="copy" className="action-icon copy" />
                </Link>
              }
            />
            <Popup
              content="Share"
              trigger={
                <Icon
                  name="share"
                  className="action-icon share"
                  onClick={() => onShare(resource.id)}
                />
              }
            />
            <Popup
              content="Delete"
              trigger={
                <DeleteResource
                  resourceId={resource.id}
                  refetchQueries={refetchQueries}
                >
                  <Icon name="trash" className="action-icon delete" />
                </DeleteResource>
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}
