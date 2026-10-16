import { stripHtml, TYPO } from "./utils";
import { getLinkedItemActions } from "../../../../lib/linkedItemActions";
import Button from "../../../DesignSystem/Button";
import IconButton from "../../../DesignSystem/IconButton";
import Chip from "../../../DesignSystem/Chip";
import {
  EditIcon,
  FileCopyIcon,
  LinkIcon,
  LinkOffIcon,
  VisibilityIcon,
} from "../../../DesignSystem/Icons";

const cardStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  border: "1px solid #e0e0e0",
  borderRadius: "12px",
  padding: "16px",
  background: "#ffffff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  transition: "box-shadow 0.3s ease",
  height: "fit-content",
  minWidth: 0,
};

const ROW_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "4px",
};

const ACTIONS_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "8px",
  marginTop: "4px",
};

// Text buttons share a row and wrap below each other when the card is narrow.
const TEXT_BUTTON_STYLE = { flex: "1 1 140px", whiteSpace: "nowrap" };

const NOTE_STYLE = {
  ...TYPO.label,
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
  margin: 0,
};

export default function LinkedItemCard({
  item,
  type,
  isSelected,
  connect,
  disconnect,
  onPreview,
  onEdit,
  onCopy,
  myAssignments,
  showSources = false,
  user,
  t,
  style: styleOverride,
}) {
  const isAssignment = type === "assignment";
  const actions = getLinkedItemActions(item, type, user);

  // Classes where the user already has a copy of this assignment template.
  const myCopies = isAssignment
    ? myAssignments?.assignments?.filter((a) => a.templateSource?.id === item.id) || []
    : [];
  const copiedClasses = myCopies
    .flatMap((a) => a.classes || [])
    .filter((cls, idx, self) => self.findIndex((c) => c.id === cls.id) === idx);

  const sourceLabels = {
    class: t("board.expendedCard.thisClass", "This class"),
    mine: t("board.expendedCard.sourceMine", "Mine"),
    public: t("board.expendedCard.sourcePublic", "Public"),
  };
  const metaChips = [
    ...(type === "task"
      ? [{ key: "type", label: t("board.expendedCard.tasks", "Tasks") }]
      : []),
    ...(type === "study"
      ? [{ key: "type", label: t("board.expendedCard.studies", "Studies") }]
      : []),
    ...(showSources
      ? (item?.sources || []).map((source) => ({
          key: source,
          label: sourceLabels[source],
          tone: source === "class" ? "info" : "default",
        }))
      : []),
    // Published-to-students status only matters for your own assignments.
    ...(isAssignment && actions.edit
      ? [
          {
            key: "published",
            label: item?.public
              ? t("assignment.published", "Published")
              : t("assignment.unpublished", "Unpublished"),
            tone: item?.public ? "success" : "neutral",
          },
        ]
      : []),
  ];

  const editLabel = t("boardManagement.edit", "Edit");
  const previewLabel = t("boardManagement.preview", "Preview");

  return (
    <div
      style={{ ...cardStyle, ...styleOverride }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)")
      }
    >
      <h2 style={{ ...TYPO.titleS, color: "#333", margin: 0, overflowWrap: "anywhere" }}>
        {stripHtml(item?.title) || "Untitled"}
      </h2>

      {metaChips.length > 0 && (
        <div style={ROW_STYLE}>
          {metaChips.map((chip) => (
            <Chip key={chip.key} variant="static" tone={chip.tone} label={chip.label} />
          ))}
        </div>
      )}

      {actions.copy && copiedClasses.length > 0 && (
        <>
          <p style={NOTE_STYLE}>{t("board.expendedCard.alreadyHaveCopy")}</p>
          <div style={ROW_STYLE}>
            {copiedClasses.map((cls) => (
              <Chip key={cls.id} variant="static" label={stripHtml(cls.title)} />
            ))}
          </div>
        </>
      )}

      <div style={ACTIONS_STYLE}>
        {actions.link && (
          <Button
            variant={isSelected ? "outline" : "filled"}
            leadingIcon={isSelected ? <LinkOffIcon /> : <LinkIcon />}
            onClick={() => (isSelected ? disconnect(item) : connect(item))}
            style={TEXT_BUTTON_STYLE}
          >
            {isSelected
              ? t("board.expendedCard.disconnect")
              : t("board.expendedCard.connect")}
          </Button>
        )}
        {actions.copy && (
          <Button
            variant={actions.link ? "outline" : "filled"}
            leadingIcon={<FileCopyIcon />}
            onClick={() => onCopy?.(item, type)}
            style={TEXT_BUTTON_STYLE}
          >
            {t("board.expendedCard.copyAndLink", "Copy & link")}
          </Button>
        )}
        {actions.edit && (
          <IconButton
            variant="text"
            style={{ color: "var(--MH-Theme-Primary-Dark, #337C84)" }}
            icon={<EditIcon style={{ width: 20, height: 20 }} />}
            onClick={() => onEdit?.(item, type)}
            ariaLabel={editLabel}
            title={editLabel}
            />
          )}
        {actions.preview && (
          <IconButton
          variant="text"
          style={{ color: "var(--MH-Theme-Primary-Dark, #337C84)" }}
            icon={<VisibilityIcon style={{ width: 20, height: 20 }} />}
            onClick={() => onPreview?.(item, type)}
            ariaLabel={previewLabel}
            title={previewLabel}
          />
        )}
      </div>
    </div>
  );
}
