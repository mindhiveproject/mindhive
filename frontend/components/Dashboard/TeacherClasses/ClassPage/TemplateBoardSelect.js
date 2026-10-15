import useTranslation from "next-translate/useTranslation";
import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import {
  getClassTemplateBoards,
  getPrimaryTemplateBoardId,
} from "../../../../lib/classTemplateBoards";

/**
 * Board to open a connect/bulk-link modal on: the first class template board
 * the item is already linked on (so "Change link" lands where the links are),
 * otherwise the class's primary template board.
 */
export function getDefaultTemplateBoardId(myclass, linkedCards = []) {
  const boardIds = getClassTemplateBoards(myclass).map((board) => board.id);
  const linkedBoardIds = new Set(
    (linkedCards || []).map((card) => card?.section?.board?.id).filter(Boolean)
  );
  return (
    boardIds.find((id) => linkedBoardIds.has(id)) ||
    getPrimaryTemplateBoardId(myclass)
  );
}

/**
 * Template board picker for class-page linking modals. Renders nothing when
 * the class has a single template board, so those classes see no change.
 */
export default function TemplateBoardSelect({
  myclass,
  value,
  onChange,
  disabled,
}) {
  const { t } = useTranslation("classes");
  const boards = getClassTemplateBoards(myclass).filter((board) => board?.id);
  if (boards.length < 2) return null;

  const options = boards.map((board) => ({
    value: board.id,
    label:
      board.title ||
      t("boardManagement.linkToProjectCard.untitledBoard", {}, {
        default: "Untitled board",
      }),
  }));
  const label = t("boardManagement.linkToProjectCard.boardLabel", {}, {
    default: "Template board",
  });

  return (
    <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
      <span
        className="MH-Type-Title-Small"
        style={{ color: "var(--MH-Theme-Neutrals-Black, #171717)" }}
      >
        {label}
      </span>
      <DropdownSelect
        value={value || ""}
        onChange={(next) => {
          if (next) onChange(next);
        }}
        options={options}
        placeholder={t(
          "boardManagement.linkToProjectCard.selectBoardPlaceholder",
          {},
          { default: "Select a template board" }
        )}
        ariaLabel={label}
        disabled={disabled}
        searchableSingle
      />
    </div>
  );
}
