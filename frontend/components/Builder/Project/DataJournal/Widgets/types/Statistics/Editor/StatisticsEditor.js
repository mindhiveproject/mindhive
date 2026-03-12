// components/DataJournal/Widgets/types/StatisticTest/Controller/StatisticalTestEditor.js

import { Tab } from "semantic-ui-react";
import { useState } from "react";

import { useDataJournal } from "../../../../Context/DataJournalContext";

import CodeEditor from "./CodeEditor";

import AxesComponent from "./Axes/AxesDefault";

export default function StatisticsEditor({ content, onChange, sectionId }) {
  const { variables } = useDataJournal();

  const [activeTab, setActiveTab] = useState(0);

  const code = content?.code || "";

  const panes = [
    {
      menuItem: "Variables",
      render: () => (
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
      menuItem: "Code",
      render: () => (
        <CodeEditor sectionId={sectionId} code={code} onChange={onChange} />
      ),
    },
  ];

  return (
    <div className="graph">
      {/* <h3>Summary Statistics</h3> */}

      <Tab
        panes={panes}
        activeIndex={activeTab}
        onTabChange={(e, { activeIndex }) => setActiveTab(activeIndex)}
      />
    </div>
  );
}
