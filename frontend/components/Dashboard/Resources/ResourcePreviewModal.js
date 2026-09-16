import { useQuery } from "@apollo/client";
import ReactHtmlParser from "react-html-parser";
import moment from "moment";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import IconButton from "../../DesignSystem/IconButton";
import Modal from "../../DesignSystem/Modal";
import { CloseIcon } from "../../DesignSystem/Icons";
import { ReadOnlyTipTap } from "../../TipTap/ReadOnlyTipTap";
import { GET_RESOURCE } from "../../Queries/Resource";
import { stripHtml } from "../../Proposal/Card/Forms/utils";

const PreviewContent = styled.div`
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;

  img,
  video,
  iframe,
  .editor-image {
    max-width: 100%;
    height: auto;
  }

  table {
    max-width: 100%;
  }
`;

const META_LABEL = {
  margin: 0,
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
};

const META_VALUE = {
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

export default function ResourcePreviewModal({ id, onClose }) {
  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id },
    skip: !id,
  });
  const resource = data?.resource || {};
  const { t } = useTranslation("classes");

  const title = loading
    ? t("boardManagement.loadingPreview")
    : error
      ? t("boardManagement.errorLoadingPreview")
      : stripHtml(resource.title) || t("boardManagement.preview");

  return (
    <Modal
      open={Boolean(id)}
      onClose={onClose}
      title={
        <>
          <span style={{ flex: 1, minWidth: 0 }}>{title}</span>
          <IconButton
            variant="subtle"
            icon={<CloseIcon />}
            ariaLabel={t("boardManagement.close", {}, { default: "Close" })}
            onClick={onClose}
          />
        </>
      }
      size="large"
      bodyStyle={{ minWidth: 0 }}
    >
      {loading && (
        <p style={META_LABEL}>{t("boardManagement.loadingPreview")}</p>
      )}
      {error && (
        <p style={META_LABEL}>{t("boardManagement.errorLoadingPreview")}</p>
      )}
      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p className="MH-Type-Body-Base" style={META_LABEL}>
            <strong style={META_VALUE}>
              {t("boardManagement.description")}:
            </strong>{" "}
            {resource.description || t("boardManagement.notAvailable")}
          </p>
          <p className="MH-Type-Body-Base" style={META_LABEL}>
            <strong style={META_VALUE}>{t("boardManagement.created")}:</strong>{" "}
            {moment(resource.createdAt).format("MMMM D, YYYY")}
          </p>
          <p className="MH-Type-Body-Base" style={META_LABEL}>
            <strong style={META_VALUE}>{t("boardManagement.updated")}:</strong>{" "}
            {resource.updatedAt
              ? moment(resource.updatedAt).format("MMMM D, YYYY")
              : t("boardManagement.notAvailable")}
          </p>
          <p className="MH-Type-Body-Base" style={META_LABEL}>
            <strong style={META_VALUE}>{t("boardManagement.author")}:</strong>{" "}
            {resource.author?.username}
          </p>
          <div>
            <strong className="MH-Type-Body-Base" style={META_VALUE}>
              {t("boardManagement.contentPreview")}:
            </strong>
            <PreviewContent>
              <ReadOnlyTipTap>
                <div className="ProseMirror">
                  {resource.content?.main
                    ? ReactHtmlParser(resource.content.main)
                    : t("boardManagement.notAvailable")}
                </div>
              </ReadOnlyTipTap>
            </PreviewContent>
          </div>
        </div>
      )}
    </Modal>
  );
}
