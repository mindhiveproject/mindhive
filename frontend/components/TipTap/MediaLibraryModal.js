"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import Button from "../DesignSystem/Button";
import Chip from "../DesignSystem/Chip";
import InfoTooltip from "../DesignSystem/InfoTooltip";
import JustOneSecondNotice from "../DesignSystem/JustOneSecondNotice";
import {
  MEDIA_ASSETS,
  CREATE_MEDIA_ASSET,
  UPDATE_MEDIA_ASSET,
  DELETE_MEDIA_ASSET,
  MEDIA_LIBRARY_PROFILE_ID,
  buildMediaAssetCreateData,
  mediaCreateHasOwnerFromSource,
  resolveMediaAssetUrl,
} from "../Mutations/MediaAsset";

const FAVORITE_ICON_OUTLINE = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M12 4.5l2.09 4.24L19 9.27l-3.5 3.41.83 4.85L12 15.9l-4.33 2.28.83-4.85L5 9.27l4.91-.53L12 4.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const FAVORITE_ICON_FILLED = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M12 3l2.47 5.01L20 8.9l-4 3.9.94 5.5L12 16.35 7.06 18.3 8 12.8 4 8.9l5.53-.89L12 3z"
      fill="currentColor"
    />
  </svg>
);

function displayLabel(asset, untitled) {
  if (asset == null) return untitled;
  const title =
    typeof asset.title === "string" ? asset.title.trim() : "";
  if (title) return title;
  const fn =
    typeof asset.fileName === "string" ? asset.fileName.trim() : "";
  if (fn) return fn;
  if (asset.id) {
    const short = String(asset.id).slice(0, 8);
    return `${untitled} (${short}…)`;
  }
  return untitled;
}

/** Portaled preview so AG Grid scroll/clipping does not crop the hover panel. */
function MediaThumbPreviewPortal({ url, open, anchorRect }) {
  if (!open || !anchorRect || typeof document === "undefined") return null;
  const maxW = 420;
  const maxH = 360;
  const gap = 10;
  let top = anchorRect.bottom + gap;
  let left = anchorRect.left + anchorRect.width / 2 - maxW / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - maxW - 12));
  if (top + maxH > window.innerHeight - 12) {
    top = Math.max(12, anchorRect.top - maxH - gap);
  }

  return createPortal(
    <div
      style={{
        position: "fixed",
        left,
        top,
        zIndex: 10100,
        width: maxW,
        padding: 10,
        background: "#ffffff",
        border: "1px solid #5D5763",
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        pointerEvents: "none",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <img
        src={url}
        alt=""
        style={{
          maxWidth: "100%",
          maxHeight: 340,
          width: "auto",
          height: "auto",
          objectFit: "contain",
          display: "block",
          margin: "0 auto",
          borderRadius: 8,
        }}
      />
    </div>,
    document.body,
  );
}

function MediaLibraryThumbCell(params) {
  const { data } = params;
  const ctx = params.context;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!data) return null;
  const insertAria = ctx.t("tiptap.mediaInsertThisAria", "Insert this image");

  const resolvedUrl = resolveMediaAssetUrl(data);
  if (!resolvedUrl) {
    return (
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 6,
          background: "#E6E6E6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "#6A6A6A",
        }}
        aria-hidden
      >
        —
      </div>
    );
  }

  const clearTimers = () => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    showTimerRef.current = null;
    hideTimerRef.current = null;
  };

  const handleEnter = (e) => {
    clearTimers();
    const el = e.currentTarget;
    showTimerRef.current = setTimeout(() => {
      setAnchorRect(el.getBoundingClientRect());
      setPreviewOpen(true);
    }, 180);
  };

  const handleLeave = () => {
    clearTimers();
    hideTimerRef.current = setTimeout(() => {
      setPreviewOpen(false);
      setAnchorRect(null);
    }, 100);
  };

  return (
    <>
      <MediaThumbPreviewPortal
        url={resolvedUrl}
        open={previewOpen}
        anchorRect={anchorRect}
      />
      <button
        type="button"
        onClick={() => ctx.pick(data)}
        aria-label={insertAria}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          border: "none",
          padding: 0,
          cursor: "pointer",
          borderRadius: 6,
          overflow: "hidden",
          background: "transparent",
          lineHeight: 0,
        }}
      >
        <img
          src={resolvedUrl}
          alt=""
          width={40}
          height={40}
          style={{ objectFit: "cover", display: "block" }}
        />
      </button>
    </>
  );
}

