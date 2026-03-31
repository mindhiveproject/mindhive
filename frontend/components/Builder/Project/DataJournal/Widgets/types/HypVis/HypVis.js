// components/DataJournal/Widgets/types/HypVis/HypVis.js

import { useEffect } from "react";
import Render from "./Render";
import { useDataJournal } from "../../../Context/DataJournalContext"; // adjust path

export default function HypVis({ content, sectionId, onFigureReadyChange }) {
  const { pyodide, data } = useDataJournal();

  const code = content?.code || "";

  useEffect(() => {
    if (!code || !pyodide) {
      onFigureReadyChange?.(false);
    }
  }, [code, pyodide, onFigureReadyChange]);

  if (!code || !pyodide) {
    return <div>Hypothesis visualizer...</div>;
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Render
        data={data}
        code={code}
        pyodide={pyodide}
        sectionId={sectionId}
        content={content}
        onFigureReadyChange={onFigureReadyChange}
      />
    </div>
  );
}
