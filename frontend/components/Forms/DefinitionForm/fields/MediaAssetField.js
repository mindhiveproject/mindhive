// Media library field for DefinitionForm. Students pick an existing
// MediaAsset from their library or upload a new image owned via
// createdInProfile (no proposal-board scope required).
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import {
  CREATE_MEDIA_ASSET,
  MEDIA_ASSETS,
  MEDIA_LIBRARY_PROFILE_ID,
  resolveMediaAssetUrl,
} from "../../../Mutations/MediaAsset";
import { fieldHelper, fieldLabel } from "../i18n";
import { FieldShell, fieldShellErrorProps } from "../styles";

function normalizeValue(value) {
  if (!value) return null;
  if (typeof value === "string") return { id: value };
  if (typeof value === "object" && value.id) {
    return {
      id: value.id,
      url: value.url || null,
      title: value.title || value.fileName || null,
    };
  }
  return null;
}

export default function MediaAssetField({
  field,
  value,
  onChange,
  error,
  locale,
  disabled,
}) {
  const { t } = useTranslation("common");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const selected = normalizeValue(value);

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

  const [createMediaAsset, { loading: uploading }] = useMutation(
    CREATE_MEDIA_ASSET,
    { onCompleted: () => refetch() }
  );

  const assets = useMemo(() => {
    const raw = data?.mediaAssets;
    if (!Array.isArray(raw)) return [];
    return raw.filter((row) => row?.id);
  }, [data?.mediaAssets]);

  const pick = useCallback(
    (asset) => {
      if (!asset?.id) return;
      onChange({
        id: asset.id,
        url: resolveMediaAssetUrl(asset),
        title: asset.title || asset.fileName || null,
      });
      setPickerOpen(false);
      setUploadError(null);
    },
    [onChange]
  );

  const handleUpload = useCallback(
    async (file) => {
      if (!file || !myProfileId) return;
      setUploadError(null);
      try {
        const result = await createMediaAsset({
          variables: {
            data: {
              fileName: file.name,
              title: file.name,
              author: { connect: { id: myProfileId } },
              createdInProfile: { connect: { id: myProfileId } },
              image: { upload: file },
            },
          },
        });
        const created = result?.data?.createMediaAsset;
        if (created?.id) pick(created);
      } catch (err) {
        setUploadError(err?.message || "Upload failed");
      }
    },
    [createMediaAsset, myProfileId, pick]
  );

  return (
    <FieldShell as="div" {...fieldShellErrorProps(error)}>
      <span className="label-text">
        {fieldLabel(field, locale)}
        {field.isRequired && <span className="required">*</span>}
      </span>
      {fieldHelper(field, locale) ? (
        <span className="hint">{fieldHelper(field, locale)}</span>
      ) : null}

      {selected ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {selected.url ? (
            <img
              src={selected.url}
              alt=""
              style={{
                width: 56,
                height: 56,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #d3dae0",
              }}
            />
          ) : null}
          <div
            style={{
              flex: 1,
              font: 'var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif)',
              letterSpacing: 0,
              color: "#5f6871",
            }}
          >
            {selected.title || selected.id}
          </div>
          {!disabled ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              style={{
                border: "none",
                background: "transparent",
                color: "#336f8a",
                cursor: "pointer",
                font: 'var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif)',
                letterSpacing: 0,
              }}
            >
              {t("remove", {}, { default: "Remove" })}
            </button>
          ) : null}
        </div>
      ) : null}

      {!disabled ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            style={{
              border: "1px solid #336f8a",
              background: "#fff",
              color: "#336f8a",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              font: 'var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif)',
              letterSpacing: 0,
            }}
          >
            {t("mediaLibrary.choose", {}, {
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
              font: 'var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif)',
              letterSpacing: 0,
            }}
          >
            {uploading
              ? t("mediaLibrary.uploading", {}, { default: "Uploading…" })
              : t("mediaLibrary.upload", {}, { default: "Upload image" })}
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={uploading || !myProfileId}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) handleUpload(file);
              }}
            />
          </label>
        </div>
      ) : null}

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
          onClick={() => setPickerOpen(false)}
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
                onClick={() => setPickerOpen(false)}
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
                  default: "No media yet. Upload an image to get started.",
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
                  const url = resolveMediaAssetUrl(asset);
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => pick(asset)}
                      style={{
                        border: "1px solid #d3dae0",
                        borderRadius: 10,
                        padding: 8,
                        background: "#fff",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {url ? (
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
                          }}
                        />
                      )}
                      <span
                        style={{
                          font: 'var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif)',
                          letterSpacing: 0,
                          color: "#171717",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {asset.title || asset.fileName || asset.id}
                      </span>
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
