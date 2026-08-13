// Multi MediaAsset picker/uploader. Answer shape:
//   [{ id, title?, url?, comment? }, ...]
// `comment` is denormalized for chips; maps to MediaAsset.description on create/update.
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import {
  CREATE_MEDIA_ASSET,
  MEDIA_ASSETS,
  MEDIA_LIBRARY_PROFILE_ID,
  UPDATE_MEDIA_ASSET,
  resolveMediaAssetExportDocumentUrl,
  resolveMediaAssetUrl,
} from "../../../Mutations/MediaAsset";
import { MediaListIcon } from "../../TeacherFormWizard/TypeIcons";
import { fieldHelper, fieldLabel } from "../i18n";
import { FieldShell, fieldShellErrorProps } from "../styles";
import ResourceChipList from "./ResourceChipList";

const MAX_ITEMS = 25;
const CREATED_WITH = "opportunity_media_list";
const ACCEPT =
  "image/png,image/jpeg,image/gif,image/webp,image/svg+xml,application/pdf";

const MEDIA_CHIP_LEADING = (
  <MediaListIcon width={18} height={18} style={{ display: "block" }} />
);

const ROW_STYLE = {
  border: "1px solid #d3dae0",
  borderRadius: 8,
  padding: 12,
  display: "grid",
  gap: 10,
  gridTemplateColumns: "1fr auto",
  alignItems: "end",
  background: "#fafbfc",
};

const INPUT_STYLE = {
  border: "1px solid #d3dae0",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 14,
};

const LABEL_SPAN_STYLE = { fontWeight: 600, color: "#5f6871" };

function isPdfFile(file) {
  if (!file) return false;
  if (file.type === "application/pdf") return true;
  return /\.pdf$/i.test(file.name || "");
}

function resolveOpenUrl(assetOrRef) {
  if (!assetOrRef) return "";
  const fromImage = resolveMediaAssetUrl(assetOrRef);
  if (fromImage) return fromImage;
  const fromPdf = resolveMediaAssetExportDocumentUrl(assetOrRef);
  if (fromPdf) return fromPdf;
  if (typeof assetOrRef.url === "string") return assetOrRef.url;
  return "";
}

function emptyRow() {
  return { id: null, title: "", comment: "", url: null };
}

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    if (!row) return emptyRow();
    if (typeof row === "string") {
      return { id: row, title: "", comment: "", url: null };
    }
    if (typeof row === "object") {
      const comment =
        typeof row.comment === "string"
          ? row.comment
          : typeof row.description === "string"
            ? row.description
            : "";
      return {
        id: row.id || null,
        title:
          typeof row.title === "string"
            ? row.title
            : typeof row.fileName === "string"
              ? row.fileName
              : "",
        comment,
        url: row.url || resolveOpenUrl(row) || null,
      };
    }
    return emptyRow();
  });
}

function chipLabelForRow(row) {
  const title = row.title?.trim();
  if (title) return title;
  const url = row.url?.trim();
  if (url) {
    try {
      const path = new URL(url).pathname || "";
      const file = path.split("/").filter(Boolean).pop();
      if (file) return decodeURIComponent(file);
    } catch {
      /* ignore */
    }
    return url.length > 40 ? `${url.slice(0, 37)}…` : url;
  }
  return row.id || "";
}

function toChipItems(list) {
  return list
    .filter((item) => item.id || item.title?.trim() || item.url)
    .map((item, index) => ({
      key: item.id || `media-${index}`,
      label: chipLabelForRow(item) || item.id,
      url: item.url || null,
      comment: item.comment?.trim() || null,
    }));
}

