// components/DataJournal/Widgets/types/HypVis/Editor/HypVisEditor.js

import { Tab } from "semantic-ui-react";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import { useDataJournal } from "../../../../Context/DataJournalContext";

import CodeEditor from "./CodeEditor";

import AxesDefault from "./Axes/AxesDefault";
import AxesABDesign from "./Axes/AxesABDesign";
import AxesCorrAnalysis from "./Axes/AxesCorrAnalysis";

import OptionsDefault from "./Options/OptionsDefault";
import OptionsABDesign from "./Options/OptionsABDesign";
import OptionsCorrAnalysis from "./Options/OptionsCorrAnalysis";

export default function HypVisEditor({
  user,
  studyId,
  content,
  onChange,
  sectionId,
}) {
  const { t } = useTranslation("builder");
  const { pyodide, data, variables } = useDataJournal();

  const [activeTab, setActiveTab] = useState(0);

  const code = content?.code || "";
  const type = content?.type || "";

  const AxisTemplateMap = {
    abDesign: AxesABDesign,
    corStudy: AxesCorrAnalysis,
  };

  const OptionsTemplateMap = {
    abDesign: OptionsABDesign,
    corStudy: OptionsCorrAnalysis,
  };

  const AxesComp = AxisTemplateMap[type] || AxesDefault;
  const OptionsComp = OptionsTemplateMap[type] || OptionsDefault;

  const panes = [
    {
      menuItem: t(
        "dataJournal.hypVis.editor.variablesTab",
        "Variables",
      ),
      render: () => (
        <div className="hypvis-tab-pane">
          <AxesComp
            user={user}
            studyId={studyId}
            sectionId={sectionId}
            selectors={content?.selectors || {}}
            onChange={onChange}
            variables={variables}
            pyodide={pyodide}
          />
        </div>
      ),
    },
    {
      menuItem: t("dataJournal.hypVis.editor.codeTab", "Code"),
      render: () => (
        <CodeEditor sectionId={sectionId} code={code} onChange={onChange} />
      ),
    },
  ];

  return (
    <div className="graph">
      {/* <h3>Hypothesis visualizer: {type ? type.toUpperCase() : "New"}</h3> */}

      <Tab
        panes={panes}
        activeIndex={activeTab}
        onTabChange={(e, { activeIndex }) => setActiveTab(activeIndex)}
      />
    </div>
  );
}
