// https://uiwjs.github.io/react-codemirror/#/theme/home
import { useState, useCallback } from "react";

import { python } from "@codemirror/lang-python";
import CodeMirror from "@uiw/react-codemirror";

export default function CodeEditor({ sectionId, code, onChange }) {
  const [localCode, setLocalCode] = useState(code);

  // update the component with the local code
  const onRunCode = () => {
    onChange({
      componentId: sectionId,
      newContent: {
        code: localCode,
      },
    });
  };

  // keep the local version of code
  const onCodeChange = useCallback((val, viewUpdate) => {
    setLocalCode(val);
  }, []);

  return (
    <>
      <div className="runCodeButton">
        <button onClick={() => onRunCode({ code })}>Run the code</button>
      </div>
      <div className="editor-wrapper">
        <CodeMirror
          width="100%"
          value={code}
          extensions={python()}
          onChange={onCodeChange}
          theme="light"
        />
      </div>
    </>
  );
}
