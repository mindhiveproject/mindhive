import DropdownMenu from "../../../DesignSystem/DropdownMenu";
import IconButton from "../../../DesignSystem/IconButton";
import { EditIcon, FileCopyIcon, MoreVertIcon } from "../../../DesignSystem/Icons";

const ICON_STYLE = { color: "var(--MH-Theme-Accent-Dark, #5d5763)" };

// Row actions for the class Assignments / Resources tables: a quick button for
// the most common action — edit, or copy when authorship blocks editing — plus
// a kebab menu for the rest.
export default function RowActionsMenu({
  items,
  ariaLabel,
  disabled = false,
  onEdit = null,
  editLabel = "Edit",
  onCopy = null,
  copyLabel = "Make a copy and edit",
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {onEdit && (
        <IconButton
          variant="text"
          icon={<EditIcon />}
          ariaLabel={editLabel}
          title={editLabel}
          onClick={onEdit}
          disabled={disabled}
          style={ICON_STYLE}
        />
      )}
      {!onEdit && onCopy && (
        <IconButton
          variant="text"
          icon={<FileCopyIcon />}
          ariaLabel={copyLabel}
          title={copyLabel}
          onClick={onCopy}
          disabled={disabled}
          style={ICON_STYLE}
        />
      )}
      <DropdownMenu
        ariaLabel={ariaLabel}
        // Portal: AG Grid clips overflow and stacks each row separately, so an
        // in-cell panel gets cut off and painted over by the rows below it.
        portal
        renderTrigger={({ onClick, open, ariaLabel: label, ariaControls }) => (
          <IconButton
            variant="text"
            icon={<MoreVertIcon />}
            ariaLabel={label}
            title={label}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls={ariaControls}
            onClick={onClick}
            disabled={disabled}
            style={ICON_STYLE}
          />
        )}
        items={items}
      />
    </div>
  );
}