function MediaLibraryActionsCell(params) {
  const { data } = params;
  const ctx = params.context;
  if (!data) return null;
  const myProfileId = ctx.myProfileId;
  const isOwner = myProfileId && data.author?.id === myProfileId;
  const isFav =
    myProfileId && (data.favoriteBy || []).some((f) => f.id === myProfileId);
  const favLabel = isFav
    ? ctx.t("tiptap.mediaUnfavoriteAria", "Remove favorite")
    : ctx.t("tiptap.mediaFavoriteAria", "Add favorite");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        gap: 6,
        alignItems: "center",
        justifyContent: "flex-end",
        width: "100%",
        minHeight: 36,
        padding: "4px 0",
        boxSizing: "border-box",
        overflowX: "auto",
      }}
    >
      {myProfileId && (
        <Chip
          shape="pill"
          ariaLabel={favLabel}
          title={favLabel}
          leading={isFav ? FAVORITE_ICON_FILLED : FAVORITE_ICON_OUTLINE}
          label=""
          selected={isFav}
          onClick={() => void ctx.toggleFavorite(data)}
          style={{
            paddingLeft: 8,
            paddingRight: 8,
            flexShrink: 0,
            gap: 4,
            border: "none", 
          }}
        />
      )}
      <Chip
        shape="square"
        label={ctx.t("tiptap.mediaInsert", "Insert")}
        onClick={() => ctx.pick(data)}
        style={{ flexShrink: 0, border: "1px solid #A1A1A1" }}
      />
      <Chip
        shape="square"
        label={ctx.t("tiptap.mediaEdit", "Edit")}
        disabled={ctx.savingMeta}
        onClick={() => ctx.startEdit(data)}
        style={{ flexShrink: 0, border: "none" }}
      />
      {isOwner && (
        <Chip
          shape="square"
          label={ctx.t("tiptap.mediaDelete", "Delete")}
          onClick={() => void ctx.handleDelete(data)}
          style={{
            flexShrink: 0,
            color: "#B42318",
            borderColor: "#B42318",
            border: "none",
          }}
        />
      )}
    </div>
  );
}

const BACKDROP_STYLE = {
  position: "fixed",
  inset: 0,
  zIndex: 10050,
  background: "rgba(23, 23, 23, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  boxSizing: "border-box",
};

const PANEL_STYLE = {
  width: "100%",
  maxWidth: 960,
  maxHeight: "min(92vh, 900px)",
  display: "flex",
  flexDirection: "column",
  background: "#ffffff",
  borderRadius: 16,
  border: "1px solid #A1A1A1",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  overflow: "hidden",
  fontFamily: "Inter, sans-serif",
};

const HEADER_STYLE = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "20px 20px 12px",
  borderBottom: "1px solid #E6E6E6",
  flexShrink: 0,
};

const TITLE_ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flex: 1,
  minWidth: 0,
};

const TITLE_STYLE = {
  margin: 0,
  fontSize: 18,
  lineHeight: "24px",
  fontWeight: 600,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const BODY_STYLE = {
  padding: "16px 20px",
  overflowX: "hidden",
  overflowY: "auto",
  overscrollBehavior: "contain",
  WebkitOverflowScrolling: "touch",
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
};

const FOOTER_STYLE = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  padding: "12px 20px 20px",
  borderTop: "1px solid #E6E6E6",
  flexShrink: 0,
};

const LABEL_STYLE = {
  display: "block",
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 600,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
  marginBottom: 6,
};

const INPUT_STYLE = {
  width: "100%",
  minHeight: 40,
  padding: "10px 12px",
  border: "1px solid #A1A1A1",
  borderRadius: 8,
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  lineHeight: "20px",
  boxSizing: "border-box",
  color: "#171717",
};

const TEXTAREA_STYLE = {
  ...INPUT_STYLE,
  minHeight: 88,
  resize: "vertical",
};

const FIELD_GROUP_STYLE = { marginBottom: 14 };

const ERROR_BOX_STYLE = {
  borderRadius: 8,
  padding: "10px 12px",
  marginBottom: 16,
  background: "#FEF3F2",
  border: "1px solid #FECDCA",
  color: "#B42318",
  fontSize: 13,
  lineHeight: "18px",
};

