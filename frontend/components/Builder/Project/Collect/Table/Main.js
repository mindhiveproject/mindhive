import { useState, useEffect } from "react";
import useTranslation from "next-translate/useTranslation";

import Header from "./Header";
import Grid from "./Grid";

import {
  studyStatusKeys,
  getTranslatedStudyStatuses,
} from "../Participant/Results/Dataset";

function getUnique(array) {
  return [...new Set(array)];
}

export default function ParticipantsTable({
  study,
  components,
  users,
  guests,
}) {
  const studyVersionHistory = study?.versionHistory || [];

  const { t } = useTranslation("builder");
  // participants
  const [participants, setParticipants] = useState([]);

  // Get translated study statuses
  const studyStatuses = getTranslatedStudyStatuses(t);

  const processParticipant = ({ participant }) => {
    const generalInfo =
      { ...participant?.generalInfo, ...participant?.info } || {};
    const studyInfo = participant?.studiesInfo?.[study?.id];
    const path = studyInfo?.info?.path || [];

    const startedAt = path?.length && path[0]?.timestampFinished;

    // Compute duration
    // Get the event timestamps
    const timestampsRun = path.map((p) => p?.timestampRun).filter((t) => !!t);
    const timestampsFinished = path
      .map((p) => p?.timestampFinished)
      .filter((t) => !!t);
    const timestamps = [...timestampsRun, ...timestampsFinished];
    // Find the minimum and maximum values
    const minTimestamp = Math.min(...timestamps);
    const maxTimestamp = Math.max(...timestamps);
    // Calculate the duration in minutes (this will be used for filter)
    const duration = (maxTimestamp - minTimestamp) / (1000 * 60);

    // compute the number of completed tasks
    const numberCompleted = participant?.datasets?.filter(
      (dataset) => dataset?.isCompleted && dataset?.study?.id === study?.id
    ).length;

    // return condition labels
    const condition = path
      .filter((stage) => stage?.conditionLabel)
      .map((stage) => stage?.conditionLabel)
      .join(", ");

    // return consent decisions for this study
    const studyConsent = study?.consent || [];

    // if a participant agreed to the consent, display the title of the consent form
    const consent = studyConsent
      .map((consent) => {
        return generalInfo?.[`consent-${consent?.id}`] === "agree"
          ? consent?.title
          : "";
      })
      .join(", ");

    // Compute whether all datasets of participant are included in analysis
    const areIncluded =
      participant?.datasets
        ?.filter((dataset) => dataset?.isCompleted)
        .map((dataset) => dataset?.isIncluded) || [];
    const includeAnalysis =
      areIncluded.length && areIncluded?.every((v) => !!v);

    const datasetStatuses = participant?.datasets?.map(
      (dataset) => dataset?.studyStatus
    );
    const uniqueDatasetStatuses = getUnique(datasetStatuses);
    // Now returns translated strings instead of translation keys
    const studyStatus = uniqueDatasetStatuses
      .filter((status) => status) // Filter out undefined/null statuses
      .map((status) => studyStatuses[status])
      .filter((translatedStatus) => translatedStatus); // Filter out any undefined translations

    const datasetVersions = participant?.datasets?.map(
      (dataset) => dataset?.studyVersion
    );
    const uniqueStudyVersions = getUnique(datasetVersions);
    const studyVersion = uniqueStudyVersions
      .filter((version) => version) // Filter out undefined/null statuses
      .map((version) =>
        studyVersionHistory.filter((v) => v?.id === version).map((v) => v?.name)
      );

    return {
      publicId: participant?.publicId,
      publicReadableId: participant?.publicReadableId,
      startedAt,
      duration,
      numberCompleted,
      condition,
      consent,
      accountType: participant?.type,
      includeAnalysis,
      datasets: participant?.datasets,
      studyStatus,
      studyVersion,
    };
  };

  // get participants and order them by the time moment when they joined the study
  useEffect(() => {
    async function getParticipants() {
      const allParticipants = [...users, ...guests];
      setParticipants(
        allParticipants.map((participant) =>
          processParticipant({ participant })
        )
      );
    }
    getParticipants();
  }, [study, users, guests]);

  return (
    <div className="collectBoard">
      <Header
        study={study}
        slug={study.slug}
        participants={participants}
        components={components}
      />
      <Grid studyId={study?.id} participants={participants} />
    </div>
  );
}
