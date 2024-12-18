import { useState, useEffect } from "react";

import Header from "./Header";
import Grid from "./Grid";

export default function ParticipantsTable({
  study,
  components,
  users,
  guests,
}) {
  // participants
  const [participants, setParticipants] = useState([]);

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
    const consent = studyConsent
      .map((consent) => {
        return generalInfo?.[`consent-${consent?.id}`];
      })
      .join(", ");

    // Compute whether all datasets of participant are included in analysis
    const areIncluded =
      participant?.datasets
        ?.filter((dataset) => dataset?.isCompleted)
        .map((dataset) => dataset?.isIncluded) || [];
    const includeAnalysis =
      areIncluded.length && areIncluded?.every((v) => !!v);

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
