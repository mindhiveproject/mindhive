import { useState } from "react";

export default function Tabs({
  user,
  study,
  infoBlocks,
  handleParameterChange,
  deleteParameter,
}) {
  const [tab, setTab] = useState("what");

  const addTab = () => {
    const existingTabs =
      study?.info?.filter((p) => p.name.startsWith("tab")) || [];
    const counter = existingTabs.length;
    const name = `tab-${counter + Date.now()}`;
    handleParameterChange(
      {
        target: {
          name,
          type: "text",
          value: "New Tab",
          className: "header",
        },
      },
      "header"
    );
  };

  const deleteTab = (name) => {
    deleteParameter(name);
  };

  const additionalTabs =
    study?.info?.filter((p) => p.name.startsWith("tab")) || [];

  const tabs = [
    // remove default tabs
    // Notion TICKET (February 7, 2025 4:26 PM) "Remove default Who/What/Why tab and only have “Add tab button”"
    // {
    //   name: "what",
    //   header: "What",
    // },
    // {
    //   name: "who",
    //   header: "Who",
    // },
    // {
    //   name: "why",
    //   header: "Why",
    // },
    // {
    //   name: "how",
    //   header: "How",
    // },
    ...additionalTabs,
  ];

  return (
    <>
      <div className="infoTabsContainer">
        <div className="menu">
          {tabs.map((atab, num) => (
            <div
              key={num}
              name={atab.name}
              active={tab === atab.name}
              onClick={() => setTab(atab.name)}
              className={
                tab === atab.name ? "menuTitle selectedMenuTitle" : "menuTitle"
              }
            >
              {atab.name.startsWith("tab") ? (
                <div className="tabHeaderContainer">
                  <input
                    type="text"
                    id={atab.name}
                    name={atab.name}
                    value={atab.header}
                    onChange={handleParameterChange}
                    className="header"
                  />
                  <span
                    onClick={() => {
                      deleteTab(atab.name);
                    }}
                  >
                    &times;
                  </span>
                </div>
              ) : (
                <p>{atab.header}</p>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            addTab();
          }}
        >
          Add Tab
        </button>
      </div>

      {tabs.map((atab, num) => (
        <div key={num}>
          {tab === atab.name && (
            <div>
              <textarea
                name={atab.name}
                value={infoBlocks[atab.name]}
                onChange={handleParameterChange}
                className="text"
                rows="10"
              />
            </div>
          )}
        </div>
      ))}
    </>
  );
}
