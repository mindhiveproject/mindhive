// components/DataJournal/Widgets/types/Code/Editor/CodeEditor.js

import { Tab } from "semantic-ui-react";
import { useState } from "react";

import ScriptEditor from "./ScriptEditor";

export default function CodeEditor({ content, onChange, sectionId }) {
  const [activeTab, setActiveTab] = useState(0);

  const code = content?.code || "";

  const panes = [
    {
      menuItem: "Code",
      render: () => (
        <ScriptEditor sectionId={sectionId} code={code} onChange={onChange} />
      ),
    },
  ];

  return (
    <div className="graph">
      <h3>Code</h3>

      <Tab
        panes={panes}
        activeIndex={activeTab}
        onTabChange={(e, { activeIndex }) => setActiveTab(activeIndex)}
      />
    </div>
  );
}
