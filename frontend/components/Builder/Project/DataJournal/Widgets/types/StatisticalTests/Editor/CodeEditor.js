// https://uiwjs.github.io/react-codemirror/#/theme/home
import { useState, useCallback } from "react";

import { python } from "@codemirror/lang-python";
import CodeMirror from "@uiw/react-codemirror";
import useTranslation from "next-translate/useTranslation";
export default function CodeEditor({ sectionId, code, onChange }) {
  const { t } = useTranslation("builder");
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
        <button type="button" onClick={onRunCode}>
          {t("dataJournal.statTest.codeEditor.runCode", {}, { default: "Run the code" })}
        </button>
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
