import { useState, useEffect } from "react";
import { loadPyodide } from "pyodide";

import Journals from "./Journals";

const baseCode = `import js
import micropip
import pandas as pd
import numpy as np
await micropip.install('plotly==5.20.0')
import plotly.express as px
import plotly.graph_objects as go
import json`;

import {
  MessageHeader,
  MessageContent,
  Message,
  Icon,
} from "semantic-ui-react";

function render_html(container, html) {
  var range = document.createRange();
  range.selectNode(container);
  var documentFragment = range.createContextualFragment(html);
  while (container.hasChildNodes()) {
    container.removeChild(container.firstChild);
  }
  container.appendChild(documentFragment);
}

export default function PyodideWrapper({ user, projectId, studyId }) {
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
        await pyodideLoad.loadPackage(["numpy", "pandas", "micropip", "scipy"]);
        // run code that will only run once
        await pyodideLoad.runPythonAsync(baseCode);
        // provide data to pyodide which will be shared between all parts of the journal
        // pyodideLoad.registerJsModule("js_shared_workspace", sharedData);
        setPyodide(pyodideLoad);
        // inject plot rendering function
        window.render_html = render_html;
        setIsLoading(false);
      }
    }
    startPyodide();
  }, []);

  return (
    <>
      {isLoading && (
        <div className="pyodideLoadingMessage">
          <Message icon>
            <Icon name="circle notched" loading />
            <MessageContent>
              <MessageHeader>Just one second</MessageHeader>
              The data analysis libraries are loading.
            </MessageContent>
          </Message>
        </div>
      )}
      {(studyId || projectId) && (
        <Journals
          user={user}
          projectId={projectId}
          studyId={studyId}
          pyodide={pyodide}
        />
      )}
    </>
  );
}
