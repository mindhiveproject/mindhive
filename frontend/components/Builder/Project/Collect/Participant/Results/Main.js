import { useQuery } from "@apollo/client";
import { GET_PARTICIPANT_RESULTS } from "../../../../../Queries/Result";

import Dataset from "./Dataset";
import useTranslation from "next-translate/useTranslation";

// https://vercel.com/guides/loading-static-file-nextjs-api-route
// https://swr.vercel.app/

export default function ParticipantResults({
  query,
  study,
  components,
  participantId,
}) {
  const { t } = useTranslation("builder");
  const dataToken = query?.data;

  const { data: results } = useQuery(GET_PARTICIPANT_RESULTS, {
    variables: { studyId: study?.id, participantId: participantId },
  });

  const datasets = results?.datasets || [];

  if (dataToken) {
    return <Dataset dataToken={dataToken} />;
  }

  return (
    <div>
      <h2>{t("participantResults.title", "Participant results")}</h2>

      <div className="resultItem">
        <div>{t("participantResults.study", "Study")}</div>
        <div>{t("participantResults.taskTitle", "Task title")}</div>
        <div>{t("participantResults.taskSubtitle", "Task subtitle")}</div>
        <div>{t("participantResults.taskId", "Task ID")}</div>
        <div>{t("participantResults.started", "Started")}</div>
        <div>{t("participantResults.completed", "Completed")}</div>
        {/* <div>{t("participantResults.condition", "Condition")}</div> */}
        <div>{t("participantResults.dataType", "Data type")}</div>
        <div>{t("participantResults.dataPolicy", "Data policy")}</div>
        <div>{t("participantResults.studyStatus", "Study status")}</div>
        <div>{t("Study version")}</div>
        <div>{t("participantResults.dataAnalysis", "Data analysis")}</div>
        <div></div>
      </div>

      {datasets?.map((dataset) => (
        <Dataset
          key={dataset?.token}
          dataset={dataset}
          components={components}
          study={study}
          studyId={study?.id}
          participantId={participantId}
        />
      ))}
    </div>
  );
}