export default function MediaAssetListField({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
}) {
  const { t } = useTranslation("common");
  const [pickerRowIndex, setPickerRowIndex] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadingRowIndex, setUploadingRowIndex] = useState(null);
  const rows = normalizeList(value);
  const selectedIds = useMemo(
    () => new Set(rows.map((row) => row.id).filter(Boolean)),
    [rows]
  );
  const pickerOpen = pickerRowIndex !== null;

  const { data: profileData } = useQuery(MEDIA_LIBRARY_PROFILE_ID, {
    skip: disabled,
    fetchPolicy: "cache-first",
  });
  const myProfileId = profileData?.authenticatedItem?.id ?? null;

  const { data, loading, refetch } = useQuery(MEDIA_ASSETS, {
    variables: { profileId: myProfileId },
    skip: !pickerOpen || !myProfileId,
    fetchPolicy: "network-only",
  });

  const [createMediaAsset] = useMutation(CREATE_MEDIA_ASSET, {
    onCompleted: () => refetch(),
  });
  const [updateMediaAsset] = useMutation(UPDATE_MEDIA_ASSET);

  const assets = useMemo(() => {
    const raw = data?.mediaAssets;
    if (!Array.isArray(raw)) return [];
    return raw.filter((row) => row?.id);
  }, [data?.mediaAssets]);

  const setRows = useCallback(
    (next) => {
      onChange(next);
    },
    [onChange]
  );

  const setRow = useCallback(
    (index, patch) => {
      const next = rows.slice();
      next[index] = { ...next[index], ...patch };
      setRows(next);
    },
    [rows, setRows]
  );

  const removeRow = useCallback(
    (index) => {
      setRows(rows.filter((_, i) => i !== index));
    },
    [rows, setRows]
  );

  const addRow = useCallback(() => {
    if (rows.length >= MAX_ITEMS) return;
    setRows([...rows, emptyRow()]);
  }, [rows, setRows]);

  const persistAssetMeta = useCallback(
    async (assetId, { title, comment }) => {
      if (!assetId) return;
      try {
        await updateMediaAsset({
          variables: {
            id: assetId,
            data: {
              ...(title ? { title } : {}),
              description: comment || null,
            },
          },
        });
      } catch {
        /* best-effort; answer JSON still holds denormalized fields */
      }
    },
    [updateMediaAsset]
  );

  const assignAssetToRow = useCallback(
    (index, asset, overrides = {}) => {
      if (!asset?.id || index < 0 || index >= rows.length) return;
      if (selectedIds.has(asset.id) && rows[index]?.id !== asset.id) {
        setPickerRowIndex(null);
        return;
      }
      const title =
        overrides.title ??
        (rows[index]?.title?.trim() ||
          asset.title ||
          asset.fileName ||
          "");
      const comment =
        overrides.comment ??
        (rows[index]?.comment?.trim() ||
          (typeof asset.description === "string" ? asset.description : "") ||
          "");
      const next = rows.slice();
      next[index] = {
        id: asset.id,
        title,
        comment,
        url: resolveOpenUrl(asset) || null,
      };
      setRows(next);
      setPickerRowIndex(null);
      setUploadError(null);
      void persistAssetMeta(asset.id, { title, comment });
    },
    [persistAssetMeta, rows, selectedIds, setRows]
  );

  const handleUpload = useCallback(
    async (file, rowIndex) => {
      if (!file || !myProfileId) return;
      if (rowIndex < 0 || rowIndex >= rows.length) return;
      setUploadError(null);
      setUploadingRowIndex(rowIndex);
      const pdf = isPdfFile(file);
      const row = rows[rowIndex];
      const title = row?.title?.trim() || file.name;
      const comment = row?.comment?.trim() || "";
      try {
        const dataInput = {
          fileName: file.name,
          title,
          description: comment || null,
          author: { connect: { id: myProfileId } },
          createdInProfile: { connect: { id: myProfileId } },
          settings: { createdWith: CREATED_WITH },
        };
        if (pdf) {
          dataInput.exportDocument = { upload: file };
        } else {
          dataInput.image = { upload: file };
        }
        const result = await createMediaAsset({
          variables: { data: dataInput },
        });
        const created = result?.data?.createMediaAsset;
        if (created?.id) {
          assignAssetToRow(rowIndex, created, { title, comment });
        }
      } catch (err) {
        setUploadError(err?.message || "Upload failed");
      } finally {
        setUploadingRowIndex(null);
      }
    },
    [assignAssetToRow, createMediaAsset, myProfileId, rows]
  );

  const handleMetaBlur = useCallback(
    (index) => {
      const row = rows[index];
      if (!row?.id) return;
      void persistAssetMeta(row.id, {
        title: row.title?.trim() || "",
        comment: row.comment?.trim() || "",
      });
    },
    [persistAssetMeta, rows]
  );

  if (disabled) {
    return (
      <FieldShell as="div" {...fieldShellErrorProps(error)}>
        <span className="label-text">
          {fieldLabel(field, locale)}
          {field.isRequired && <span className="required">*</span>}
        </span>
        {fieldHelper(field, locale) ? (
          <span className="hint">{fieldHelper(field, locale)}</span>
        ) : null}
        <ResourceChipList
          items={toChipItems(rows)}
          leading={MEDIA_CHIP_LEADING}
          kind="media"
          emptyLabel={t("definitionForm.mediaAssetList.emptyReadonly", {}, {
            default: "No media shared",
          })}
        />
        {error ? <span className="error">{error}</span> : null}
      </FieldShell>
    );
  }

  return (
    <FieldShell as="div" {...fieldShellErrorProps(error)}>
      <span className="label-text">
        {fieldLabel(field, locale)}
        {field.isRequired && <span className="required">*</span>}
      </span>
      {fieldHelper(field, locale) ? (
        <span className="hint">{fieldHelper(field, locale)}</span>
      ) : null}

      {rows.length === 0 ? (
        <span className="hint" style={{ fontStyle: "italic" }}>
          {t("definitionForm.mediaAssetList.empty", {}, {
            default: "No media yet — add one below.",
          })}
        </span>
      ) : null}

      {rows.map((row, i) => {
        const isImagePreview = Boolean(
          row.url && /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(row.url)
        );
        const uploading = uploadingRowIndex === i;
        return (
          <div key={row.id || `media-row-${i}`} style={ROW_STYLE}>
            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              <span style={LABEL_SPAN_STYLE}>
                {t("definitionForm.mediaAssetList.title", {}, {
                  default: "Title",
                })}
              </span>
              <input
                type="text"
                value={row.title}
                onChange={(e) => setRow(i, { title: e.target.value })}
                onBlur={() => handleMetaBlur(i)}
                placeholder={t(
                  "definitionForm.mediaAssetList.titlePlaceholder",
                  {},
                  { default: "Resource name" }
                )}
                style={INPUT_STYLE}
              />
            </label>
            <button
              type="button"
              onClick={() => removeRow(i)}
              style={{
                background: "none",
                border: "1px solid #d3dae0",
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
                color: "#c0392b",
                fontSize: 13,
                height: 42,
              }}
            >
              {t("definitionForm.mediaAssetList.remove", {}, {
                default: "Remove",
              })}
            </button>

            <label
              style={{
                display: "grid",
                gap: 4,
                fontSize: 13,
                gridColumn: "1 / -1",
              }}
            >
              <span style={LABEL_SPAN_STYLE}>
                {t("definitionForm.mediaAssetList.comment", {}, {
                  default: "Comment (optional)",
                })}
              </span>
              <input
                type="text"
                value={row.comment}
                onChange={(e) => setRow(i, { comment: e.target.value })}
                onBlur={() => handleMetaBlur(i)}
                placeholder={t(
                  "definitionForm.mediaAssetList.commentPlaceholder",
                  {},
                  { default: "Short note for viewers" }
                )}
                style={INPUT_STYLE}
              />
            </label>

            <div
              style={{
                gridColumn: "1 / -1",
                display: "grid",
                gap: 8,
              }}
            >
              <span style={{ ...LABEL_SPAN_STYLE, fontSize: 13 }}>
                {t("definitionForm.mediaAssetList.media", {}, {
                  default: "Media",
                })}
              </span>

              {row.id && row.url ? (
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {isImagePreview ? (
                    <img
                      src={row.url}
                      alt=""
                      style={{
                        width: 96,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 6,
                        border: "1px solid #d3dae0",
                      }}
                    />
                  ) : (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 96,
                        height: 72,
                        borderRadius: 6,
                        background: "#eef5f9",
                        border: "1px solid #d3dae0",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--MH-Theme-Primary-Dark, #336f8a)",
                        textDecoration: "none",
                      }}
                    >
                      PDF
                    </a>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setPickerRowIndex(i)}
                      style={{
                        border:
                          "1px solid var(--MH-Theme-Primary-Dark, #336f8a)",
                        background: "#fff",
                        color: "var(--MH-Theme-Primary-Dark, #336f8a)",
                        borderRadius: 8,
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      {t("definitionForm.mediaAssetList.changeFromLibrary", {}, {
                        default: "Choose different file",
                      })}
                    </button>
                    <label
                      style={{
                        border: "1px solid #d3dae0",
                        background: "#f7f9f8",
                        color: "#171717",
                        borderRadius: 8,
                        padding: "8px 12px",
                        cursor: uploading ? "wait" : "pointer",
                        fontSize: 13,
                      }}
                    >
                      {uploading
                        ? t("mediaLibrary.uploading", {}, {
                            default: "Uploading…",
                          })
                        : t("definitionForm.mediaAssetList.replaceUpload", {}, {
                            default: "Upload replacement",
                          })}
                      <input
                        type="file"
                        accept={ACCEPT}
                        hidden
                        disabled={uploading || !myProfileId}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) handleUpload(file, i);
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setPickerRowIndex(i)}
                    style={{
                      border:
                        "1px solid var(--MH-Theme-Primary-Dark, #336f8a)",
                      background: "#fff",
                      color: "var(--MH-Theme-Primary-Dark, #336f8a)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    {t("definitionForm.mediaAssetList.addFromLibrary", {}, {
                      default: "Choose from media library",
                    })}
                  </button>
                  <label
                    style={{
                      border: "1px solid #d3dae0",
                      background: "#f7f9f8",
                      color: "#171717",
                      borderRadius: 8,
                      padding: "8px 12px",
                      cursor: uploading ? "wait" : "pointer",
                      fontSize: 13,
                    }}
                  >
                    {uploading
                      ? t("mediaLibrary.uploading", {}, {
                          default: "Uploading…",
                        })
                      : t("definitionForm.mediaAssetList.upload", {}, {
                          default: "Upload image or PDF",
                        })}
                    <input
                      type="file"
                      accept={ACCEPT}
                      hidden
                      disabled={uploading || !myProfileId}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) handleUpload(file, i);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={addRow}
        disabled={rows.length >= MAX_ITEMS}
      >
        {t("definitionForm.mediaAssetList.add", {}, { default: "Add media" })}
      </Button>

      {uploadError ? <span className="error">{uploadError}</span> : null}
      {error ? <span className="error">{error}</span> : null}

      {pickerOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(23, 23, 23, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setPickerRowIndex(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 20,
              width: "min(640px, 100%)",
              maxHeight: "80vh",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <strong>
                {t("mediaLibrary.title", {}, { default: "Media library" })}
              </strong>
              <button
                type="button"
                onClick={() => setPickerRowIndex(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 18,
                  lineHeight: 1,
                }}
                aria-label={t("close", {}, { default: "Close" })}
              >
                ×
              </button>
            </div>
            {loading ? (
              <p style={{ margin: 0, color: "#5f6871" }}>
                {t("loading", {}, { default: "Loading…" })}
              </p>
            ) : assets.length === 0 ? (
              <p style={{ margin: 0, color: "#5f6871" }}>
                {t("mediaLibrary.empty", {}, {
                  default:
                    "No media yet. Upload an image or PDF to get started.",
                })}
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: 10,
                }}
              >
                {assets.map((asset) => {
                  const url = resolveOpenUrl(asset);
                  const usedElsewhere =
                    selectedIds.has(asset.id) &&
                    rows[pickerRowIndex]?.id !== asset.id;
                  const pdfUrl = resolveMediaAssetExportDocumentUrl(asset);
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      disabled={usedElsewhere}
                      onClick={() => assignAssetToRow(pickerRowIndex, asset)}
                      style={{
                        border: usedElsewhere
                          ? "2px solid var(--MH-Theme-Primary-Dark, #336f8a)"
                          : "1px solid #d3dae0",
                        borderRadius: 10,
                        padding: 8,
                        background: usedElsewhere ? "#eef5f9" : "#fff",
                        cursor: usedElsewhere ? "not-allowed" : "pointer",
                        textAlign: "left",
                        opacity: usedElsewhere ? 0.75 : 1,
                      }}
                    >
                      {url && !pdfUrl ? (
                        <img
                          src={url}
                          alt=""
                          style={{
                            width: "100%",
                            height: 80,
                            objectFit: "cover",
                            borderRadius: 6,
                            marginBottom: 6,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: 80,
                            borderRadius: 6,
                            background: "#eef5f9",
                            marginBottom: 6,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            color: "#5f6871",
                            fontWeight: 600,
                          }}
                        >
                          {pdfUrl ? "PDF" : "—"}
                        </div>
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          color: "#171717",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {asset.title || asset.fileName || asset.id}
                      </span>
                      {usedElsewhere ? (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--MH-Theme-Primary-Dark, #336f8a)",
                          }}
                        >
                          {t("definitionForm.mediaAssetList.alreadyAdded", {}, {
                            default: "Already added",
                          })}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </FieldShell>
  );
}
