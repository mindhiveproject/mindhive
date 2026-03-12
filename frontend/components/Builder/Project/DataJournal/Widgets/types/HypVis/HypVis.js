// components/DataJournal/Widgets/types/HypVis/HypVis.js

import Render from "./Render";
import { useDataJournal } from "../../../Context/DataJournalContext"; // adjust path

export default function HypVis({ content, sectionId }) {
  const { pyodide, data } = useDataJournal();

  const code = content?.code || "";

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
      />
    </div>
  );
}
