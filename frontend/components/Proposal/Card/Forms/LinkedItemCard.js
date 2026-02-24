import { Icon } from "semantic-ui-react";
import { stripHtml, TYPO } from "./utils";

const cardStyle = {
  border: "1px solid #e0e0e0",
  borderRadius: "12px",
  padding: "16px",
  background: "#ffffff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  transition: "box-shadow 0.3s ease",
  height: "fit-content",
};

const styledPrimaryButton = {
  height: "30px",
  padding: "8px 16px 8px 16px",
  justifyContent: "center",
  gap: "8px",
  flexShrink: 0,
  width: "100%",
  display: "inline-flex",
  alignItems: "center",
  margin: "1rem 0",
  background: "#336F8A",
  color: "white",
  borderRadius: "100px",
  ...TYPO.bodyMedium,
  cursor: "pointer",
  transition: "background 0.3s ease",
  border: "none",
};

const styledSecondaryButtonBlue = {
  height: "30px",
  padding: "8px 16px 8px 16px",
  justifyContent: "center",
  gap: "8px",
  flexShrink: 0,
  width: "100%",
  display: "inline-flex",
  alignItems: "center",
  margin: "1rem 0",
  background: "white",
  color: "#3D85B0",
  borderRadius: "100px",
  ...TYPO.bodyMedium,
  cursor: "pointer",
  transition: "background 0.3s ease",
  border: "1.5px solid #3D85B0",
};

const styledAccentButtonPurple = {
  height: "30px",
  padding: "8px 16px 8px 8px",
  justifyContent: "center",
  gap: "8px",
  flexShrink: 0,
  width: "100%",
  display: "inline-flex",
  alignItems: "center",
  margin: "1rem 0",
  background: "white",
  color: "#7D70AD",
  borderRadius: "100px",
  ...TYPO.bodyMedium,
  cursor: "pointer",
  transition: "background 0.3s ease",
  border: "1.5px solid #7D70AD",
};

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

