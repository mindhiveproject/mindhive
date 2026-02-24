import { Icon } from "semantic-ui-react";
import { stripHtml, TYPO } from "./utils";

const styledChip = {
  display: "inline-flex",
  height: "fit-content",
  padding: "4px 8px 4px 8px",
  justifyContent: "center",
  alignItems: "center",
  flexShrink: "0",
  borderRadius: "8px",
  border: "1px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  maxWidth: "100%",
  wordBreak: "break-word",
};

const styledChipPublished = {
  display: "inline-flex",
  height: "24px",
  padding: "14px",
  justifyContent: "center",
  alignItems: "center",
  flexShrink: "0",
  borderRadius: "8px",
  background: "#DEF8FB",
  border: "1px solid #625B71",
  maxWidth: "100%",
  wordBreak: "break-word",
};

const styledChipUnpublished = {
  display: "inline-flex",
  height: "24px",
  padding: "14px",
  justifyContent: "center",
  alignItems: "center",
  flexShrink: "0",
  borderRadius: "8px",
  background: "#F3F3F3",
  border: "1px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  maxWidth: "100%",
  wordBreak: "break-word",
};

export default function LinkedItemsSearchFilters({
  searchQuery,
  onSearchChange,
  type,
  uniqueClasses = [],
  selectedPublishedFilter,
  selectedClassIds = [],
  onPublishedFilterToggle,
  onClassFilterToggle,
  t,
  placeholder,
}) {
  const searchPlaceholder =
    placeholder ?? t("board.expendedCard.searchPlaceholder", "Search by title...");

  return (
    <>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 40px 12px 40px",
              border: "1px solid #d0d5dd",
              borderRadius: "8px",
              ...TYPO.body,
            }}
          />
          <Icon
            name="search"
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6c757d",
              pointerEvents: "none",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                color: "#6c757d",
              }}
            >
              <Icon name="close" />
            </button>
          )}
        </div>
      </div>
      {type === "assignment" && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <button
            type="button"
            onClick={() => onPublishedFilterToggle?.(true)}
            style={{
              ...styledChipPublished,
              color: "#434343",
              backgroundColor: selectedPublishedFilter === true ? "#DEF8FB" : "#FFFFFF",
              borderColor: "#434343",
            }}
          >
            {t("assignment.published", "Published")}
          </button>
          <button
            type="button"
            onClick={() => onPublishedFilterToggle?.(false)}
            style={{
              ...styledChipUnpublished,
              color: "#434343",
              backgroundColor: selectedPublishedFilter === false ? "#EFEFEF" : "#FFFFFF",
              borderColor: "#434343",
            }}
          >
            {t("assignment.unpublished", "Unpublished")}
          </button>
          {uniqueClasses.length > 0 && (
            <>
              <span style={{ margin: "0 8px", color: "#A1A1A1" }}>|</span>
              {uniqueClasses.map((cls) => {
                const isSelected = selectedClassIds.includes(cls.id);
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => onClassFilterToggle?.(cls.id)}
                    style={{
                      ...styledChip,
                      backgroundColor: isSelected ? "#FDF2D0" : "#FFFFFF",
                      borderColor: "#434343",
                      cursor: "pointer",
                      color: "#434343",
                    }}
                  >
                    {stripHtml(cls.title)}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </>
  );
}
