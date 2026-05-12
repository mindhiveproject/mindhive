import { useState, useCallback, useEffect } from "react";
import useTranslation from "next-translate/useTranslation";

import MonacoPythonEditor from "../../../../Helpers/MonacoPythonEditor";

export default function CodeEditor({ sectionId, code, onChange }) {
  const { t } = useTranslation("builder");
  const [localCode, setLocalCode] = useState(() => code ?? "");

  useEffect(() => {
    setLocalCode(code ?? "");
  }, [code]);

  const onRunCode = () => {
    onChange({
      componentId: sectionId,
      newContent: {
        code: localCode,
      },
    });
  };

  const onCodeChange = useCallback((val) => {
    setLocalCode(val ?? "");
  }, []);

  return (
    <>
      <div className="runCodeButton">
        <button type="button" onClick={onRunCode}>
          {t("dataJournal.statTest.codeEditor.runCode", {}, { default: "Run the code" })}
        </button>
      </div>
      <div className="editor-wrapper">
        <MonacoPythonEditor value={localCode} onChange={onCodeChange} />
      </div>
    </>
  );
}
