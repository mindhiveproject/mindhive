// components/DataJournal/Widgets/types/StatisticTest/Controller/StatisticalTestEditor.js

import { Tab } from "semantic-ui-react";
import { useState } from "react";

import { useDataJournal } from "../../../../Context/DataJournalContext";

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
  const { pyodide, data, variables } = useDataJournal();

  const [activeTab, setActiveTab] = useState(0);

  const code = content?.code || "";
  const type = content?.type || "";

  const AxisMap = {
    tTest: AxesTtest,
    oneWayAnova: AxesAnova,
    pearsonCorr: AxesPearsonCorr,
  };

  const AxesComp = AxisMap[type] || AxesDefault;

  const panes = [
    {
      menuItem: "Variables",
      render: () => (
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
      menuItem: "Code",
      render: () => (
        <CodeEditor sectionId={sectionId} code={code} onChange={onChange} />
      ),
    },
  ];

  return (
    <div className="graph">
      {/* <h3>Statistical Test: {type ? type.toUpperCase() : "New"}</h3> */}

      <Tab
        panes={panes}
        activeIndex={activeTab}
        onTabChange={(e, { activeIndex }) => setActiveTab(activeIndex)}
      />
    </div>
  );
}
