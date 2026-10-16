import { TYPO } from "./utils";
import LinkedItemCard from "./LinkedItemCard";

const GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "16px",
};

const EMPTY_STYLE = {
  ...TYPO.body,
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
  textAlign: "center",
  padding: "48px 16px",
  margin: 0,
};

/**
 * Grid of picker cards for the Linked Items modal. Each entry is
 * `{ item, type }` so one list can mix tasks and studies.
 */
export default function LinkedItemsList({
  entries,
  loading,
  isLinked,
  onLink,
  onUnlink,
  onPreview,
  onEdit,
  onCopy,
  myAssignments,
  showSources,
  emptyLabel,
  user,
  t,
}) {
  if (loading) {
    return <p style={EMPTY_STYLE}>{t("common.loading", "Loading...")}</p>;
  }
  if (entries.length === 0) {
    return <p style={EMPTY_STYLE}>{emptyLabel}</p>;
  }

  return (
    <div style={GRID_STYLE}>
      {entries.map(({ item, type }) => (
        <LinkedItemCard
          key={`${type}-${item.id}`}
          item={item}
          type={type}
          isSelected={isLinked(item, type)}
          connect={(it) => onLink(it, type)}
          disconnect={(it) => onUnlink(it, type)}
          onPreview={onPreview}
          onEdit={onEdit}
          onCopy={onCopy}
          myAssignments={myAssignments}
          showSources={showSources}
          user={user}
          t={t}
        />
      ))}
    </div>
  );
}
