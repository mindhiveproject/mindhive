import { useState, useEffect } from "react";
import JournalManager from "./JournalManager";

import { loadPyodide } from "pyodide";

import {
  MessageHeader,
  MessageContent,
  Message,
  Icon,
} from "semantic-ui-react";

// code that will only run once for all pyodide
const importString = ``;

export default function DataManager({
  user,
  studyId,
  studyData,
  studyVariables,
}) {
  const [isLoading, setIsLoading] = useState(false);

  // state of the data we are working with
  const [data, setData] = useState(studyData || []);
  // state of the variables
  const [variables, setVariables] = useState(studyVariables || []);
  // pyodide
  const [pyodide, setPyodide] = useState(false);

  useEffect(() => {
    async function startPyodide() {
      if (!pyodide) {
        setIsLoading(true);
        const pyodideLoad = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
        });
        // load packages
        await pyodideLoad.loadPackage(["numpy", "pandas", "matplotlib"]);
        // run code that will only run once
        // await pyodideLoad.runPython(importString);
        // provide data to pyodide
        pyodideLoad.registerJsModule("js_workspace", data);
        setPyodide(pyodideLoad);
        setIsLoading(false);
      }
    }
    startPyodide();
  }, [data]);

  return (
    <div>
      {isLoading && (
        <Message icon>
          <Icon name="circle notched" loading />
          <MessageContent>
            <MessageHeader>Just one second</MessageHeader>
            The data analysis libraries are loading.
          </MessageContent>
        </Message>
      )}

      <JournalManager
        user={user}
        studyId={studyId}
        data={data}
        variables={variables}
        pyodide={pyodide}
      />
    </div>
  );
}
