import moment from "moment";
import { Icon } from "semantic-ui-react";

// useSWR allows the use of SWR inside function components
import useSWR from "swr";

import { saveAs } from "file-saver";
import { jsonToCSV } from "react-papaparse";
import ChangeDatasetStatus from "./ChangeStatus";
import DeleteRecord from "./DeleteRecord";
import useTranslation from "next-translate/useTranslation";

// A fetcher function to wrap the native fetch function and return the result of a call to url in json format
const fetcher = (url) => fetch(url).then((res) => res.json());

// Export the raw status keys for use in other components
export const studyStatusKeys = {
  WORKING: "dataset.status.working",
  SUBMITTED_AS_PROPOSAL: "dataset.status.submittedAsProposal",
  READY_FOR_REVIEW: "dataset.status.readyForReview",
  IN_REVIEW: "dataset.status.inReview",
  REVIEWED: "dataset.status.reviewed",
  COLLECTING_DATA: "dataset.status.collectingData",
  DATA_COLLECTION_IS_COMPLETED: "dataset.status.dataCollectionCompleted",
};

// Helper function to get translated status strings
export const getTranslatedStudyStatuses = (t) => {
  return {
    WORKING: t("dataset.status.working"),
    SUBMITTED_AS_PROPOSAL: t("dataset.status.submittedAsProposal"),
    READY_FOR_REVIEW: t("dataset.status.readyForReview"),
    IN_REVIEW: t("dataset.status.inReview"),
    REVIEWED: t("dataset.status.reviewed"),
    COLLECTING_DATA: t("dataset.status.collectingData"),
    DATA_COLLECTION_IS_COMPLETED: t("dataset.status.dataCollectionCompleted"),
  };
};

export default function Dataset({
  studyId,
  participantId,
  dataset,
  components,
}) {
  const { t } = useTranslation("builder");
  const { date, token, isCompleted } = dataset;
  
  // Get translated status strings for use in this component
  const studyStatuses = getTranslatedStudyStatuses(t);
  
  // Set up SWR to run the fetcher function when calling "/api/staticdata"
  // There are 3 possible states: (1) loading when data is null (2) ready when the data is returned (3) error when there was an error fetching the data
  const [year, month, day] = date.split("-");
  const { data, error } = useSWR(
    `/api/data/${year}/${month}/${day}/${token}?type=${
      isCompleted ? "full" : "incremental"
    }`,
    fetcher
  );

  // Handle the error state
  if (error)
    return (
      <div className="resultItem">
        <div>{dataset?.study?.title}</div>
        <div>{dataset?.task?.title}</div>
        <div>{subtitle}</div>
        <div>{metadata?.testVersion}</div>
        <div>{moment(dataset?.createdAt).format("MMMM D, YY, h:mm:ss")}</div>
        <div>{moment(dataset?.completedAt).format("MMMM D, YY, h:mm:ss")}</div>
        <div>{condition}</div>
        <div>{dataset?.isCompleted ? t("dataset.full", "full") : t("dataset.incremental", "incremental")}</div>
        <div>{dataset?.dataPolicy}</div>
        <div>{dataset?.studyStatus && studyStatuses[dataset?.studyStatus]}</div>
        <div>{t("dataset.noData", "No data")}</div>
        <DeleteRecord
          studyId={studyId}
          participantId={participantId}
          dataset={dataset}
        />
      </div>
    );
  // Handle the loading state
  if (!data) return <div>{t("dataset.loading", "Loading...")}</div>;
  // Handle the ready state and display the result contained in the data object mapped to the structure of the json file

  // trim the data
  const trimmedData = "[" + data.trim().slice(0, -1) + "]";

  let results = [];
  if (data) {
    results = JSON.parse(trimmedData);
  }

  let metadata = {};
  if (results.length) {
    metadata = results.map((res) => res?.metadata)[0];
  }

  const component = components
    .filter((c) => c?.testId === metadata?.testVersion)
    .map((c) => ({ subtitle: c?.subtitle, condition: c?.conditionLabel }))[0];
  const subtitle = component?.subtitle;
  const condition = component?.condition;

  // aggregate all data together
  const rows = results
    .filter((result) => result?.data)
    .map((result) =>
      result?.data.map((line) => ({
        ...line,
        url: JSON.stringify(line?.url),
        meta: JSON.stringify(line?.meta),
        ...result?.metadata,
        subtitle: components
          .filter((c) => c?.testId === result?.metadata?.testVersion)
          .map((c) => c?.subtitle),
        condition: components
          .filter((c) => c?.testId === result?.metadata?.testVersion)
          .map((c) => c?.conditionLabel),
      }))
    )
    .reduce((a, b) => a.concat(b), []);

  const download = () => {
    const allKeys = rows
      .map((line) => Object.keys(line))
      .reduce((a, b) => a.concat(b), []);
    const keys = Array.from(new Set(allKeys));
    const csv = jsonToCSV({ fields: keys, data: rows });
    const blob = new Blob([csv], {
      type: "text/csv",
    });
    saveAs(blob, `${token}.csv`);
  };

  return (
    <div className="resultItem">
      <div>{dataset?.study?.title}</div>
      <div>{dataset?.task?.title}</div>
      <div>{subtitle}</div>
      <div>{metadata?.testVersion}</div>
      <div>{moment(dataset?.createdAt).format("MMMM D, YY, h:mm:ss")}</div>
      <div>
        {dataset?.completedAt &&
          moment(dataset?.completedAt).format("MMMM D, YY, h:mm:ss")}
      </div>
      <div>{condition}</div>
      <div>{dataset?.isCompleted ? t("dataset.full", "full") : t("dataset.incremental", "incremental")}</div>
      <div>{dataset?.dataPolicy}</div>
      <div>{dataset?.studyStatus && studyStatuses[dataset?.studyStatus]}</div>
      <ChangeDatasetStatus
        studyId={studyId}
        participantId={participantId}
        dataset={dataset}
      />
      <div className="downloadArea" onClick={download}>
        <Icon color="teal" size="large" name="download" />
        <a>{t("dataset.download", "Download")}</a>
      </div>
    </div>
  );
}
