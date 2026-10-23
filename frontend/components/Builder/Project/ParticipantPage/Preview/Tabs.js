import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

export default function Tabs({
  user,
  study,
  infoBlocks,
  handleParameterChange,
  deleteParameter,
}) {
  const { t } = useTranslation("builder");
  const [tab, setTab] = useState(null);

  // Default Who/What/Why tabs were removed (Notion, Feb 7 2025): only custom tabs.
  const tabs = study?.info?.filter((p) => p.name.startsWith("tab")) || [];
  const activeTab = tabs.find((atab) => atab.name === tab) || tabs[0];

  const addTab = () => {
    const name = `tab-${tabs.length + Date.now()}`;
    handleParameterChange(
      {
        target: {
          name,
          type: "text",
          value: t("tabs.newTab"),
          className: "header",
        },
      },
      "header"
    );
    setTab(name);
  };

  return (
    <div className="infoTabsContainer">
      <div className="infoTabsMenu" role="tablist">
        {tabs.map((atab) => (
          <div
            key={atab.name}
            role="tab"
            aria-selected={activeTab?.name === atab.name}
            onClick={() => setTab(atab.name)}
            className={
              activeTab?.name === atab.name
                ? "infoTab infoTab--active"
                : "infoTab"
            }
          >
            <input
              type="text"
              id={atab.name}
              name={atab.name}
              value={atab.header || ""}
              onChange={handleParameterChange}
              onFocus={() => setTab(atab.name)}
              size={Math.max((atab.header || "").length, 4)}
              className="header editable"
            />
            <button
              type="button"
              className="infoTabDelete"
              aria-label={t("tabs.deleteTab", {}, { default: "Delete tab" })}
              onClick={(e) => {
                e.stopPropagation();
                deleteParameter(atab.name);
              }}
            >
              &times;
            </button>
          </div>
        ))}
        <button type="button" className="infoTabAdd" onClick={addTab}>
          + {t("tabs.addTab")}
        </button>
      </div>

      {activeTab ? (
        <textarea
          key={activeTab.name}
          name={activeTab.name}
          aria-label={activeTab.header}
          placeholder={t("tabs.contentPlaceholder", {}, {
            default: "Write what participants should know…",
          })}
          value={infoBlocks[activeTab.name] || ""}
          onChange={handleParameterChange}
          className="text editable infoTabContent"
          rows={4}
        />
      ) : (
        <p className="infoTabsEmpty">
          {t("tabs.empty", {}, {
            default:
              "Add tabs to tell participants more about your study (what, who, why…).",
          })}
        </p>
      )}
    </div>
  );
}
