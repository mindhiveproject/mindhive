import { useState, useEffect } from "react";

import Menu from "./Menu/Main";
import Overview from "./Overview/Main";
import Document from "./Document/Main";

import { StyledDataViz } from "../../../styles/StyledDataviz";

const prepareDataCode = ``;

export default function PartManager({
  user,
  studyId,
  pyodide,
  journal,
  part,
  data,
  variables,
}) {
  const [page, setPage] = useState("browse");
  const [chapter, setChapter] = useState(null);
  const [chapterId, setChapterId] = useState(null);

  // automatically select the first chapter in the part
  useEffect(() => {
    function initChapter() {
      let c;
      if (chapterId) {
        c = part?.vizChapters.filter((chapter) => chapter?.id === chapterId)[0];
      } else {
        c = part?.vizChapters[0];
      }
      setChapter(c);
    }
    if (part && part?.vizChapters && part?.vizChapters.length) {
      initChapter();
    }
  }, [part]);

  // register data relevant for this part
  useEffect(() => {
    async function registerData() {
      if (pyodide && data) {
        pyodide?.registerJsModule("js_workspace", [...data]);
        // make data available as data and df (pandas dataframe)
        await pyodide.runPythonAsync(prepareDataCode);
      }
    }
    registerData();
  }, [pyodide, data]);

  const selectChapter = ({ chapterId }) => {
    const chapter = part?.vizChapters.filter(
      (chapter) => chapter?.id === chapterId
    )[0];
    setChapterId(chapterId);
    setChapter(chapter);
  };

  return (
    <StyledDataViz>
      <div className="vizMenu">
        <Menu page={page} setPage={setPage} />
        <Overview
          user={user}
          page={page}
          studyId={studyId}
          journal={journal}
          chapterId={chapter?.id}
          selectChapter={selectChapter}
          data={data}
          variables={variables}
        />
      </div>
      <Document
        user={user}
        page={page}
        studyId={studyId}
        chapter={chapter}
        part={part}
        data={data}
        variables={variables}
        pyodide={pyodide}
      />
    </StyledDataViz>
  );
}
