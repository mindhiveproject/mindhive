// components/DataJournal/Widgets/types/StatisticTest/Controller/StatisticalTestEditor.js
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import { useDataJournal } from "../../../../Context/DataJournalContext";
import Chip from "../../../../../../../DesignSystem/Chip";

import CodeEditor from "./CodeEditor";

import AxesComponent from "./Axes/AxesDefault";

export default function StatisticsEditor({ content, onChange, sectionId }) {
  const { t } = useTranslation("builder");
  const { variables } = useDataJournal();

  const [activeTab, setActiveTab] = useState(0);

  const code = content?.code || "";

  const iconStyle = { width: 16, height: 16, display: "block" };

  const tabItems = [
    {
      label: t("dataJournal.statistics.editor.tabs.variables", {}, { default: "Variables" }),
      icon: <img src="/assets/icons/settingsViz.svg" alt="" aria-hidden style={iconStyle} />,
      content: (
        <div style={{ padding: "1rem" }}>
          <AxesComponent
            sectionId={sectionId}
            selectors={content?.selectors || {}}
            onChange={onChange}
            variables={variables}
          />
        </div>
      ),
    },
    {
      label: t("dataJournal.statistics.editor.tabs.code", {}, { default: "Code" }),
      icon: <img src="/assets/icons/code.svg" alt="" aria-hidden style={iconStyle} />,
      content: (
        <CodeEditor sectionId={sectionId} code={code} onChange={onChange} />
      ),
    },
  ];

  return (
    <div className="graph">
      {/* <h3>Summary Statistics</h3> */}
      <div className="tabs">
        <div
          className="customTabs"
          style={{ display: "flex", justifyContent: "space-between", gap: "8px", width: "100%" }}
        >
          {tabItems.map((item, index) => (
            <Chip
              key={item.label}
              label={item.label}
              leading={item.icon}
              selected={activeTab === index}
              onClick={() => setActiveTab(index)}
              shape="square"
              style={activeTab === index ? { backgroundColor: "#F6F9F8" } : { border: "1px solid #F3F3F3" }}
            />
          ))}
        </div>
        {tabItems[activeTab]?.content}
      </div>
    </div>
  );
}
