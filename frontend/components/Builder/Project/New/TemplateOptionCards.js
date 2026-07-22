import { getTemplateOptionKey } from "../../../../lib/classTemplateBoards";

export default function TemplateOptionCards({
  options,
  selectedKey,
  onSelect,
  t,
}) {
  if (!options?.length) return null;

  return (
    <div className="templateOptionCards" role="listbox" aria-label={t("newProject.selectTemplate", {}, { default: "Select template" })}>
      {options.map(({ board, class: myclass }) => {
        const key = getTemplateOptionKey(board, myclass);
        const isSelected = key === selectedKey;

        return (
          <button
            key={key}
            type="button"
            role="option"
            aria-selected={isSelected}
            className={
              isSelected
                ? "templateOptionCard templateOptionCardSelected"
                : "templateOptionCard"
            }
            onClick={() => onSelect(key)}
          >
            <span className="templateOptionCardTitle">{board.title}</span>
            <span className="templateOptionCardClass">
              {t(
                "newProject.templateClassLabel",
                { className: myclass.title },
                { default: "Class: {{className}}" }
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
