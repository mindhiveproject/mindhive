import { useQuery } from "@apollo/client";
import { useState, useEffect } from "react";

import { GET_VIZJOURNALS } from "../../../Queries/VizJournal";

import StudyDataWrapper from "./StudyDataWrapper";
import UploadedDataWrapper from "./UploadedDataWrapper";
import PartManager from "./PartManager";
import TemplateDataWrapper from "./TemplateDataWrapper";

export default function JournalManager({ user, projectId, studyId, pyodide }) {
  const [journal, setJournal] = useState(null);
  const [part, setPart] = useState(null);

  // get the viz journals of the study and the project
  const {
    data: studyJournal,
    loading,
    error,
  } = useQuery(GET_VIZJOURNALS, {
    variables: {
      where:
        projectId && studyId
          ? {
              OR: [
                { project: { id: { equals: projectId } } },
                { study: { id: { equals: studyId } } },
              ],
            }
          : projectId
          ? { project: { id: { equals: projectId } } }
          : studyId
          ? { study: { id: { equals: studyId } } }
          : null,
    },
  });

  useEffect(() => {
    function initJournal() {
      if (
        studyJournal &&
        studyJournal?.vizJournals &&
        studyJournal?.vizJournals.length
      ) {
        // Filter journals with a defined study or project
        const filteredJournals = studyJournal.vizJournals.filter(
          (journal) =>
            journal?.project?.id === projectId || journal?.study?.id === studyId
        );

        if (filteredJournals.length) {
          const j = filteredJournals[0];
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
    }
    if (
      studyJournal &&
      studyJournal?.vizJournals &&
      studyJournal?.vizJournals.length
    ) {
      initJournal();
    }
  }, [studyJournal]);

  if (part && part.dataOrigin) {
    if (part?.dataOrigin === "TEMPLATE" && part?.settings?.studyId) {
      return (
        <TemplateDataWrapper
          user={user}
          projectId={projectId}
          studyId={studyId}
          templateStudyId={part?.settings?.studyId}
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
          projectId={projectId}
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
          projectId={projectId}
          studyId={studyId}
          pyodide={pyodide}
          journal={journal}
          part={part}
          setPart={setPart}
        />
      );
    }
    if (part?.dataOrigin === "SIMULATED") {
      return (
        <UploadedDataWrapper
          user={user}
          projectId={projectId}
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
        projectId={projectId}
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
