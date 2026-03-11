// components/DataJournal/Widgets/types/Code/Code.js

import Render from "./Render";
import { useDataJournal } from "../../../Context/DataJournalContext";

export default function Code({ content, sectionId }) {
  const { pyodide } = useDataJournal();

  const code = content?.code || "";

  if (!code || !pyodide) {
    return <div>Loading code...</div>;
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Render
        content={content}
        sectionId={sectionId}
        pyodide={pyodide}
        code={code}
      />
    </div>
  );
}
