import { useState } from "react";
import { Dropdown, Icon } from "semantic-ui-react";

import { saveAs } from "file-saver";
import { jsonToCSV } from "react-papaparse";
import moment from "moment";

const LZUTF8 = require("lzutf8");

export default function DownloadByComponent({
  studyId,
  study,
  components,
  participantsInStudy,
  datasets,
}) {
  const [selected, setSelected] = useState([]);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingRaw, setLoadingRaw] = useState(false);

  const options = components.map((c) => ({
    ...c,
    key: c?.testId,
    text: `${c?.name} (${c?.subtitle || "no subtitle"}) (${c?.testId})`,
    value: c?.testId,
  }));

  const onChange = (event, data) => {
    setSelected(data?.value);
  };

  // pre-process and aggregate data on the subject level
  const process = ({ data }) => {
    const dataByTask = data.map((result) => {
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
        task: result.task.title,
        testVersion: result.testVersion,
        subtitle: components
          .filter((c) => c?.testId === result.testVersion)
          .map((c) => c?.subtitle),
        timestamp: result.createdAt,
        condition,
        dataPolicy,
        ...result.data,
      };
    });
    return dataByTask;
  };

  // takes in the raw data and merge it together
  // it can extract either incremental or full data (dependent on what is available)
  const processRaw = ({ data }) => {
    const rows = data
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
          dataPolicy: datasets
            .filter((d) => d?.token === result?.metadata?.id)
            .map((d) => d?.dataPolicy),
        }))
      )
      .reduce((a, b) => a.concat(b), []);

    return rows;
  };

  // download the current state of the data as a csv file
  const save = ({ data, task, type }) => {
    const name = `${task?.name}_${
      task?.subtitle || task?.testId
    }_${type}_${moment().format()}`;
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

  const resolvePromisesSeq = async (tasks) => {
    const results = [];
    for (const task of tasks) {
      results.push(await task);
    }
    return results;
  };

  const downloadAggregated = async () => {
    setLoadingSummary(true);
    const { summaryResults } = study;
    const downloadPromises = selected.map(async (taskId) => {
      const taskResults = summaryResults.filter(
        (res) => res?.testVersion === taskId
      );
      save({
        data: process({ data: taskResults }),
        task: components.filter((c) => c?.testId === taskId)[0],
        type: "aggregated",
      });
    });
    await resolvePromisesSeq(downloadPromises);
    setLoadingSummary(false);
  };

  const downloadRaw = async () => {
    setLoadingRaw(true);

    // select only files for chosen components
    const fileDirs =
      study?.datasets?.map(
        (dataset) => dataset?.date.replaceAll("-", "/") + "/" + dataset?.token
      ) || [];

    // get the files from the server
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileDirs }),
    };
    const response = await fetch(`/api/download/rawfiles`, requestOptions);
    const data = await response.json();

    const downloadPromises = selected.map(async (taskId) => {
      const taskResults = data.filter(
        (res) => res?.metadata?.testVersion === taskId
      );
      save({
        data: processRaw({ data: taskResults }),
        task: components.filter((c) => c?.testId === taskId)[0],
        type: "raw",
      });
    });
    await resolvePromisesSeq(downloadPromises);
    setLoadingRaw(false);
  };

  return (
    <div className="downloadByComponent">
      <h3>Data by task in separate files</h3>
      <Dropdown
        placeholder="Select tasks or surveys"
        fluid
        multiple
        search
        selection
        options={options}
        onChange={onChange}
        value={selected}
      />
      <>
        {loadingSummary ? (
          <div>Wait ...</div>
        ) : (
          <div className="downloadArea" onClick={() => downloadAggregated()}>
            <Icon color="teal" size="large" name="download" />
            <a>Download aggregated data</a>
          </div>
        )}
      </>
      <>
        {loadingRaw ? (
          <div>Wait ...</div>
        ) : (
          <div className="downloadArea" onClick={() => downloadRaw()}>
            <Icon color="teal" size="large" name="download" />
            <a>Download raw data</a>
          </div>
        )}
      </>
    </div>
  );
}
