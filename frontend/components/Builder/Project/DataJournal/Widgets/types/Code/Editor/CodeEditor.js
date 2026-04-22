// components/DataJournal/Widgets/types/Code/Editor/CodeEditor.js

import useTranslation from "next-translate/useTranslation";

import Chip from "../../../../../../../DesignSystem/Chip";
import ScriptEditor from "./ScriptEditor";

export default function CodeEditor({ content, onChange, sectionId }) {
  const { t } = useTranslation("builder");
  const code = content?.code || "";

  const iconStyle = { width: 16, height: 16, display: "block" };

  const tabItems = [
    {
      label: t("dataJournal.code.editor.tabs.code", {}, { default: "Code" }),
      icon: <img src="/assets/icons/code.svg" alt="" aria-hidden style={iconStyle} />,
      content: (
        <ScriptEditor sectionId={sectionId} code={code} onChange={onChange} />
      ),
    },
  ];

  return (
    <div className="graph">
      {/* <h3>Code</h3> */}
      <div className="tabs">
        <div
          className="customTabs"
          style={{ display: "flex", justifyContent: "space-between", gap: "8px", width: "100%" }}
        >
          {tabItems.map((item) => (
            <Chip
              key={item.label}
              label={item.label}
              leading={item.icon}
              selected
              shape="square"
              style={{ backgroundColor: "#F6F9F8" }}
            />
          ))}
        </div>
        {tabItems[0]?.content}
      </div>
    </div>
  );
}
