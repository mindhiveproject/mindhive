import { useQuery } from "@apollo/client";
import { useEffect, useRef } from "react";
import ReactHtmlParser from "react-html-parser";
import moment from "moment";
import { Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import { GET_RESOURCE } from "../../Queries/Resource";
import StyledResource from "../../styles/StyledResource";

export default function ResourcePreviewModal({ id, onClose }) {
  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id },
  });
  const resource = data?.resource || {};
  const modalRef = useRef(null);
  const { t } = useTranslation("classes");

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
          <p>{t("boardManagement.loadingPreview")}</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="previewModalWrapper">
        <div className="previewModal">
          <p>{t("boardManagement.errorLoadingPreview")}</p>
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
            <strong>{t("boardManagement.description")}:</strong>{" "}
            {resource.description || t("boardManagement.notAvailable")}
          </p>
          <p>
            <strong>{t("boardManagement.created")}:</strong>{" "}
            {moment(resource.createdAt).format("MMMM D, YYYY")}
          </p>
          <p>
            <strong>{t("boardManagement.updated")}:</strong>{" "}
            {resource.updatedAt
              ? moment(resource.updatedAt).format("MMMM D, YYYY")
              : t("boardManagement.notAvailable")}
          </p>
          <p>
            <strong>{t("boardManagement.author")}:</strong>{" "}
            {resource.author?.username}
          </p>
          <div>
            <strong>{t("boardManagement.contentPreview")}:</strong>{" "}
            {ReactHtmlParser(resource.content?.main?.slice(0, 500) + "...")}
          </div>
        </div>
      </div>
    </div>
  );
}
