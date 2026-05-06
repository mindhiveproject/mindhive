// components/DataJournal/Widgets/types/Statistics/Editor/StatisticsEditor.js
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import { useDataJournal } from "../../../../Context/DataJournalContext";
import Chip from "../../../../../../../DesignSystem/Chip";

import CodeEditor from "./CodeEditor";

import AxesComponent from "./Axes/AxesDefault";

export default function StatisticsEditor({ content, onChange, sectionId }) {
  const { t } = useTranslation("builder");
  const { variables } = useDataJournal();
  const variablesToDisplay = variables.filter((column) => !column?.hide);

  const [activeTab, setActiveTab] = useState(0);

  const code = content?.code || "";

  const iconStyle = { width: 16, height: 16, display: "block" };

  const tabItems = [
    {
      label: t("dataJournal.statistics.editor.tabs.variables", {}, { default: "Variables" }),
      icon: <img src="/assets/icons/settingsViz.svg" alt="" aria-hidden style={iconStyle} />,
      content: (
        <div className="tabContent">
          <AxesComponent
            sectionId={sectionId}
            selectors={content?.selectors || {}}
            onChange={onChange}
            variables={variablesToDisplay}
          />
        </div>
      ),
    },
    {
      label: t("dataJournal.statistics.editor.tabs.code", {}, { default: "Code" }),
      icon: <img src="/assets/icons/code.svg" alt="" aria-hidden style={iconStyle} />,
      content: (
        <div className="tabContent">
          <CodeEditor sectionId={sectionId} code={code} onChange={onChange} />
        </div>
      ),
    },
  ];

  return (
    <div className="graph">
      <div className="tabs">
        <div className="customTabs">
          {tabItems.map((item, index) => (
            <Chip
              key={item.label}
              label={item.label}
              leading={item.icon}
              selected={activeTab === index}
              onClick={() => setActiveTab(index)}
              shape="square"
              style={activeTab === index ? { backgroundColor: "#FDF2D0" } : { border: "1px solid #F3F3F3" }}
            />
          ))}
        </div>
        {tabItems[activeTab]?.content}
      </div>
    </div>
  );
}
