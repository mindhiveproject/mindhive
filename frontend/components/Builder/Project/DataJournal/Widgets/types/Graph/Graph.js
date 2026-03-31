// components/DataJournal/Widgets/types/Graph/Graph.js
import { useCallback, useEffect, useState } from "react";

import Render from "./Render";
import { useDataJournal } from "../../../Context/DataJournalContext"; // Adjust path

const defaultCode = ``;

export default function Graph({ content, sectionId, onFigureReadyChange }) {
  const { pyodide, data } = useDataJournal();

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");

  // state of the python code
  const code = content?.code || defaultCode;

  const addToOutput = useCallback((s) => {
    if (typeof s === "undefined") {
      setOutput("");
    } else {
      setOutput(s);
    }
    setIsRunning(false);
  }, []); // Empty deps: stable unless you need to capture something

  useEffect(() => {
    if (!code || !pyodide) {
      onFigureReadyChange?.(false);
    }
  }, [code, pyodide, onFigureReadyChange]);

  if (code && pyodide) {
    return (
      <div className="graphContainer">
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
  return <div>Loading graph...</div>; // Fallback if no code or pyodide
}
