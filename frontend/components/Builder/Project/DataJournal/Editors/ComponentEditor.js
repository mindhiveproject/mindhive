// components/DataJournal/Editors/ComponentEditor.js
import { useDataJournal } from "../Context/DataJournalContext"; // Adjust path
import GraphEditor from "../Widgets/types/Graph/Editor/GraphEditor"; // Adjust path to GraphEditor
// Import other type-specific editors if needed (e.g., ParagraphEditor, TableEditor)

import { StyledRightPanel } from "../styles/StyledDataJournal"; // Adjust path if needed

export default function ComponentEditor({ onChange, onSave, onDelete }) {
  const { activeComponent, pyodide, data, variables } = useDataJournal();

  if (!activeComponent) return null;

  const { id, type, content } = activeComponent;

  // Render editor based on component type
  const renderEditor = () => {
    switch (type) {
      case "PARAGRAPH":
        // Placeholder for Paragraph editor (e.g., simple textarea)
        return (
          <div>
            <h3>Edit Paragraph</h3>
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
            <h3>Edit Table</h3>
            {/* Add table-specific config here */}
          </div>
        );
      case "GRAPH":
        return (
          <GraphEditor content={content} onChange={onChange} sectionId={id} />
        );
      default:
        return <div>Unsupported component type: {type}</div>;
    }
  };

  return (
    <StyledRightPanel>
      <div className="editor-header">
        <h2>Edit Component: {activeComponent?.title || "Untitled"}</h2>
        <div className="actions">
          <button onClick={onSave}>Save</button>
          <button
            onClick={onDelete}
            style={{ backgroundColor: "#ff4d4d", color: "white" }}
          >
            Delete
          </button>
        </div>
      </div>
      {renderEditor()}
    </StyledRightPanel>
  );
}
