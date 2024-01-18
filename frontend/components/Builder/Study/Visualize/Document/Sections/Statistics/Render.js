import { useEffect, useState } from "react";

export default function Render({ data, code, pyodide, runCode }) {
  // run if the data has changed
  useEffect(() => {
    async function evaluatePython() {
      await runCode({ code });
    }
    evaluatePython();
  }, [data]);

  return <div id="statisticsArea"></div>;
}
