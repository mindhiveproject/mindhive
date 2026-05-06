// components/DataJournal/Widgets/Widget.js
import { useCallback, memo, useEffect, useRef, useState } from "react";
import styled from "styled-components";

// Widget type-specific renderers
import Paragraph from "./types/Paragraph";
import Table from "./types/Table";
import Graph from "./types/Graph/Graph";
import StatisticalTest from "./types/StatisticalTests/StatisticalTest";
import Statistics from "./types/Statistics/Statistics";
import Code from "./types/Code/Code";
import HypVis from "./types/HypVis/HypVis";
import { useDataJournal } from "../Context/DataJournalContext";
import { WidgetSizeProvider } from "./WidgetSizeContext";

// Styled container for the widget
const WidgetContainer = styled.div`
  display: grid;
  background: transparent;
  border: 2px solid transparent;
  border-radius: 4px;
  height: 100%;
  box-sizing: border-box;
  position: static;
`;

const WidgetContent = styled.div`
  padding: 10px;
  height: 100%;
  overflow: auto; /* Handle overflow in content */
`;

const DRAG_DISTANCE_THRESHOLD = 6;

function Widget({
  widget,
  id,
  type,
  content,
  isActive,
  onSelect,
  onChange,
  // handleRemoveComponent, // Uncomment if needed
}) {
  const {
    setComponentFigureReady,
    clearComponentFigureReady,
    widgetResizeTicks,
  } = useDataJournal();
  const gridResizeTick = widgetResizeTicks[id] || 0;

  const containerRef = useRef(null);
  const [widgetSize, setWidgetSize] = useState({
    width: 0,
    height: 0,
    version: 0,
  });

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setWidgetSize((prev) => ({
      width: rect.width,
      height: rect.height,
      version: prev.version + 1,
    }));
  }, []);

  useEffect(() => {
    measure();
  }, [gridResizeTick, measure]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    let timeoutId;
    const scheduleMeasure = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => measure(), 150);
    };

    const ro = new ResizeObserver(scheduleMeasure);
    ro.observe(el);
    measure();

    return () => {
      window.clearTimeout(timeoutId);
      ro.disconnect();
    };
  }, [measure]);
  const gestureRef = useRef({
    isPointerDown: false,
    isDrag: false,
    startX: 0,
    startY: 0,
  });
  const listenersRef = useRef({
    moveHandler: null,
    upHandler: null,
  });

  const handleChange = useCallback(
    (newContent) => {
      onChange({
        componentId: id,
        value: newContent,
      });
    },
    [id, onChange],
  );

  const handlePointerDown = useCallback((e) => {
    gestureRef.current = {
      isPointerDown: true,
      isDrag: false,
      startX: e.clientX,
      startY: e.clientY,
    };

    const moveHandler = (moveEvent) => {
      if (!gestureRef.current.isPointerDown || gestureRef.current.isDrag) return;

      const deltaX = Math.abs(moveEvent.clientX - gestureRef.current.startX);
      const deltaY = Math.abs(moveEvent.clientY - gestureRef.current.startY);

      if (Math.max(deltaX, deltaY) >= DRAG_DISTANCE_THRESHOLD) {
        gestureRef.current.isDrag = true;
      }
    };

    const upHandler = () => {
      const wasDrag = gestureRef.current.isDrag;
      gestureRef.current.isPointerDown = false;
      gestureRef.current.isDrag = false;

      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseup", upHandler);
      listenersRef.current = { moveHandler: null, upHandler: null };

      if (!wasDrag) {
        onSelect(widget);
      }
    };

    listenersRef.current = { moveHandler, upHandler };
    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mouseup", upHandler);
  }, [onSelect, widget]);

  useEffect(() => {
    return () => {
      const { moveHandler, upHandler } = listenersRef.current;
      if (moveHandler) window.removeEventListener("mousemove", moveHandler);
      if (upHandler) window.removeEventListener("mouseup", upHandler);
    };
  }, []);

  useEffect(() => {
    if (type !== "GRAPH" && type !== "HYPVIS") return undefined;
    return () => clearComponentFigureReady(id);
  }, [type, id, clearComponentFigureReady]);

  const handleFigureReadyChange = useCallback(
    (isReady) => {
      setComponentFigureReady(id, isReady);
    },
    [id, setComponentFigureReady],
  );

  // Render content based on component type
  // Note: pyodide, data, variables, settings are accessed via context in child components (Table, Graph)
  const renderContent = () => {
    switch (type) {
      case "PARAGRAPH":
        return (
          <Paragraph content={content} handleContentChange={handleChange} />
        );
      case "TABLE":
        return <Table content={content} />;
      // for visualization of graphs
      case "GRAPH":
        return (
          <Graph
            content={content}
            sectionId={id}
            onFigureReadyChange={handleFigureReadyChange}
          />
        );
      // for statistical tests
      case "STATTEST":
        return <StatisticalTest content={content} sectionId={id} />;
      // for descriptive statistics
      case "STATISTICS":
        return <Statistics content={content} sectionId={id} />;
      // for user-generated code
      case "CODE":
        return <Code content={content} sectionId={id} />;
      // for hypothesis visualizer
      case "HYPVIS":
        return (
          <HypVis
            content={content}
            sectionId={id}
            onFigureReadyChange={handleFigureReadyChange}
          />
        );
      default:
        return <div>Unsupported component type: {type}</div>;
    }
  };

  return (
    <WidgetContainer className={isActive ? "active" : ""}>
      <WidgetContent
        ref={containerRef}
        className="widget-content-handle"
        onMouseDown={handlePointerDown}
      >
        <WidgetSizeProvider value={widgetSize}>
          {renderContent()}
        </WidgetSizeProvider>
      </WidgetContent>
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
    prevProps.onChange === nextProps.onChange
    // prevProps.handleRemoveComponent === nextProps.handleRemoveComponent // Uncomment if needed
  );
});
