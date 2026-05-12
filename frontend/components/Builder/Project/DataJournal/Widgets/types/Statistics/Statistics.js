// components/DataJournal/Widgets/types/Statistics/Statistics.js

import Render from "./Render";
import { useDataJournal } from "../../../Context/DataJournalContext"; // adjust path

export default function Statistics({ content, sectionId }) {
  const { pyodide } = useDataJournal();

  const code = content?.code || "";

  if (!code || !pyodide) {
    return <div>Loading descriptive statistics...</div>;
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Render
        code={code}
        pyodide={pyodide}
        sectionId={sectionId}
        content={content}
      />
    </div>
  );
}
