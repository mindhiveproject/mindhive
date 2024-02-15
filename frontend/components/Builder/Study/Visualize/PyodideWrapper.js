import { useState, useEffect } from "react";
import { loadPyodide } from "pyodide";

import JournalManager from "./JournalManager";

import {
  MessageHeader,
  MessageContent,
  Message,
  Icon,
} from "semantic-ui-react";

export default function PyodideWrapper({ user, studyId }) {
  const [isLoading, setIsLoading] = useState(false);

  // pyodide
  const [pyodide, setPyodide] = useState(null);

  useEffect(() => {
    async function startPyodide() {
      if (!pyodide) {
        setIsLoading(true);
        const pyodideLoad = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
        });
        // load packages
        await pyodideLoad.loadPackage([
          "numpy",
          "pandas",
          "matplotlib",
          "micropip",
        ]);
        // run code that will only run once
        // await pyodideLoad.runPython(importString);
        // provide data to pyodide which will be shared between all parts of the journal
        // pyodideLoad.registerJsModule("js_shared_workspace", sharedData);
        setPyodide(pyodideLoad);
        setIsLoading(false);
      }
    }
    startPyodide();
  }, []);

  return (
    <>
      {isLoading && (
        <div>
          <Message icon>
            <Icon name="circle notched" loading />
            <MessageContent>
              <MessageHeader>Just one second</MessageHeader>
              The data analysis libraries are loading.
            </MessageContent>
          </Message>
        </div>
      )}
      <JournalManager user={user} studyId={studyId} pyodide={pyodide} />
    </>
  );
}
