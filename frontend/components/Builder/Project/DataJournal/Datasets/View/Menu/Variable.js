import { Dropdown, DropdownMenu, DropdownItem } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

export default function Variable({ column, onVariableChange }) {
  const { t } = useTranslation("builder");

  const isHidden = !!column?.hide;
  const label = column?.displayName || column?.field;

  const onRename = ({ variable }) => {
    const newName = prompt(
      t("dataJournal.datasetMenu.variable.renamePrompt", {}, {
        default: "Please enter new name:",
      }),
    );
    if (newName && newName !== "") {
      onVariableChange({
        variable,
        property: "displayName",
        value: newName,
      });
    }
  };

  const onDelete = ({ variable }) => {
    onVariableChange({
      variable,
      property: "isDeleted",
      value: true,
    });
  };

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
        <div className="variableRowActions">
          <Dropdown
            icon={
              <img
                src="/assets/icons/visualize/more_vert.svg"
                alt=""
                aria-hidden="true"
              />
            }
            direction="left"
          >
            <DropdownMenu>
              <DropdownItem
                onClick={() => onRename({ variable: column?.field })}
              >
                <div className="menuItem">
                  <img
                    src="/assets/icons/visualize/edit.svg"
                    alt=""
                    aria-hidden="true"
                  />
                  <span className="menuItemLabel">
                    {t("dataJournal.datasetMenu.variable.rename", {}, {
                      default: "Rename",
                    })}
                  </span>
                </div>
              </DropdownItem>

              {column?.type === "user" && (
                <DropdownItem
                  onClick={() => onDelete({ variable: column?.field })}
                >
                  <div className="menuItem">
                    <img
                      src="/assets/icons/visualize/delete.svg"
                      alt=""
                      aria-hidden="true"
                    />
                    <span className="menuItemLabel">
                      {t("dataJournal.datasetMenu.variable.delete", {}, {
                        default: "Delete",
                      })}
                    </span>
                  </div>
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}
