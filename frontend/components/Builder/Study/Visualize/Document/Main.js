import { useEffect } from "react";

import ChapterHeader from "./ChapterHeader";
import CreateSection from "./CreateSection";

import Section from "./Section";

const prepareDataCode = ``;

export default function Document({
  user,
  studyId,
  part,
  chapter,
  pyodide,
  data,
  variables,
}) {
  // register data relevant for this part
  useEffect(() => {
    async function registerData() {
      if (pyodide && data) {
        console.log({ data });
        // delete the previous data if they are registered
        const sys = pyodide.pyimport("sys");
        if (sys.modules.get("js_workspace")) {
          sys.modules.delete("js_workspace");
        }
        pyodide?.registerJsModule("js_workspace", [...data]);
        // make data available as data and df (pandas dataframe)
        await pyodide.runPythonAsync(prepareDataCode);
      }
    }
    registerData();
  }, [pyodide, data]);

  if (!chapter) {
    if (part?.vizChapters && part?.vizChapters.length) {
      return (
        <div className="emptyDocument">
          Select a chapter in the menu on the left
        </div>
      );
    } else {
      return (
        <div className="emptyDocument">Create a new document to begin</div>
      );
    }
  }
  return (
    <div className="document">
      <ChapterHeader
        user={user}
        studyId={studyId}
        part={part}
        chapter={chapter}
      />
      <div>
        {chapter?.vizSections.map((section, num) => (
          <Section
            key={num}
            studyId={studyId}
            chapter={chapter}
            section={section}
            pyodide={pyodide}
            data={data}
            variables={variables}
          />
        ))}
      </div>
      <div className="createSectionButton">
        <CreateSection studyId={studyId} chapterId={chapter?.id} />
      </div>
    </div>
  );
}
