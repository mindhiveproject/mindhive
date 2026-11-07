import useTranslation from "next-translate/useTranslation";

// why the study has no data to download yet, or null when it has some
export function getDownloadEmptyReason({ datasets, includedCount }) {
  if (includedCount > 0) return null;
  if (!datasets?.length) return "noData";
  if (!datasets.some((dataset) => dataset?.isCompleted)) return "noCompleted";
  return "noneIncluded";
}

// explains why a download card shows no download buttons
export default function DownloadEmptyNotice({ reason }) {
  const { t } = useTranslation("builder");
  if (!reason) return null;
  const messages = {
    loading: t("header.downloadLoading", "Loading the study's data…"),
    noData: t(
      "header.downloadNoData",
      "No data yet. Data appears here once participants take part in your study. Share the study link to invite them."
    ),
    noCompleted: t(
      "header.downloadNoCompleted",
      "Participants have started your study, but none has completed a task yet. Downloads appear once a task is completed."
    ),
    noneIncluded: t(
      "header.downloadNoneIncluded",
      "None of the completed data is included in analysis yet. Tick the Analysis box for the participants you want to include in the table below, and the downloads will appear here."
    ),
    noTasks: t(
      "header.downloadNoTasks",
      "Your study has no tasks or surveys yet. Add them in the Study builder to download their data separately."
    ),
    selectTasks: t(
      "header.downloadSelectTasks",
      "Select one or more tasks or surveys above to download their data."
    ),
  };
  return <p className="downloadEmpty">{messages[reason]}</p>;
}
