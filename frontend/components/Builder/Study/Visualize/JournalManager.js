import { useQuery } from "@apollo/client";
import { useState, useEffect } from "react";

import { STUDY_VIZJOURNAL } from "../../../Queries/VizJournal";

import StudyDataWrapper from "./StudyDataWrapper";
import UploadedDataWrapper from "./UploadedDataWrapper";
import PartManager from "./PartManager";

export default function JournalManager({ user, studyId, pyodide }) {
  const [journal, setJournal] = useState(null);
  const [part, setPart] = useState(null);

  // get the viz journal of the study
  const {
    data: studyJournal,
    loading,
    error,
  } = useQuery(STUDY_VIZJOURNAL, {
    variables: { id: studyId },
  });

  useEffect(() => {
    function initJournal() {
      if (
        studyJournal &&
        studyJournal?.study &&
        studyJournal?.study?.vizJournals &&
        studyJournal?.study?.vizJournals.length
      ) {
        const j = studyJournal?.study?.vizJournals[0];
        setJournal(j);
        if (j?.vizParts && j?.vizParts.length) {
          let p;
          if (part && part?.id) {
            p = j?.vizParts.filter((p) => p?.id === part?.id)[0];
          } else {
            p = j?.vizParts && j?.vizParts[0];
          }
          setPart(p);
        }
      }
    }
    if (
      studyJournal &&
      studyJournal?.study &&
      studyJournal?.study?.vizJournals &&
      studyJournal?.study?.vizJournals.length
    ) {
      initJournal();
    }
  }, [studyJournal]);

  if (part && part.dataOrigin) {
    if (part?.dataOrigin === "TEMPLATE") {
      return (
        <StudyDataWrapper
          user={user}
          studyId={part?.settings?.studyId}
          pyodide={pyodide}
          journal={journal}
          part={part}
          setPart={setPart}
        />
      );
    }
    if (part?.dataOrigin === "STUDY") {
      return (
        <StudyDataWrapper
          user={user}
          studyId={studyId}
          pyodide={pyodide}
          journal={journal}
          part={part}
          setPart={setPart}
        />
      );
    }
    if (part?.dataOrigin === "UPLOADED") {
      return (
        <UploadedDataWrapper
          user={user}
          studyId={studyId}
          pyodide={pyodide}
          journal={journal}
          part={part}
          setPart={setPart}
        />
      );
    }
  } else {
    // in case of empty journal
    return (
      <PartManager
        user={user}
        studyId={studyId}
        pyodide={pyodide}
        journal={journal}
        part={part}
        setPart={setPart}
        initData={[]}
        initVariables={[]}
        components={[]}
      />
    );
  }
}
