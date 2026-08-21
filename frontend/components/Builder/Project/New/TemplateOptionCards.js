import { getOptionKey } from "../../../../lib/classTemplateBoards";

export default function TemplateOptionCards({
  options,
  selectedKey,
  onSelect,
  t,
}) {
  if (!options?.length) return null;

  return (
    <div
      className="templateOptionCards"
      role="listbox"
      aria-label={t("newProject.selectTemplate", {}, {
        default: "Select template",
      })}
    >
      {options.map((option) => {
        const { board, class: myclass, origin } = option;
        const key = getOptionKey(option);
        const isSelected = key === selectedKey;
        const isPublic = origin === "public";

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
              {isPublic
                ? t("newProject.templatePublicLabel", {}, {
                    default: "Platform public template",
                  })
                : t(
                    "newProject.templateClassLabel",
                    { className: myclass?.title },
                    { default: "Class: {{className}}" }
                  )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
