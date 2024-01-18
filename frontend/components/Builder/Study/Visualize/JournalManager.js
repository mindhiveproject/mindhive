import { useQuery } from "@apollo/client";
import { useState, useEffect } from "react";

import Menu from "./Menu/Main";
import Overview from "./Overview/Main";
import Document from "./Document/Main";

import { STUDY_VIZJOURNAL } from "../../../Queries/VizJournal";

import { StyledDataViz } from "../../../styles/StyledDataviz";

export default function JournalManager({
  user,
  studyId,
  data,
  variables,
  pyodide,
}) {
  const [page, setPage] = useState("browse");

  const [journal, setJournal] = useState(null);
  const [part, setPart] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [chapterId, setChapterId] = useState(null);

  // get the viz journal of the study
  const {
    data: studyData,
    loading,
    error,
  } = useQuery(STUDY_VIZJOURNAL, {
    variables: { id: studyId },
  });

  useEffect(() => {
    function initJournal() {
      if (
        studyData &&
        studyData?.study &&
        studyData?.study?.vizJournals &&
        studyData?.study?.vizJournals.length
      ) {
        const j = studyData?.study?.vizJournals[0];
        setJournal(j);
        if (j?.vizParts && j?.vizParts.length) {
          const p = j?.vizParts && j?.vizParts[0];
          setPart(p);
          if (p && p?.vizChapters && p?.vizChapters.length) {
            let c;
            if (chapterId) {
              c = p?.vizChapters.filter(
                (chapter) => chapter?.id === chapterId
              )[0];
            } else {
              c = p?.vizChapters[0];
            }
            setChapter(c);
          } else {
            setChapter(undefined);
          }
        }
      }
    }
    if (
      studyData &&
      studyData?.study &&
      studyData?.study?.vizJournals &&
      studyData?.study?.vizJournals.length
    ) {
      initJournal();
    }
  }, [studyData]);

  const selectChapter = ({ chapterId }) => {
    const chapter = part?.vizChapters.filter(
      (chapter) => chapter?.id === chapterId
    )[0];
    setChapterId(chapterId);
    setChapter(chapter);
  };

  if (!studyId) {
    return <div>No study found, please save your study first.</div>;
  }

  return (
    <StyledDataViz>
      <div className="vizMenu">
        <Menu page={page} setPage={setPage} />
        <Overview
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
