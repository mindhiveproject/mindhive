import { useCallback, memo } from "react";
import styled from "styled-components";

// Styled container for the widget
const WidgetContainer = styled.div`
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  height: 100%;
  box-sizing: border-box;
  position: static;
`;

function Widget({
  id,
  type,
  content,
  isActive,
  onSelect,
  handleRemoveComponent,
}) {
  console.log(`Widget ${id} rendering, content:`, content);

  // Handle right-click to toggle editor
  const handleRightClick = useCallback(
    (e) => {
      e.preventDefault();
      console.log(
        `Widget ${id} right-clicked, calling onSelect with id: ${id}`
      );
      onSelect(id);
    },
    [id, onSelect]
  );

  // Render content based on component type
  const renderContent = () => {
    switch (type) {
      case "PARAGRAPH":
        return (
          <div>
            <div>{content?.text || "No text provided"}</div>
          </div>
        );
      default:
        return <div>Unsupported component type: {type}</div>;
    }
  };

  return (
    <WidgetContainer onContextMenu={handleRightClick}>
      {renderContent()}
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
