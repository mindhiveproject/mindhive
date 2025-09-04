import { useQuery } from "@apollo/client";
import { useEffect, useRef } from "react";
import ReactHtmlParser from "react-html-parser";
import moment from "moment";
import { Icon } from "semantic-ui-react";

import { GET_RESOURCE } from "../../Queries/Resource";
import StyledResource from "../../styles/StyledResource";

export default function ResourcePreviewModal({ id, onClose }) {
  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id },
  });
  const resource = data?.resource || {};
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (loading)
    return (
      <div className="previewModalWrapper">
        <div className="previewModal">
          <p>Loading preview...</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="previewModalWrapper">
        <div className="previewModal">
          <p>Error loading preview.</p>
        </div>
      </div>
    );

  return (
    <div className="previewModalOuterWrapper">
      <div className="previewModalWrapper">
        <div className="previewModal" ref={modalRef}>
          <button className="closeBtn" onClick={onClose}>
            <Icon name="close" />
          </button>
          <h2>{resource.title}</h2>
          <p>
            <strong>Description:</strong> {resource.description || "N/A"}
          </p>
          <p>
            <strong>Created:</strong>{" "}
            {moment(resource.createdAt).format("MMMM D, YYYY")}
          </p>
          <p>
            <strong>Updated:</strong>{" "}
            {resource.updatedAt
              ? moment(resource.updatedAt).format("MMMM D, YYYY")
              : "N/A"}
          </p>
          <p>
            <strong>Author:</strong> {resource.author?.username}
          </p>
          <div>
            <strong>Content Preview:</strong>{" "}
            {ReactHtmlParser(resource.content?.main?.slice(0, 500) + "...")}
          </div>
        </div>
      </div>
    </div>
  );
}
