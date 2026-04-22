// components/DataJournal/Widgets/types/StatisticTest/Controller/StatisticalTestEditor.js
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import { useDataJournal } from "../../../../Context/DataJournalContext";
import Chip from "../../../../../../../DesignSystem/Chip";

import CodeEditor from "./CodeEditor";

import AxesDefault from "./Axes/AxesDefault";
import AxesTtest from "./Axes/AxesTtest";
import AxesAnova from "./Axes/AxesAnova";
import AxesPearsonCorr from "./Axes/AxesPearson";

export default function StatisticalTestEditor({
  content,
  onChange,
  sectionId,
}) {
  const { t } = useTranslation("builder");
  const { variables } = useDataJournal();

  const [activeTab, setActiveTab] = useState(0);

  const code = content?.code || "";
  const type = content?.type || "";

  const AxisMap = {
    tTest: AxesTtest,
    oneWayAnova: AxesAnova,
    pearsonCorr: AxesPearsonCorr,
  };

  const AxesComp = AxisMap[type] || AxesDefault;

  const iconStyle = { width: 16, height: 16, display: "block" };

  const tabItems = [
    {
      label: t("dataJournal.statTest.editor.tabs.variables", {}, { default: "Variables" }),
      icon: <img src="/assets/icons/settingsViz.svg" alt="" aria-hidden style={iconStyle} />,
      content: (
        <div style={{ padding: "1rem" }}>
          <AxesComp
            sectionId={sectionId}
            selectors={content?.selectors || {}}
            onChange={onChange}
            variables={variables}
          />
        </div>
      ),
    },
    {
      label: t("dataJournal.statTest.editor.tabs.code", {}, { default: "Code" }),
      icon: <img src="/assets/icons/code.svg" alt="" aria-hidden style={iconStyle} />,
      content: (
        <CodeEditor sectionId={sectionId} code={code} onChange={onChange} />
      ),
    },
  ];

  return (
    <div className="graph">
      {/* <h3>Statistical Test: {type ? type.toUpperCase() : "New"}</h3> */}
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
