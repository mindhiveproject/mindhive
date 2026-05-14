import { useMemo } from "react";
import useTranslation from "next-translate/useTranslation";

import DropdownMenu from "../../../../../../DesignSystem/DropdownMenu";

export default function Variable({
  column,
  onVariableChange,
  allowRename = false,
}) {
  const { t } = useTranslation("builder");

  const isHidden = !!column?.hide;
  const label = column?.displayName || column?.field;
  const hasDisplayName =
    typeof column?.displayName === "string" &&
    column.displayName.trim() !== "";
  /** Display name is metadata; cell editing still uses `column.editable` in the grid. */
  const canRename = allowRename && Boolean(column?.field);
  const canDelete = column?.type === "user";
  const showActionsMenu = canRename || canDelete;
  const showOriginalNameInMenu =
    hasDisplayName && Boolean(column?.field);

  const originalNameInMenuLabel = t(
    "dataJournal.datasetMenu.variable.originalNameInMenu",
    { field: column?.field || "" },
    { default: "Original name: {{field}}" },
  );

  const moreMenuAria = t(
    "dataJournal.datasetMenu.variable.moreActionsAria",
    { name: label },
    { default: "More actions for {{name}}" },
  );

  const toggleVisibility = () => {
    onVariableChange({
      variable: column?.field,
      property: "hide",
      value: !isHidden,
    });
  };

  const eyeIconSrc = isHidden
    ? "/assets/icons/eye_close.svg"
    : "/assets/icons/eye_open.svg";

  const eyeAriaLabel = isHidden
    ? t("dataJournal.datasetMenu.variable.showAria", { name: label }, {
        default: "Show {{name}}",
      })
    : t("dataJournal.datasetMenu.variable.hideAria", { name: label }, {
        default: "Hide {{name}}",
      });

  const menuItems = useMemo(() => {
    const field = column?.field;
    const items = [];
    if (canRename) {
      items.push({
        key: "rename",
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src="/assets/icons/visualize/edit.svg"
              alt=""
              aria-hidden="true"
              width={16}
              height={16}
              style={{ flexShrink: 0 }}
            />
            <span>
              {t("dataJournal.datasetMenu.variable.rename", {}, {
                default: "Rename",
              })}
            </span>
          </div>
        ),
        onClick: () => {
          const newName = prompt(
            t("dataJournal.datasetMenu.variable.renamePrompt", {}, {
              default: "Please enter new name:",
            }),
          );
          if (newName && newName !== "") {
            onVariableChange({
              variable: field,
              property: "displayName",
              value: newName,
            });
          }
        },
      });
    }
    if (canDelete) {
      items.push({
        key: "delete",
        danger: true,
        label: t("dataJournal.datasetMenu.variable.delete", {}, {
          default: "Delete",
        }),
        onClick: () => {
          onVariableChange({
            variable: field,
            property: "isDeleted",
            value: true,
          });
        },
      });
    }
    return items;
  }, [allowRename, canRename, canDelete, column?.field, onVariableChange, t]);

  return (
    <div className={isHidden ? "variableRow hidden" : "variableRow"}>
      <div className="variableRowHeader">
        <div className="variableRowLabel">
          <button
            type="button"
            className="variableEyeBtn"
            onClick={toggleVisibility}
            aria-label={eyeAriaLabel}
            aria-pressed={!isHidden}
            title={eyeAriaLabel}
          >
            <img src={eyeIconSrc} alt="" aria-hidden="true" />
          </button>
          <span className="variableRowName" title={label}>
            {label}
          </span>
        </div>
        {showActionsMenu ? (
          <div className="variableRowActions">
            <DropdownMenu
              ariaLabel={moreMenuAria}
              trigger={
                <img
                  src="/assets/icons/visualize/more_vert.svg"
                  alt=""
                  width={16}
                  height={16}
                  aria-hidden="true"
                />
              }
              panelHeader={
                showOriginalNameInMenu ? originalNameInMenuLabel : null
              }
              items={menuItems}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