export default function LinkedItemCard({
  item,
  type,
  inPublicTab,
  tabIsPublic,
  isSelected,
  connect,
  disconnect,
  openAssignmentModal,
  openCopyModal,
  openResourceModal,
  myAssignments,
  proposal,
  user,
  t,
  style: styleOverride,
}) {
  const isTask = type === "task";
  const isStudy = type === "study";
  const isAssignment = type === "assignment";
  const isResource = type === "resource";
  const isTaskOrStudy = isTask || isStudy;

  let viewUrl = `/dashboard/${type}s/view?id=${item?.id}`;
  if (isTask) viewUrl = `/dashboard/discover/tasks?name=${item?.slug}`;
  if (isStudy) viewUrl = `/dashboard/discover/studies?name=${item?.slug}`;

  const hasChildAssignment =
    myAssignments?.assignments?.some((a) => a.templateSource?.id === item.id) || false;

  const cardContainerStyle = {
    ...cardStyle,
    ...(inPublicTab ? { marginBottom: "16px" } : {}),
    ...styleOverride,
  };

  return (
    <div
      style={cardContainerStyle}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)")
      }
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          ...(inPublicTab ? {} : { columnGap: "8px" }),
        }}
      >
        <h2 style={{ ...TYPO.titleS, color: "#333", margin: 0 }}>
          {stripHtml(item?.title) || "Untitled"}
        </h2>
        {item?.lastUpdate && inPublicTab ? (
          <p style={TYPO.label}>Last updated: {item?.lastUpdate}</p>
        ) : null}
      </div>

      {!inPublicTab && isResource && (
        <p>{item?.lastUpdate ? `Last updated: ${item?.lastUpdate}` : null}</p>
      )}

      {!inPublicTab && isAssignment && (
        <div
          style={{
            display: "flex",
            columnGap: "4px",
            rowGap: "8px",
            marginBottom: "8px",
            maxWidth: "100%",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={item?.public ? styledChipPublished : styledChipUnpublished}>
            <p
              style={{
                ...TYPO.labelSemibold,
                color: item?.public ? "#625B71" : undefined,
                margin: 0,
              }}
            >
              {item?.public ? "Published" : "Unpublished"}
            </p>
          </span>
          {item?.classes?.length ? (
            <>
              <p style={{ margin: "0px" }}>•</p>
              {item.classes.map((cls) => (
                <span key={cls.id} style={styledChip}>
                  <p
                    style={{
                      maxWidth: "100%",
                      wordBreak: "break-word",
                      whiteSpace: "normal",
                      overflowWrap: "anywhere",
                      margin: 0,
                    }}
                  >
                    {stripHtml(cls.title)}
                  </p>
                </span>
              ))}
            </>
          ) : null}
        </div>
      )}

      {inPublicTab && isResource && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <button
            onClick={() => (isSelected ? disconnect(item) : connect(item))}
            style={{
              ...(isSelected ? styledAccentButtonPurple : styledPrimaryButton),
              flex: "1 1 240px",
              maxWidth: "79%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={isSelected ? "unlink" : "linkify"} />
            {isSelected
              ? t("board.expendedCard.disconnect")
              : t("board.expendedCard.connect")}
          </button>
          <button
            onClick={() =>
              openResourceModal?.(item, { sourceType: "public" })
            }
            style={{
              ...styledSecondaryButtonBlue,
              flex: "0 1 120px",
              maxWidth: "19%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 16px",
            }}
            aria-label={t("boardManagement.edit", "Edit")}
          >
            <Icon name="copy" />
          </button>
        </div>
      )}

      {inPublicTab && (isTask || isStudy) && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            columnGap: "16px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => (isSelected ? disconnect(item) : connect(item))}
            style={
              isSelected ? styledAccentButtonPurple : styledPrimaryButton
            }
          >
            {isSelected ? (
              <Icon name="unlink" />
            ) : (
              <Icon name="linkify" />
            )}
            {isSelected
              ? t("board.expendedCard.disconnect")
              : t("board.expendedCard.connect")}
          </button>
          <button
            onClick={() =>
              window.open(viewUrl, "_blank", "noopener,noreferrer")
            }
            style={styledPrimaryButton}
          >
            <Icon name="eye" /> {t("boardManagement.preview", "Preview")}
          </button>
        </div>
      )}

      {inPublicTab && isAssignment && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            columnGap: "16px",
            flexWrap: "wrap",
          }}
        >
          {!hasChildAssignment ? (
            <button
              onClick={() => openCopyModal?.(item)}
              style={styledPrimaryButton}
            >
              <Icon name="copy outline" />{" "}
              {t("boardManagement.viewAndCopy", "View & Copy")}
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <p>{t("board.expendedCard.alreadyHaveCopy")}</p>
              <div
                style={{
                  display: "flex",
                  columnGap: "4px",
                  rowGap: "8px",
                  marginBottom: "8px",
                  maxWidth: "100%",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {myAssignments?.assignments
                  ?.filter((a) => a.templateSource?.id === item.id)
                  ?.flatMap((a) => a.classes || [])
                  ?.filter(
                    (cls, idx, self) =>
                      self.findIndex((c) => c.id === cls.id) === idx
                  )
                  ?.map((cls) => (
                    <span key={cls.id} style={styledChip}>
                      <p
                        style={{
                          maxWidth: "100%",
                          wordBreak: "break-word",
                          whiteSpace: "normal",
                          overflowWrap: "anywhere",
                          margin: 0,
                        }}
                      >
                        {stripHtml(cls.title)}
                      </p>
                    </span>
                  ))}
              </div>
              <button
                onClick={() => openCopyModal?.(item)}
                style={styledPrimaryButton}
              >
                <Icon name="copy outline" />{" "}
                {t("board.expendedCard.makeAdditionalCopy")}
              </button>
            </div>
          )}
        </div>
      )}

      {!inPublicTab && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <button
            onClick={() => (isSelected ? disconnect(item) : connect(item))}
            style={{
              ...(isSelected
                ? styledAccentButtonPurple
                : styledPrimaryButton),
              flex: "1 1 240px",
              maxWidth: "79%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={isSelected ? "unlink" : "linkify"} />
            {isSelected
              ? t("board.expendedCard.disconnect")
              : t("board.expendedCard.connect")}
          </button>
          {isAssignment && (
            <button
              onClick={() => openAssignmentModal?.(item)}
              style={{
                ...styledSecondaryButtonBlue,
                flex: "0 1 120px",
                maxWidth: "19%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 16px",
              }}
              aria-label={t("boardManagement.edit", "Edit")}
            >
              <Icon name="pencil" />
            </button>
          )}
          {(isTask || isStudy) && (
            <button
              onClick={() =>
                window.open(viewUrl, "_blank", "noopener,noreferrer")
              }
              style={{
                ...styledSecondaryButtonBlue,
                flex: "0 1 120px",
                maxWidth: "19%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 16px",
              }}
              aria-label={t("boardManagement.preview", "Preview")}
            >
              <Icon name="external" />
            </button>
          )}
          {isResource && (
            <button
              onClick={() =>
                openResourceModal?.(item, {
                  sourceType: tabIsPublic ? "public" : item?.parent?.id ? "custom" : "mine",
                })
              }
              style={{
                ...styledSecondaryButtonBlue,
                flex: "0 1 120px",
                maxWidth: "19%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 16px",
              }}
              aria-label={t("boardManagement.edit", "Edit")}
            >
              <Icon name="pencil" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