const EDIT_PANEL_STYLE = {
  marginBottom: 16,
  padding: 16,
  border: "1px solid #A1A1A1",
  borderRadius: 8,
  background: "var(--MH-Theme-Neutrals-Lighter, #F3F3F3)",
  flexShrink: 0,
};

const EDIT_TITLE_STYLE = {
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 600,
  color: "var(--MH-Theme-Primary-Dark, #336F8A)",
  marginBottom: 14,
};

const ACTIONS_ROW_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
  flexShrink: 0,
};

const EMPTY_TEXT_STYLE = {
  margin: 0,
  fontSize: 14,
  lineHeight: "20px",
  color: "#6A6A6A",
};

const LOADING_WRAP_STYLE = {
  display: "flex",
  justifyContent: "center",
  padding: "24px 0",
  flex: 1,
  alignItems: "center",
};

const GRID_OUTER_STYLE = {
  flex: 1,
  minHeight: 320,
  display: "flex",
  flexDirection: "column",
  width: "100%",
};

const GRID_THEME_STYLE = {
  width: "100%",
  height: 420,
  minHeight: 320,
};

/**
 * @param {string | null} mediaScopeId - Proposal board id for default `createdInBoard` on upload when `mediaLibrarySource` does not set a createdIn* owner (not used to filter the grid; list is by author profile).
 */
