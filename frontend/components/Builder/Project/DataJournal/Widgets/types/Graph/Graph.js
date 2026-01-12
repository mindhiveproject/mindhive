// components/DataJournal/Widgets/types/Graph/Graph.js
import { useCallback, useState } from "react";

import Render from "./Render";
import { useDataJournal } from "../../../Context/DataJournalContext"; // Adjust path

const defaultCode = ``;

export default function Graph({ content, handleContentChange, sectionId }) {
  const { pyodide, data, variables } = useDataJournal();

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

  if (code && pyodide) {
    return (
      <div className="graphContainer">
        <Render
          data={data}
          code={code}
          pyodide={pyodide}
          sectionId={sectionId}
          content={content}
        />
      </div>
    );
  } else {
    return <div>Loading graph...</div>; // Fallback if no code or pyodide
  }
}
