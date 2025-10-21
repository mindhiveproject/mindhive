import { useCallback, memo } from "react";
import styled from "styled-components";

// sections
import Paragraph from "./Sections/Paragraph";
import Table from "./Sections/Table";
import Graph from "./Sections/Graph/Main";

// Styled container for the widget
const WidgetContainer = styled.div`
  display: grid;
  grid-template-rows: auto 1fr; /* Header and content */
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 100%;
  box-sizing: border-box;
  position: static;
`;

const WidgetHeader = styled.div`
  background: #e6e6e6;
  padding: 8px;
  cursor: move; /* Indicate draggable area */
  font-weight: bold;
  border-bottom: 1px solid #ccc;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Button = styled.button`
  background: ${(props) => (props.type === "edit" ? "#1890ff" : "#ff4d4f")};
  color: white;
  border: none;
  border-radius: 3px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 8px;
  &:hover {
    background: ${(props) => (props.type === "edit" ? "#40a9ff" : "#d9363e")};
  }
`;

const WidgetContent = styled.div`
  padding: 10px;
  height: 100%;
  overflow: auto; /* Handle overflow in content */
`;

function Widget({
  widget,
  id,
  type,
  content,
  isActive,
  onSelect,
  onChange,
  // handleRemoveComponent,
  pyodide,
  data,
  variables,
  settings,
}) {
  // const { id, type, content } = widget;

  const handleChange = useCallback(
    (content) => {
      onChange({
        componentId: id,
        value: content,
      });
    },
    [id, onChange]
  );

  // Handle edit button click
  const handleEdit = useCallback(
    (e) => {
      e.stopPropagation(); // Prevent triggering drag
      onSelect(widget);
    },
    [id, onSelect]
  );

  // Render content based on component type
  const renderContent = () => {
    switch (type) {
      case "PARAGRAPH":
        return (
          <Paragraph content={content} handleContentChange={handleChange} />
        );
      case "TABLE":
        return <Table data={data} variables={variables} settings={settings} />;
      case "GRAPH":
        return (
          <Graph
            content={content}
            handleContentChange={handleChange}
            pyodide={pyodide}
            sectionId={id}
            data={data}
            variables={variables}
          />
        );
      default:
        return <div>Unsupported component type: {type}</div>;
    }
  };

  return (
    <WidgetContainer className={isActive ? "active" : ""}>
      <WidgetHeader className="widget-header">
        <div></div>
      </WidgetHeader>
      <WidgetContent onClick={handleEdit}>{renderContent()}</WidgetContent>
    </WidgetContainer>
  );
}

export default memo(Widget, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.type === nextProps.type &&
    prevProps.content === nextProps.content &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.handleRemoveComponent === nextProps.handleRemoveComponent
  );
});
