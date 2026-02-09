"use client";

import { useState, useRef, useEffect } from "react";
import useTranslation from "next-translate/useTranslation";

const STATUS_ICON_MAP = {
  "In progress": "/assets/icons/status/inProgress.svg",
  Completed: "/assets/icons/status/completed.svg",
  "Help needed": "/assets/icons/status/helpNeeded.svg",
  Comments: "/assets/icons/status/comments.svg",
  "Not started": "/assets/icons/status/notStarted.svg",
  "Needs revision": "/assets/icons/status/TriangleWarning.svg",
};

const STATUS_STYLE_MAP = {
  "In progress": {
    backgroundColor: "#fdf2d0",
    color: "#666666",
  },
  Completed: {
    backgroundColor: "#def8fb",
    color: "#55808c",
  },
  "Help needed": {
    backgroundColor: "#edcecd",
    color: "#b9261a",
  },
  Comments: {
    backgroundColor: "#d8d3e7",
    color: "#7d70ad",
  },
  "Not started": {
    backgroundColor: "#f3f3f3",
    color: "#8a919d",
  },
  "Needs revision": {
    backgroundColor: "#8a2cf6",
    color: "#8a919d",
  },
};

const DEFAULT_STATUS = "Completed";

function getStatusIcon(status) {
  return STATUS_ICON_MAP[status] || STATUS_ICON_MAP[DEFAULT_STATUS];
}

function getStatusStyles(status) {
  return STATUS_STYLE_MAP[status] || STATUS_STYLE_MAP[DEFAULT_STATUS];
}

/**
 * Reusable status chip with optional dropdown for changing status.
 *
 * @param {string} value - Current status display value (e.g. "Completed", "In progress").
 * @param {(newValue: string) => void} onStatusChange - Called when user selects a new status.
 * @param {boolean} canEdit - Whether the chip is clickable and the dropdown is shown.
 * @param {boolean} loading - Disables interaction while a status update is in progress.
 * @param {Array<{ key: string, text: string, value: string, image: { src: string } }>} [options] - Optional override for dropdown options; defaults to standard status options with builder translations.
 */
export default function StatusChip({
  value,
  onStatusChange,
  canEdit = false,
  loading = false,
  options: optionsOverride,
}) {
  const { t } = useTranslation("builder");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const defaultOptions = [
    { key: "inProgress", text: t("statusCard.inProgress", "In progress"), value: "In progress", image: { src: "/assets/icons/status/inProgress.svg" } },
    { key: "completed", text: t("statusCard.completed", "Completed"), value: "Completed", image: { src: "/assets/icons/status/completed.svg" } },
    { key: "helpNeeded", text: t("statusCard.helpNeeded", "Help needed"), value: "Help needed", image: { src: "/assets/icons/status/helpNeeded.svg" } },
    { key: "comments", text: t("statusCard.comments", "Comments"), value: "Comments", image: { src: "/assets/icons/status/comments.svg" } },
    { key: "notStarted", text: t("statusCard.notStarted", "Not started"), value: "Not started", image: { src: "/assets/icons/status/notStarted.svg" } },
    { key: "needsRevision", text: t("statusCard.needsRevision", "Needs revision"), value: "Needs revision", image: { src: "/assets/icons/status/TriangleWarning.svg" } },
  ];

  const statusOptions = optionsOverride ?? defaultOptions;
  const statusText = value ?? DEFAULT_STATUS;
  const currentStatusStyles = getStatusStyles(statusText);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSelect = (newStatus) => {
    setDropdownOpen(false);
    onStatusChange?.(newStatus);
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", zIndex: dropdownOpen ? 1001 : "auto" }}>
      <div
        onClick={() => {
          if (canEdit && !loading) {
            setDropdownOpen(!dropdownOpen);
          }
        }}
        style={{
          backgroundColor: currentStatusStyles.backgroundColor,
          border: "1px solid #a1a1a1",
          borderRadius: "8px",
          padding: "6px 8px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          height: "32px",
          cursor: canEdit ? "pointer" : "default",
          userSelect: "none",
        }}
      >
        <img
          src={getStatusIcon(statusText)}
          alt=""
          draggable="false"
          style={{
            width: "18px",
            height: "18px",
          }}
        />
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            lineHeight: "20px",
            letterSpacing: "0.15px",
            color: currentStatusStyles.color,
          }}
        >
          {statusText}
        </span>
        {canEdit && (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              flexShrink: 0,
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <path d="M7 10L12 15L17 10H7Z" fill={currentStatusStyles.color} />
          </svg>
        )}
      </div>
      {canEdit && dropdownOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "4px",
            backgroundColor: "#ffffff",
            border: "1px solid #a1a1a1",
            borderRadius: "8px",
            boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
            overflow: "hidden",
            minWidth: "200px",
            zIndex: 10000,
          }}
        >
          {statusOptions.map((option) => {
            const optionStyles = getStatusStyles(option.value);
            const isSelected = option.value === statusText;
            return (
              <div
                key={option.key}
                onClick={() => handleSelect(option.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 8px",
                  backgroundColor: isSelected ? optionStyles.backgroundColor : "transparent",
                  color: optionStyles.color,
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: "14px",
                  lineHeight: "20px",
                  letterSpacing: "0.15px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <img
                  src={option.image.src}
                  alt=""
                  draggable="false"
                  style={{
                    width: "18px",
                    height: "18px",
                    flexShrink: 0,
                  }}
                />
                <span>{option.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { getStatusIcon, getStatusStyles, STATUS_ICON_MAP, STATUS_STYLE_MAP };