export default function MediaLibraryModal({
  open,
  onClose,
  mediaScopeId,
  onInsertMedia,
  mediaLibrarySource = null,
  mediaDisplayedInProposalCardId = null,
  prefillImageFile = null,
  onPrefillConsumed = null,
  usedInVizSectionIds = null,
}) {
  const { t } = useTranslation("builder");
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  /** New image chosen locally; persisted only after Save. */
  const [pendingUploadFile, setPendingUploadFile] = useState(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
  const [editFileName, setEditFileName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMetaError, setEditMetaError] = useState(null);
  const [savingMeta, setSavingMeta] = useState(false);

  const { data: profileData } = useQuery(MEDIA_LIBRARY_PROFILE_ID, {
    skip: !open,
    fetchPolicy: "cache-first",
  });
  const myProfileId = profileData?.authenticatedItem?.id ?? null;

  const { data, loading, error, refetch } = useQuery(MEDIA_ASSETS, {
    variables: { profileId: myProfileId },
    skip: !open || !myProfileId,
    fetchPolicy: "network-only",
  });

  const canCreateUpload = Boolean(
    myProfileId &&
      (mediaScopeId || mediaCreateHasOwnerFromSource(mediaLibrarySource)),
  );

  const [createMediaAsset] = useMutation(CREATE_MEDIA_ASSET, {
    onCompleted: () => refetch(),
  });
  const [updateMediaAsset] = useMutation(UPDATE_MEDIA_ASSET, {
    onCompleted: () => refetch(),
  });
  const [deleteMediaAsset] = useMutation(DELETE_MEDIA_ASSET, {
    onCompleted: () => refetch(),
  });

  const images = useMemo(() => {
    const raw = data?.mediaAssets;
    if (!Array.isArray(raw)) return [];
    return raw.filter((row) => row && row.id);
  }, [data?.mediaAssets]);
  const untitled = t("tiptap.mediaUntitled", "Image");

  const pick = useCallback(
    (img) => {
      const resolvedUrl = resolveMediaAssetUrl(img);
      if (resolvedUrl && img?.id) {
        onInsertMedia?.({ id: img.id, url: resolvedUrl });
      }
      onClose();
    },
    [onInsertMedia, onClose],
  );

  const startEdit = useCallback((img) => {
    setPendingPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPendingUploadFile(null);
    setEditingId(img.id);
    setEditFileName(img.fileName || "");
    setEditTitle(img.title || "");
    setEditDescription(img.description || "");
    setEditMetaError(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setPendingPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPendingUploadFile(null);
    setEditingId(null);
    setEditMetaError(null);
  }, []);

  const toggleFavorite = useCallback(
    async (img) => {
      if (!myProfileId || !img?.id) return;
      const ids = (img.favoriteBy || []).map((f) => f.id);
      const isFav = ids.includes(myProfileId);
      try {
        await updateMediaAsset({
          variables: {
            id: img.id,
            data: {
              favoriteBy: isFav
                ? { disconnect: [{ id: myProfileId }] }
                : { connect: [{ id: myProfileId }] },
            },
          },
        });
      } catch (err) {
        console.error(err);
      }
    },
    [myProfileId, updateMediaAsset],
  );

  const handleDelete = useCallback(
    async (img) => {
      if (!img?.id) return;
      if (
        !window.confirm(
          t(
            "tiptap.mediaDeleteConfirm",
            "Delete this media from your library? Images already placed in content may show as broken.",
          ),
        )
      ) {
        return;
      }
      try {
        await deleteMediaAsset({ variables: { id: img.id } });
        setEditingId((cur) => (cur === img.id ? null : cur));
      } catch (err) {
        console.error(err);
        window.alert(
          t("tiptap.mediaDeleteFailed", "Could not delete this media."),
        );
      }
    },
    [deleteMediaAsset, t],
  );

  const saveEdit = useCallback(async () => {
    const fn = editFileName.trim();
    const tt = editTitle.trim();
    const desc = editDescription.trim();
    // Only title + fileName are required; description may be omitted (stored as null).
    if (!fn || !tt) {
      setEditMetaError(
        t(
          "tiptap.mediaEditFieldsRequired",
          "Title and file name cannot be empty.",
        ),
      );
      return;
    }
    if (!pendingUploadFile && !editingId) return;

    setEditMetaError(null);
    setSavingMeta(true);

    if (pendingUploadFile) {
      try {
        const createPayload = buildMediaAssetCreateData({
          scopeId: mediaScopeId,
          fileName: fn,
          title: tt,
          mediaLibrarySource,
          mediaDisplayedInProposalCardId,
          usedInVizSectionIds,
        });
        createPayload.description = desc || null;
        createPayload.image = { upload: pendingUploadFile };
        const { data: createData } = await createMediaAsset({
          variables: { data: createPayload },
        });
        const created = createData?.createMediaAsset;
        const createdUrl = resolveMediaAssetUrl(created);
        if (created?.id && createdUrl) {
          onInsertMedia?.({ id: created.id, url: createdUrl });
          setPendingPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
          setPendingUploadFile(null);
          setEditingId(null);
          setEditFileName("");
          setEditTitle("");
          setEditDescription("");
        } else {
          window.alert(
            t(
              "tiptap.mediaUploadFailed",
              "Upload failed. Check your connection and try again.",
            ),
          );
        }
      } catch (err) {
        console.error(err);
        window.alert(
          t(
            "tiptap.mediaUploadFailed",
            "Upload failed. Check your connection and try again.",
          ),
        );
      } finally {
        setSavingMeta(false);
      }
      return;
    }

    try {
      await updateMediaAsset({
        variables: {
          id: editingId,
          data: {
            fileName: fn,
            title: tt,
            description: desc || null,
          },
        },
      });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      window.alert(
        t(
          "tiptap.mediaSaveMetaFailed",
          "Could not save changes. Try again.",
        ),
      );
    } finally {
      setSavingMeta(false);
    }
  }, [
    pendingUploadFile,
    editingId,
    editFileName,
    editTitle,
    editDescription,
    createMediaAsset,
    mediaScopeId,
    mediaLibrarySource,
    mediaDisplayedInProposalCardId,
    usedInVizSectionIds,
    updateMediaAsset,
    onInsertMedia,
    t,
  ]);

  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setEditFileName("");
      setEditTitle("");
      setEditDescription("");
      setEditMetaError(null);
      setUploadError(null);
      setPendingPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setPendingUploadFile(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const uploadImageFile = useCallback(
    (file) => {
      if (!file || !myProfileId) return;
      if (!mediaScopeId && !mediaCreateHasOwnerFromSource(mediaLibrarySource)) {
        setUploadError(
          t(
            "tiptap.mediaNoCreateContext",
            "Cannot upload: missing board or library context.",
          ),
        );
        return;
      }
      if (!file.type?.startsWith?.("image/")) {
        setUploadError(
          t("tiptap.mediaNotImage", "Please choose an image file."),
        );
        return;
      }
      setUploadError(null);
      const baseName = file.name.replace(/\.[^.]+$/, "") || "";
      setPendingPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setPendingUploadFile(file);
      setEditingId(null);
      setEditFileName(baseName);
      setEditTitle(baseName || "");
      setEditDescription("");
      setEditMetaError(null);
    },
    [myProfileId, mediaScopeId, mediaLibrarySource, t],
  );

  const uploadImageFileRef = useRef(uploadImageFile);
  uploadImageFileRef.current = uploadImageFile;

  useEffect(() => {
    if (!open || !prefillImageFile || !myProfileId) return undefined;
    if (!mediaScopeId && !mediaCreateHasOwnerFromSource(mediaLibrarySource)) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      await uploadImageFileRef.current(prefillImageFile);
      if (!cancelled) onPrefillConsumed?.();
    })();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    prefillImageFile,
    myProfileId,
    mediaScopeId,
    mediaLibrarySource,
    onPrefillConsumed,
  ]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadImageFile(file);
  };

  const helpText = t(
    "tiptap.mediaLibraryHelp",
    "Upload once and reuse this image anywhere in your content.",
  );

  const gridContext = useMemo(
    () => ({
      pick,
      startEdit,
      toggleFavorite,
      handleDelete,
      myProfileId,
      editingId,
      t,
    }),
    [
      pick,
      startEdit,
      toggleFavorite,
      handleDelete,
      myProfileId,
      editingId,
      t,
    ],
  );

  const columnDefs = useMemo(
    () => [
      {
        colId: "preview",
        headerName: t("tiptap.mediaGridColPreview", "Preview"),
        headerTooltip: t(
          "tiptap.mediaPreviewTooltipAria",
          "Hover to see a larger preview",
        ),
        sortable: false,
        filter: false,
        suppressMovable: true,
        width: 84,
        maxWidth: 96,
        cellRenderer: MediaLibraryThumbCell,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          paddingLeft: 8,
          paddingRight: 4,
        },
      },
      {
        colId: "name",
        headerName: t("tiptap.mediaGridColName", "Name"),
        flex: 1.2,
        minWidth: 130,
        valueGetter: (p) => displayLabel(p.data, untitled),
        tooltipValueGetter: (p) => displayLabel(p.data, untitled),
      },
      {
        colId: "fileName",
        headerName: t("tiptap.mediaGridColFileName", "File name"),
        flex: 1,
        minWidth: 110,
        valueGetter: (p) => p.data?.fileName?.trim() || "",
        tooltipValueGetter: (p) => p.data?.fileName?.trim() || "",
      },
      {
        colId: "description",
        headerName: t("tiptap.mediaGridColDescription", "Description"),
        flex: 1.6,
        minWidth: 160,
        valueGetter: (p) => p.data?.description?.trim() || "",
        tooltipValueGetter: (p) => p.data?.description?.trim() || "",
      },
      {
        colId: "actions",
        headerName: t("tiptap.mediaGridColActions", "Actions"),
        sortable: false,
        filter: false,
        suppressMovable: true,
        width: 308,
        minWidth: 280,
        pinned: "right",
        cellRenderer: MediaLibraryActionsCell,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: 8,
        },
      },
    ],
    [t, untitled],
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: false,
      resizable: true,
      suppressHeaderMenuButton: true,
    }),
    [],
  );

  if (!open) return null;

  const modalTree = (
    <div
      style={BACKDROP_STYLE}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={PANEL_STYLE}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-library-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header style={HEADER_STYLE}>
          <div style={TITLE_ROW_STYLE}>
            <h2 id="media-library-modal-title" style={TITLE_STYLE}>
              {t("tiptap.mediaLibraryTitle", "Media library")}
            </h2>
            <InfoTooltip content={helpText} position="bottomLeft" />
          </div>
        </header>

        <div style={BODY_STYLE}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFile}
          />
          <Button
            type="button"
            variant="filled"
            disabled={!canCreateUpload || savingMeta}
            onClick={() => fileInputRef.current?.click()}
            style={{ marginBottom: 16, alignSelf: "flex-start" }}
            // leadingIcon={<img src="/assets/icons/upload.svg" alt="Upload" />}
          >
            {t("tiptap.mediaUploadNew", "Upload new image")}
          </Button>

          {uploadError && <div style={ERROR_BOX_STYLE}>{uploadError}</div>}

          {error && (
            <div style={ERROR_BOX_STYLE} role="alert">
              {t(
                "tiptap.mediaLibraryQueryError",
                "Could not load your media library.",
              )}{" "}
              <span style={{ fontWeight: 400 }}>{error.message}</span>
            </div>
          )}

          {(editingId || pendingUploadFile) && (
            <div style={EDIT_PANEL_STYLE}>
              <div style={EDIT_TITLE_STYLE}>
                {t("tiptap.mediaEditMeta", "Edit details")}
              </div>
              {pendingPreviewUrl && pendingUploadFile && (
                <div style={{ marginBottom: 14 }}>
                  <img
                    src={pendingPreviewUrl}
                    alt=""
                    style={{
                      maxWidth: "100%",
                      maxHeight: 200,
                      objectFit: "contain",
                      borderRadius: 8,
                      display: "block",
                    }}
                  />
                </div>
              )}
              {editMetaError && (
                <div style={{ ...ERROR_BOX_STYLE, marginBottom: 14 }}>
                  {editMetaError}
                </div>
              )}
              <div style={FIELD_GROUP_STYLE}>
                <label htmlFor="media-lib-title" style={LABEL_STYLE}>
                  {t("tiptap.mediaFieldTitle", "Title")}
                </label>
                <input
                  id="media-lib-title"
                  type="text"
                  required
                  aria-required="true"
                  value={editTitle}
                  onChange={(e) => {
                    setEditTitle(e.target.value);
                    setEditMetaError(null);
                  }}
                  style={INPUT_STYLE}
                />
              </div>
              <div style={FIELD_GROUP_STYLE}>
                <label htmlFor="media-lib-filename" style={LABEL_STYLE}>
                  {t("tiptap.mediaFieldFileName", "File name")}
                </label>
                <input
                  id="media-lib-filename"
                  type="text"
                  required
                  aria-required="true"
                  value={editFileName}
                  onChange={(e) => {
                    setEditFileName(e.target.value);
                    setEditMetaError(null);
                  }}
                  style={INPUT_STYLE}
                />
              </div>
              <div style={FIELD_GROUP_STYLE}>
                <label htmlFor="media-lib-desc" style={LABEL_STYLE}>
                  {t("tiptap.mediaFieldDescription", "Description")}
                  <span
                    style={{
                      fontWeight: 400,
                      color: "#6A6A6A",
                    }}
                  >
                    {" "}
                    (
                    {t(
                      "tiptap.mediaFieldDescriptionOptional",
                      "Optional",
                    )}
                    )
                  </span>
                </label>
                <textarea
                  id="media-lib-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={TEXTAREA_STYLE}
                  rows={3}
                  aria-required={false}
                  placeholder={t(
                    "tiptap.mediaDescriptionPlaceholder",
                    "Add notes if you like.",
                  )}
                />
              </div>
              <div style={{ ...ACTIONS_ROW_STYLE, marginTop: 4 }}>
                <Button
                  type="button"
                  variant="filled"
                  disabled={
                    savingMeta ||
                    !editTitle.trim() ||
                    !editFileName.trim()
                  }
                  onClick={() => void saveEdit()}
                >
                  {t("tiptap.mediaSaveMeta", "Save")}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  {t("tiptap.mediaCancelEdit", "Cancel")}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div style={LOADING_WRAP_STYLE}>
              <JustOneSecondNotice
                variant="codeRunning"
                message={{
                  h1: t("tiptap.mediaLibraryLoadingTitle", "Loading your library"),
                  p: t("tiptap.mediaLibraryLoadingBody", "Fetching saved images."),
                }}
                style={{ margin: 0 }}
              />
            </div>
          ) : error ? null : images.length === 0 ? (
            <p style={{ ...EMPTY_TEXT_STYLE, flex: 1 }}>
              {t("tiptap.mediaLibraryEmpty", "No images yet. Upload one to start.")}
            </p>
          ) : (
            <div style={GRID_OUTER_STYLE} className="media-library-grid-host">
              <div className="ag-theme-quartz" style={GRID_THEME_STYLE}>
                <AgGridReact
                  rowData={images}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  context={gridContext}
                  getRowId={(p) => String(p.data?.id ?? "")}
                  rowHeight={56}
                  headerHeight={44}
                  domLayout="normal"
                  enableCellTextSelection
                />
              </div>
            </div>
          )}
        </div>

        <footer style={FOOTER_STYLE}>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("tiptap.mediaLibraryClose", "Close")}
          </Button>
        </footer>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalTree, document.body);
}
