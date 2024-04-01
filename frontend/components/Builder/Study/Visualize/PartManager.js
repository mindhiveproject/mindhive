import { useState, useEffect } from "react";

import ProcessManager from "./ProcessManager";

export default function PartManager({
  user,
  studyId,
  pyodide,
  journal,
  part,
  setPart,
  initData,
  initVariables,
  components,
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
  }, []);

  const selectChapter = async ({ partId, chapterId }) => {
    const currentPartId = part?.id;
    let activePart = part;
    // change the part if the ID is different
    if (currentPartId !== partId) {
      const parts = journal.vizParts.filter((part) => part?.id === partId);
      if (parts.length) {
        activePart = parts[0];
        setPart(activePart);
      }
    }
    const chapter = activePart?.vizChapters.filter(
      (chapter) => chapter?.id === chapterId
    )[0];
    setChapterId(chapterId);
    setChapter(chapter);
  };

  return (
    <ProcessManager
      user={user}
      studyId={studyId}
      pyodide={pyodide}
      journal={journal}
      part={part}
      initData={initData}
      initVariables={initVariables}
      components={components}
      page={page}
      setPage={setPage}
      chapter={chapter}
      selectChapter={selectChapter}
    />
  );
}
