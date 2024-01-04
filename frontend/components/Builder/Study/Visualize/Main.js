import { useQuery } from "@apollo/client";
import { useState, useEffect } from "react";

import { Icon } from "semantic-ui-react";

import Navigation from "../Navigation/Main";
import Overview from "./Overview/Main";
import Document from "./Document/Main";

import { STUDY_VIZJOURNAL } from "../../../Queries/VizJournal";

import { StyledDataViz } from "../../../styles/StyledDataviz";

export default function Visualize({ query, user, tab, toggleSidebar, data }) {
  const studyId = query?.selector;

  const [page, setPage] = useState("browse");
  const [hasJournalChanged, setHasJournalChanged] = useState(false);

  const [chapterId, setChapterId] = useState(null);
  const [journal, setJournal] = useState(null);
  const [part, setPart] = useState(null);
  const [chapter, setChapter] = useState(null);

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

  const saveVizJournal = async () => {
    // console.log("Saving the viz journal");
    // setHasJournalChanged(!hasJournalChanged);
  };

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
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={toggleSidebar}
        saveBtnName="Save"
        saveBtnFunction={saveVizJournal}
        hasStudyChanged={hasJournalChanged}
      />
      <StyledDataViz>
        <div className="vizMenu">
          <div className="buttons">
            <div onClick={() => setPage("browse")}>
              <Icon name="folder open" />
            </div>
            <div onClick={() => setPage("database")}>
              <Icon name="database" />
            </div>
          </div>
          <Overview
            page={page}
            studyId={studyId}
            journal={journal}
            chapterId={chapter?.id}
            selectChapter={selectChapter}
            data={data}
          />
        </div>
        <Document page={page} studyId={studyId} chapter={chapter} part={part} />
      </StyledDataViz>
    </>
  );
}
