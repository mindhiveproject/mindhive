import { useState } from "react";
import { saveAs } from "file-saver";
import { jsonToCSV } from "react-papaparse";
import moment from "moment";
import { Icon } from "semantic-ui-react";

export default function DownloadSummaryData({
  by,
  study,
  participantsInStudy,
  components,
  datasets,
  filteredDatasetTokens,
}) {
  const [loading, setLoading] = useState(false);

  // pre-process and aggregate data on the subject level
  const process = ({ data }) => {
    const dataByTask = data
      .filter((result) => filteredDatasetTokens?.includes(result?.metadataId))
      .map((result) => {
        const userID =
          result?.user?.publicReadableId ||
          result?.user?.publicId ||
          result?.user?.id ||
          "john-doe";

        const guestID =
          result?.guest?.publicReadableId ||
          result?.guest?.publicId ||
          result?.guest?.id ||
          "john-doe";

        const participantId = result?.guest ? guestID : userID;
        const classCode =
          result?.user?.studentIn?.map((c) => c?.code) || undefined;
        const userType = result?.guest ? "guest" : "user";

        // record the between-subjects condition of the participant
        const personalID =
          (result?.guest ? result?.guest?.publicId : result?.user?.publicId) ||
          "";
        const [participant] = participantsInStudy.filter(
          (participant) => participant?.publicId === personalID
        );
        let condition;
        if (participant?.studiesInfo?.[study?.id]) {
          condition = participant?.studiesInfo[study?.id]?.info?.path
            .filter((stage) => stage?.conditionLabel)
            .map((stage) => stage.conditionLabel)[0];
        }
        const [dataPolicy] = datasets
          .filter((d) => d?.token === result?.metadataId)
          .map((d) => d?.dataPolicy);

        return {
          participant: participantId,
          classCode,
          userType,
          study: result.study.title,
          task: result.task?.title,
          testVersion: result.testVersion,
          subtitle: components
            ?.filter((c) => c?.testId === result.testVersion)
            .map((c) => c?.subtitle),
          timestamp: result.createdAt,
          condition,
          dataPolicy,
          ...result.data,
        };
      });

    if (by === "by participant") {
      const allParticipants = dataByTask.map((row) => row?.participant);
      const participants = [...new Set(allParticipants)];
      const dataByParticipant = participants.map((participant) => {
        const data = {};
        const participantData = dataByTask.filter(
          (row) => row?.participant === participant
        );
        participantData.map((row) => {
          Object.keys(row).map((key) => {
            const newKey = `${row?.task?.replace(/\s/g, "_")}_${
              row?.testVersion
            }_${key}`;
            data[newKey] = row[key];
          });
        });
        return {
          participant,
          ...data,
        };
      });
      return dataByParticipant;
    }
    return dataByTask;
  };

  // download the current state of the data as a csv file
  const save = ({ data }) => {
    const name = `${study?.slug}_${by}_${moment().format()}`;
    const allKeys = data
      .map((line) => Object.keys(line))
      .reduce((a, b) => a.concat(b), []);
    const keys = Array.from(new Set(allKeys));
    const csv = jsonToCSV({ fields: keys, data });
    const blob = new Blob([csv], {
      type: "text/csv",
    });
    saveAs(blob, `${name}.csv`);
  };

  const download = async () => {
    setLoading(true);
    const { summaryResults } = study;
    save({ data: process({ data: summaryResults }) });
    setLoading(false);
  };

  return (
    <>
      {loading ? (
        <div>Wait ...</div>
      ) : (
        <div className="downloadArea" onClick={() => download()}>
          <Icon color="teal" size="large" name="download" />
          <a>Download aggregated data {by}</a>
        </div>
      )}
    </>
  );
}
