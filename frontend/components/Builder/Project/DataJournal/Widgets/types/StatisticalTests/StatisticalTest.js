// components/DataJournal/Widgets/types/StatisticalTests/StatisticalTest.js

import Render from "./Render";
import { useDataJournal } from "../../../Context/DataJournalContext"; // adjust path

export default function StatisticalTest({ content, sectionId }) {
  const { pyodide, data } = useDataJournal();

  const code = content?.code || "";

  if (!code || !pyodide) {
    return <div>Loading statistical test...</div>;
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
