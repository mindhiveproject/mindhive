// Shared chip strip for link_list / media_asset_list. In view/read-only mode,
// chip click opens a modal with optional description plus Open / Download.
import { useCallback, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import Modal from "../../../DesignSystem/Modal";

/** Ensure absolute http(s) URLs so navigation does not treat them as app routes. */
export function normalizeExternalUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^(https?:|mailto:|blob:|data:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return trimmed;
  return `https://${trimmed}`;
}

export function openExternalUrl(url) {
  const href = normalizeExternalUrl(url);
  if (!href) return;
  window.open(href, "_blank", "noopener,noreferrer");
}

function itemComment(item) {
  return (
    (typeof item?.comment === "string" && item.comment.trim()) ||
    (typeof item?.description === "string" && item.description.trim()) ||
    ""
  );
}

function chipTooltip(item) {
  const comment = itemComment(item);
  if (comment) return comment;
  const url = item?.url && String(item.url).trim();
  if (url) return url;
  return item?.label ? String(item.label) : undefined;
}

function downloadFilename(item, href) {
  const fromLabel =
    typeof item?.label === "string" ? item.label.trim().replace(/\s+/g, "-") : "";
  if (fromLabel && /\.[a-z0-9]{2,5}$/i.test(fromLabel)) return fromLabel;
  try {
    const path = new URL(href, window.location.origin).pathname || "";
    const file = path.split("/").filter(Boolean).pop();
    if (file) return decodeURIComponent(file);
  } catch {
    /* ignore */
  }
  return fromLabel || "download";
}

function downloadExternalUrl(url, item) {
  const href = normalizeExternalUrl(url);
  if (!href || typeof document === "undefined") return;
  const a = document.createElement("a");
  a.href = href;
  a.download = downloadFilename(item, href);
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * @param {{
 *   key: string,
 *   label: string,
 *   url?: string | null,
 *   comment?: string | null,
 *   description?: string | null,
 *   leading?: import("react").ReactNode,
 * }[]} items
 * @param {string} [emptyLabel]
 * @param {(item: object, index: number) => void} [onClose] - optional remove handler (edit mode)
 * @param {import("react").ReactNode} [leading] - default leading icon for all chips
 * @param {boolean} [previewModal=true] - when true, chip click opens detail modal
 * @param {"link"|"media"} [kind="link"] - copy for open/download actions
 */
export default function ResourceChipList({
  items,
  emptyLabel,
  onClose,
  leading,
  previewModal = true,
  kind = "link",
}) {
  const { t } = useTranslation("common");
  const [active, setActive] = useState(null);
  const list = Array.isArray(items) ? items.filter((item) => item?.label) : [];

  const closeModal = useCallback(() => setActive(null), []);

  const runPrimaryAction = useCallback(() => {
    if (!active?.url) return;
    if (kind === "media") {
      downloadExternalUrl(active.url, active);
      return;
    }
    openExternalUrl(active.url);
  }, [active, kind]);

  if (list.length === 0) {
    return emptyLabel ? (
      <span className="hint" style={{ fontStyle: "italic" }}>
        {emptyLabel}
      </span>
    ) : null;
  }

  const activeHref = active ? normalizeExternalUrl(active.url) : "";
  const activeComment = active ? itemComment(active) : "";
  const primaryLabel =
    kind === "media"
      ? t("definitionForm.resourcePreview.download", {}, {
          default: "Download",
        })
      : t("definitionForm.resourcePreview.openLink", {}, {
          default: "Open link",
        });

  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        {list.map((item, index) => {
          const href = normalizeExternalUrl(item.url);
          const tooltip = chipTooltip(item);
          const canPreview = previewModal && Boolean(item.label);
          const canLinkThrough = !previewModal && Boolean(href);

          const chip = (
            <Chip
              label={item.label}
              title={tooltip}
              leading={item.leading ?? leading}
              onClick={
                canPreview
                  ? () => setActive(item)
                  : canLinkThrough
                    ? () => openExternalUrl(item.url)
                    : undefined
              }
              onClose={
                typeof onClose === "function"
                  ? () => onClose(item, index)
                  : undefined
              }
              style={
                canPreview || canLinkThrough ? { cursor: "pointer" } : undefined
              }
            />
          );

          return (
            <span key={item.key || `${item.label}-${index}`}>{chip}</span>
          );
        })}
      </div>

      <Modal
        open={Boolean(active)}
        onClose={closeModal}
        title={active?.label || ""}
        maxWidth={480}
        actions={
          <>
            <Button type="button" variant="outline" onClick={closeModal}>
              {t("close", {}, { default: "Close" })}
            </Button>
            {activeHref ? (
              <Button type="button" variant="filled" onClick={runPrimaryAction}>
                {primaryLabel}
              </Button>
            ) : null}
          </>
        }
      >
        {activeComment ? (
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{activeComment}</p>
        ) : (
          <p style={{ margin: 0, fontStyle: "italic", color: "#a1a1a1" }}>
            {t("definitionForm.resourcePreview.noDescription", {}, {
              default: "No description provided.",
            })}
          </p>
        )}
      </Modal>
    </>
  );
}
