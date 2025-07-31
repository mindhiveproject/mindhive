import { useCallback, useMemo } from "react";
import { StyledDataComponent } from "../styles/StyledDataJournal";
import JoditEditor from "../../../../Jodit/Editor";

import Graph from "./Graph/Main";

export default function ComponentEditor({
  component,
  onChange,
  onSave,
  onDelete,
  pyodide,
  data,
  variables,
}) {
  const { type } = component;

  const content = useMemo(
    () => component?.content || { text: "" },
    [component]
  );

  const handleSave = useCallback(() => {
    onSave();
  }, [content, onSave]);

  // Render content based on component type
  const renderContent = () => {
    switch (type) {
      case "PARAGRAPH":
        return (
          <div>
            <JoditEditor
              content={content?.text || ""}
              setContent={(newContent) => {
                onChange({
                  componentId: component?.id,
                  newContent: { text: newContent },
                });
              }}
            />
          </div>
        );

      case "TABLE":
        return <div>TABLE component</div>;

      case "GRAPH":
        return (
          <Graph
            content={content}
            handleContentChange={(newContent) => {
              console.log({ newContent });
              onChange({
                componentId: component?.id,
                newContent: newContent?.newContent,
              });
            }}
            pyodide={pyodide}
            sectionId={component?.id}
            data={data}
            variables={variables}
          />
        );

      default:
        return <div>Unsupported component type: {type}</div>;
    }
  };

  return (
    <StyledDataComponent>
      {renderContent()}
      <button onClick={handleSave}>Save</button>
      <button onClick={onDelete}>Delete</button>
    </StyledDataComponent>
  );
}
