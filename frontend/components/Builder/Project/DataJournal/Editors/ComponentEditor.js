// components/DataJournal/Editors/ComponentEditor.js
import useTranslation from "next-translate/useTranslation";
import { useDataJournal } from "../Context/DataJournalContext";
import Button from "../../../../DesignSystem/Button";

import GraphEditor from "../Widgets/types/Graph/Editor/GraphEditor";
import StatisticalTestEditor from "../Widgets/types/StatisticalTests/Editor/StatisticalTestEditor";
import StatisticsEditor from "../Widgets/types/Statistics/Editor/StatisticsEditor";
import CodeEditor from "../Widgets/types/Code/Editor/CodeEditor";
import HypVisEditor from "../Widgets/types/HypVis/Editor/HypVisEditor";

import { StyledRightPanel } from "../styles/StyledDataJournal"; // Adjust path if needed

export default function ComponentEditor({
  user,
  studyId,
  onChange,
  onSave,
  onDelete,
}) {
  const { t } = useTranslation("builder");
  const { activeComponent, setActiveComponent } = useDataJournal();

  if (!activeComponent) return null;

  const { id, type, content } = activeComponent;
  const handleClosePanel = () => setActiveComponent(null);

  // Render editor based on component type
  const renderEditor = () => {
    switch (type) {
      case "PARAGRAPH":
        // Placeholder for Paragraph editor (e.g., simple textarea)
        return (
          <div>
            <h3>{t("dataJournal.componentEditor.editParagraph", "Edit Paragraph")}</h3>
            <textarea
              value={content?.text || ""}
              onChange={(e) =>
                onChange({
                  componentId: id,
                  newContent: { text: e.target.value },
                })
              }
              style={{ width: "100%", height: "200px" }}
            />
          </div>
        );
      case "TABLE":
        // Placeholder for Table editor (e.g., configure columns/filters)
        return (
          <div>
            {/* <h3>Edit Table</h3> */}
            {/* Add table-specific config here */}
          </div>
        );
      case "GRAPH":
        return (
          <GraphEditor content={content} onChange={onChange} sectionId={id} />
        );
      case "STATTEST":
        return (
          <StatisticalTestEditor
            content={content}
            onChange={onChange}
            sectionId={id}
          />
        );
      case "STATISTICS":
        return (
          <StatisticsEditor
            content={content}
            onChange={onChange}
            sectionId={id}
          />
        );
      case "CODE":
        return (
          <CodeEditor content={content} onChange={onChange} sectionId={id} />
        );
      case "HYPVIS":
        return (
          <HypVisEditor
            user={user}
            studyId={studyId}
            content={content}
            onChange={onChange}
            sectionId={id}
          />
        );
      default:
        return (
          <div>
            {t(
              "dataJournal.componentEditor.unsupportedType",
              { type },
              "Unsupported component type: {{type}}",
            )}
          </div>
        );
    }
  };

  return (
    <StyledRightPanel>
      <div className="editor-header">
        <h2>
          {t("dataJournal.componentEditor.editComponent", "Edit Component")}:{" "}
          {activeComponent?.title ||
            t("dataJournal.componentEditor.untitled", "Untitled")}
        </h2>
        <div className="actions">
          <Button variant="outline" onClick={handleClosePanel}>
            {t("dataJournal.componentEditor.close", "Close")}
          </Button>
          <Button variant="filled" onClick={onSave}>
            {t("dataJournal.componentEditor.save", "Save")}
          </Button>
          <Button variant="tonal" style={{ backgroundColor: "#8F1F14", color: "#FFFFFF" }} onClick={onDelete}>
            {t("dataJournal.componentEditor.delete", "Delete")}
          </Button>
        </div>
      </div>
      {renderEditor()}
    </StyledRightPanel>
  );
}
